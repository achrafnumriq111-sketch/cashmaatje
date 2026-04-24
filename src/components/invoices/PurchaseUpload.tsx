import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, AlertTriangle, CheckCircle2, Loader2, Trash2, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useContacts, useCreateInvoice, VAT_PERCENTAGES } from "@/hooks/useInvoices";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

type VatRateType = Database["public"]["Enums"]["vat_rate_type"];

type RowStatus = "uploading" | "ocr" | "ready" | "saving" | "saved" | "error";

interface InvoiceRow {
  id: string;
  fileName: string;
  status: RowStatus;
  errorMessage?: string;
  isDuplicate?: boolean;
  confidence: Record<string, number>;
  // Editable fields
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  contactId: string | null;
  vatRateType: VatRateType;
  // Suggested new contact details from OCR
  suggestedIban?: string;
  suggestedVatNumber?: string;
  // New-contact form (when user expands "create new")
  createNewContact: boolean;
  newContactEmail: string;
  newContactKvk: string;
  expanded: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const newRow = (fileName: string): InvoiceRow => ({
  id: crypto.randomUUID(),
  fileName,
  status: "uploading",
  confidence: {},
  supplierName: "",
  invoiceNumber: "",
  invoiceDate: new Date().toISOString().split("T")[0],
  subtotal: 0,
  vatAmount: 0,
  totalAmount: 0,
  contactId: null,
  vatRateType: "high",
  createNewContact: false,
  newContactEmail: "",
  newContactKvk: "",
  expanded: true,
});

export function PurchaseUpload({ open, onClose }: Props) {
  const { membership } = useOrganization();
  const { data: contacts = [] } = useContacts();
  const createInvoice = useCreateInvoice();
  const qc = useQueryClient();

  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [savingAll, setSavingAll] = useState(false);

  const updateRow = (id: string, patch: Partial<InvoiceRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  const processFile = useCallback(
    async (file: File) => {
      const orgId = membership?.organizationId;
      if (!orgId) return;

      const row = newRow(file.name);
      setRows((rs) => [...rs, row]);

      try {
        // Upload
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const filePath = `${orgId}/${year}/${month}/${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file, { contentType: file.type });
        if (uploadError) throw uploadError;

        // Create document record
        const { data: doc, error: docError } = await supabase
          .from("documents")
          .insert({
            organization_id: orgId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            document_type: "invoice",
            ocr_status: "pending",
          })
          .select()
          .single();
        if (docError) throw docError;

        updateRow(row.id, { status: "ocr" });

        // OCR
        const { error: ocrError } = await supabase.functions.invoke("process-invoice-ocr", {
          body: { document_id: doc.id, file_path: filePath, organization_id: orgId },
        });
        if (ocrError) throw ocrError;

        // Re-fetch
        const { data: processed } = await supabase
          .from("documents")
          .select("*")
          .eq("id", doc.id)
          .single();

        if (!processed) throw new Error("Document niet gevonden");

        const ocrData = (processed.ocr_data ?? {}) as Record<string, unknown>;
        const confidence = (ocrData.confidence ?? {}) as Record<string, number>;
        const vatRateDetected = (processed.vat_rate_type_detected as VatRateType | null) ?? "high";
        const total = Number(processed.extracted_amount ?? 0);
        const vat = Number(processed.extracted_vat_amount ?? 0);
        const sub = total > 0 && vat >= 0 ? Math.max(total - vat, 0) : 0;
        const supplierName = processed.extracted_supplier_name ?? "";
        const vatNumber = processed.extracted_vat_number ?? "";

        // Match contact
        let contactId: string | null = processed.contact_id ?? null;
        if (!contactId && supplierName) {
          const needle = supplierName.toLowerCase();
          const matched = contacts.find(
            (c) =>
              c.name.toLowerCase().includes(needle) ||
              needle.includes(c.name.toLowerCase()) ||
              (vatNumber && c.btw_number === vatNumber)
          );
          if (matched) contactId = matched.id;
        }

        updateRow(row.id, {
          status: "ready",
          confidence,
          isDuplicate: !!processed.is_duplicate,
          supplierName,
          invoiceNumber: processed.extracted_invoice_number ?? "",
          invoiceDate: processed.extracted_date ?? new Date().toISOString().split("T")[0],
          subtotal: sub,
          vatAmount: vat,
          totalAmount: total,
          contactId,
          vatRateType: vatRateDetected,
          suggestedIban: processed.extracted_iban ?? "",
          suggestedVatNumber: vatNumber,
          // If no match found, default to "create new" mode
          createNewContact: !contactId && !!supplierName,
        });
      } catch (err) {
        console.error("OCR error:", err);
        updateRow(row.id, {
          status: "error",
          errorMessage: err instanceof Error ? err.message : "Verwerking mislukt",
        });
      }
    },
    [membership, contacts]
  );

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => processFile(f));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    []
  );

  /**
   * Create a contact for this row from OCR-extracted info.
   * Returns the new contact id or throws.
   */
  const createContactForRow = async (row: InvoiceRow): Promise<string> => {
    const orgId = membership?.organizationId;
    if (!orgId) throw new Error("Geen organisatie");
    if (!row.supplierName.trim()) throw new Error("Naam relatie is verplicht");

    const { data, error } = await supabase
      .from("contacts")
      .insert({
        organization_id: orgId,
        name: row.supplierName.trim(),
        btw_number: row.suggestedVatNumber?.trim() || null,
        kvk_number: row.newContactKvk.trim() || null,
        iban: row.suggestedIban?.trim() || null,
        email: row.newContactEmail.trim() || null,
        is_supplier: true,
        is_customer: false,
        is_active: true,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Relatie kon niet worden aangemaakt");
    return data.id;
  };

  const saveRow = async (row: InvoiceRow): Promise<boolean> => {
    if (!row.invoiceNumber.trim()) {
      updateRow(row.id, { status: "error", errorMessage: "Factuurnummer ontbreekt" });
      return false;
    }
    updateRow(row.id, { status: "saving", errorMessage: undefined });

    try {
      // Resolve contact: existing, or create new
      let contactId = row.contactId;
      if (!contactId && row.createNewContact) {
        contactId = await createContactForRow(row);
        // Refresh contacts list so other rows can use it too
        qc.invalidateQueries({ queryKey: ["contacts"] });
      }

      const dueDate = new Date(row.invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);

      await createInvoice.mutateAsync({
        contact_id: contactId,
        contact_name: row.supplierName || "Onbekend",
        invoice_date: row.invoiceDate,
        due_date: dueDate.toISOString().split("T")[0],
        invoice_type: "purchase",
        notes: "",
        lines: [
          {
            description: `Inkoopfactuur ${row.invoiceNumber}`,
            quantity: 1,
            unit_price: row.subtotal,
            vat_rate_type: row.vatRateType,
            vat_percentage: VAT_PERCENTAGES[row.vatRateType] ?? 21,
          },
        ],
        status: "sent",
      });

      updateRow(row.id, { status: "saved", contactId });
      return true;
    } catch (err) {
      console.error("Save error:", err);
      updateRow(row.id, {
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Opslaan mislukt",
      });
      return false;
    }
  };

  const handleSaveAll = async () => {
    const ready = rows.filter((r) => r.status === "ready" || r.status === "error");
    if (ready.length === 0) {
      toast.info("Geen facturen klaar om op te slaan");
      return;
    }
    setSavingAll(true);
    let ok = 0;
    let fail = 0;
    for (const row of ready) {
      // Read latest row state
      const latest = rows.find((r) => r.id === row.id);
      if (!latest) continue;
      const success = await saveRow(latest);
      if (success) ok++;
      else fail++;
    }
    setSavingAll(false);
    if (ok > 0) toast.success(`${ok} factuur${ok > 1 ? "en" : ""} opgeslagen`);
    if (fail > 0) toast.error(`${fail} factuur${fail > 1 ? "en" : ""} mislukt`);
    if (fail === 0 && ok > 0) {
      // Auto-close on full success
      setTimeout(() => {
        setRows([]);
        onClose();
      }, 600);
    }
  };

  const handleClose = () => {
    if (rows.some((r) => r.status === "uploading" || r.status === "ocr" || r.status === "saving")) {
      toast.info("Wacht tot alle facturen verwerkt zijn");
      return;
    }
    setRows([]);
    onClose();
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  const ConfidenceBadge = ({ row, field }: { row: InvoiceRow; field: string }) => {
    const c = row.confidence?.[field];
    if (!c) return null;
    const color =
      c > 0.8
        ? "bg-primary/20 text-primary"
        : c > 0.5
          ? "bg-yellow-500/20 text-yellow-400"
          : "bg-destructive/20 text-destructive";
    return <Badge className={`${color} text-xs ml-2`}>{Math.round(c * 100)}%</Badge>;
  };

  const StatusPill = ({ row }: { row: InvoiceRow }) => {
    switch (row.status) {
      case "uploading":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Uploaden
          </Badge>
        );
      case "ocr":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> OCR
          </Badge>
        );
      case "ready":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Klaar voor review
          </Badge>
        );
      case "saving":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Opslaan
          </Badge>
        );
      case "saved":
        return (
          <Badge className="bg-primary/20 text-primary gap-1">
            <CheckCircle2 className="h-3 w-3" /> Opgeslagen
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-destructive/20 text-destructive gap-1">
            <AlertTriangle className="h-3 w-3" /> Fout
          </Badge>
        );
    }
  };

  const readyCount = rows.filter((r) => r.status === "ready").length;
  const hasFiles = rows.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>Inkoopfacturen uploaden</DialogTitle>
        </DialogHeader>

        {/* Drop zone — always present so user can keep adding */}
        <div
          className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-1">
            Sleep één of meerdere facturen hierheen
          </p>
          <p className="text-xs text-muted-foreground mb-3">PDF, JPG, PNG (max 10MB elk)</p>
          <label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <Button variant="secondary" asChild>
              <span>Bestanden kiezen</span>
            </Button>
          </label>
        </div>

        {/* Rows */}
        {hasFiles && (
          <div className="mt-4 space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="border border-border rounded-lg bg-secondary/20 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => updateRow(row.id, { expanded: !row.expanded })}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={row.expanded ? "Inklappen" : "Uitklappen"}
                    >
                      {row.expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{row.fileName}</p>
                      {row.status === "ready" && (
                        <p className="text-xs text-muted-foreground truncate">
                          {row.supplierName || "—"} · {row.invoiceNumber || "geen nr"} ·{" "}
                          {fmt(row.totalAmount)}
                        </p>
                      )}
                      {row.errorMessage && (
                        <p className="text-xs text-destructive truncate">{row.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill row={row} />
                    {row.status !== "saving" && row.status !== "uploading" && row.status !== "ocr" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(row.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Body */}
                {row.expanded && row.status !== "uploading" && row.status !== "ocr" && (
                  <div className="p-4 space-y-4">
                    {row.isDuplicate && (
                      <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-2 rounded-md">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          Mogelijke duplicaat — controleer factuurnummer
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Leverancier
                          <ConfidenceBadge row={row} field="supplier_name" />
                        </Label>
                        <Input
                          value={row.supplierName}
                          onChange={(e) => updateRow(row.id, { supplierName: e.target.value })}
                          className="bg-background border-border h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Factuurnummer
                          <ConfidenceBadge row={row} field="invoice_number" />
                        </Label>
                        <Input
                          value={row.invoiceNumber}
                          onChange={(e) => updateRow(row.id, { invoiceNumber: e.target.value })}
                          className="bg-background border-border h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Factuurdatum
                          <ConfidenceBadge row={row} field="invoice_date" />
                        </Label>
                        <Input
                          type="date"
                          value={row.invoiceDate}
                          onChange={(e) => updateRow(row.id, { invoiceDate: e.target.value })}
                          className="bg-background border-border h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">BTW-tarief (→ grootboek/journaalpost)</Label>
                        <Select
                          value={row.vatRateType}
                          onValueChange={(v) => updateRow(row.id, { vatRateType: v as VatRateType })}
                        >
                          <SelectTrigger className="bg-background border-border h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">21% (hoog)</SelectItem>
                            <SelectItem value="low">9% (laag)</SelectItem>
                            <SelectItem value="zero">0%</SelectItem>
                            <SelectItem value="reverse_charge">Verlegd</SelectItem>
                            <SelectItem value="icp">ICP (EU)</SelectItem>
                            <SelectItem value="import">Invoer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Subtotaal (excl. BTW)
                          <ConfidenceBadge row={row} field="subtotal" />
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={row.subtotal}
                          onChange={(e) =>
                            updateRow(row.id, { subtotal: parseFloat(e.target.value) || 0 })
                          }
                          className="bg-background border-border h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          BTW-bedrag
                          <ConfidenceBadge row={row} field="vat_amount" />
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={row.vatAmount}
                          onChange={(e) =>
                            updateRow(row.id, { vatAmount: parseFloat(e.target.value) || 0 })
                          }
                          className="bg-background border-border h-9"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-xs">
                          Totaal (incl. BTW)
                          <ConfidenceBadge row={row} field="total_amount" />
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={row.totalAmount}
                          onChange={(e) =>
                            updateRow(row.id, { totalAmount: parseFloat(e.target.value) || 0 })
                          }
                          className="bg-background border-border h-9"
                        />
                      </div>
                    </div>

                    {/* Contact resolution */}
                    <div className="border-t border-border pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">
                          Relatie (→ debiteuren/crediteuren grootboek)
                        </Label>
                        {!row.contactId && row.supplierName && (
                          <Badge className="bg-amber-500/15 text-amber-400 border-0 text-[10px]">
                            Onbekende leverancier
                          </Badge>
                        )}
                      </div>

                      {/* Toggle: pick existing or create new */}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={!row.createNewContact ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateRow(row.id, { createNewContact: false })}
                        >
                          Bestaande relatie
                        </Button>
                        <Button
                          type="button"
                          variant={row.createNewContact ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateRow(row.id, { createNewContact: true })}
                          className="gap-1"
                        >
                          <UserPlus className="h-3 w-3" /> Nieuwe relatie aanmaken
                        </Button>
                      </div>

                      {!row.createNewContact ? (
                        <Select
                          value={row.contactId ?? ""}
                          onValueChange={(v) => updateRow(row.id, { contactId: v || null })}
                        >
                          <SelectTrigger className="bg-background border-border h-9">
                            <SelectValue placeholder="Selecteer relatie..." />
                          </SelectTrigger>
                          <SelectContent>
                            {contacts.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-md bg-background border border-border">
                          <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs">Naam *</Label>
                            <Input
                              value={row.supplierName}
                              onChange={(e) =>
                                updateRow(row.id, { supplierName: e.target.value })
                              }
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">BTW-nummer</Label>
                            <Input
                              value={row.suggestedVatNumber ?? ""}
                              onChange={(e) =>
                                updateRow(row.id, { suggestedVatNumber: e.target.value })
                              }
                              placeholder="NL123456789B01"
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">KvK-nummer</Label>
                            <Input
                              value={row.newContactKvk}
                              onChange={(e) =>
                                updateRow(row.id, { newContactKvk: e.target.value })
                              }
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">IBAN</Label>
                            <Input
                              value={row.suggestedIban ?? ""}
                              onChange={(e) =>
                                updateRow(row.id, { suggestedIban: e.target.value })
                              }
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">E-mail</Label>
                            <Input
                              type="email"
                              value={row.newContactEmail}
                              onChange={(e) =>
                                updateRow(row.id, { newContactEmail: e.target.value })
                              }
                              className="h-9"
                            />
                          </div>
                          <p className="md:col-span-2 text-[11px] text-muted-foreground">
                            Bij opslaan wordt deze relatie aangemaakt en de factuur eraan
                            gekoppeld. Volgende facturen van dezelfde leverancier worden
                            automatisch herkend.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer actions */}
        {hasFiles && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {readyCount > 0
                ? `${readyCount} factuur${readyCount > 1 ? "en" : ""} klaar om op te slaan`
                : "Wacht tot OCR klaar is..."}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>
                Sluiten
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={savingAll || readyCount === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {savingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Bezig...
                  </>
                ) : (
                  `Alles opslaan (${readyCount})`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
