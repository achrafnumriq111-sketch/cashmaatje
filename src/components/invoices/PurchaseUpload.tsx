import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useContacts, useCreateInvoice, VAT_PERCENTAGES } from "@/hooks/useInvoices";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type VatRateType = Database["public"]["Enums"]["vat_rate_type"];

interface OcrResult {
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  iban: string;
  vat_number: string;
  currency: string;
  confidence: Record<string, number>;
  is_duplicate: boolean;
  duplicate_invoice_id?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PurchaseUpload({ open, onClose }: Props) {
  const { membership } = useOrganization();
  const { data: contacts = [] } = useContacts();
  const createInvoice = useCreateInvoice();

  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [fileName, setFileName] = useState("");

  // Editable fields
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [vatAmount, setVatAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [contactId, setContactId] = useState<string | null>(null);
  const [vatRateType, setVatRateType] = useState<VatRateType>("high");

  const processFile = useCallback(async (file: File) => {
    if (!membership?.organizationId) return;

    setProcessing(true);
    setFileName(file.name);

    try {
      // Call OCR edge function
      const formData = new FormData();
      formData.append("file", file);
      formData.append("organization_id", membership.organizationId);

      const { data, error } = await supabase.functions.invoke("process-purchase-invoice", {
        body: formData,
      });

      if (error) throw error;

      const result = data as OcrResult;
      setOcrResult(result);
      setSupplierName(result.supplier_name || "");
      setInvoiceNumber(result.invoice_number || "");
      setInvoiceDate(result.invoice_date || new Date().toISOString().split("T")[0]);
      setSubtotal(result.subtotal || 0);
      setVatAmount(result.vat_amount || 0);
      setTotalAmount(result.total_amount || 0);

      // Try to match contact
      const matchedContact = contacts.find(
        (c) =>
          c.name.toLowerCase().includes(result.supplier_name?.toLowerCase() ?? "") ||
          c.btw_number === result.vat_number
      );
      if (matchedContact) setContactId(matchedContact.id);
    } catch (err) {
      // If edge function doesn't exist yet, show manual entry
      toast.info("OCR niet beschikbaar — vul handmatig in");
      setOcrResult(null);
    } finally {
      setProcessing(false);
    }
  }, [membership, contacts]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  const ConfidenceBadge = ({ field }: { field: string }) => {
    if (!ocrResult?.confidence?.[field]) return null;
    const c = ocrResult.confidence[field];
    const color = c > 0.8 ? "bg-primary/20 text-primary" : c > 0.5 ? "bg-yellow-500/20 text-yellow-400" : "bg-destructive/20 text-destructive";
    return <Badge className={`${color} text-xs ml-2`}>{Math.round(c * 100)}%</Badge>;
  };

  const handleSave = async () => {
    if (!invoiceNumber) {
      toast.error("Factuurnummer is verplicht");
      return;
    }

    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    try {
      await createInvoice.mutateAsync({
        contact_id: contactId,
        contact_name: supplierName || "Onbekend",
        invoice_date: invoiceDate,
        due_date: dueDate.toISOString().split("T")[0],
        invoice_type: "purchase",
        notes: "",
        lines: [
          {
            description: `Inkoopfactuur ${invoiceNumber}`,
            quantity: 1,
            unit_price: subtotal,
            vat_rate_type: vatRateType,
            vat_percentage: VAT_PERCENTAGES[vatRateType] ?? 21,
          },
        ],
        status: "sent",
      });
      toast.success("Inkoopfactuur opgeslagen");
      onClose();
    } catch (err: unknown) {
      toast.error("Fout bij opslaan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>Inkoopfactuur uploaden</DialogTitle>
        </DialogHeader>

        {/* Upload area */}
        {!fileName && (
          <div
            className={`mt-4 border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragging ? "border-primary bg-primary/5" : "border-border"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Sleep een factuur hierheen of klik om te uploaden
            </p>
            <p className="text-xs text-muted-foreground mb-4">PDF, JPG, PNG (max 10MB)</p>
            <label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileInput} className="hidden" />
              <Button variant="secondary" asChild>
                <span>Bestand kiezen</span>
              </Button>
            </label>
          </div>
        )}

        {processing && (
          <div className="mt-4 p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Factuur verwerken...</p>
          </div>
        )}

        {/* OCR Results / Manual entry */}
        {fileName && !processing && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>{fileName}</span>
              <Button variant="ghost" size="sm" onClick={() => { setFileName(""); setOcrResult(null); }}>
                Ander bestand
              </Button>
            </div>

            {ocrResult?.is_duplicate && (
              <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-3 rounded-md">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">Mogelijke duplicaat gedetecteerd!</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Leverancier
                  <ConfidenceBadge field="supplier_name" />
                </Label>
                <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>
                  Factuurnummer
                  <ConfidenceBadge field="invoice_number" />
                </Label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>
                  Factuurdatum
                  <ConfidenceBadge field="invoice_date" />
                </Label>
                <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Relatie</Label>
                <Select value={contactId ?? ""} onValueChange={(v) => setContactId(v || null)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecteer relatie..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Subtotaal
                  <ConfidenceBadge field="subtotal" />
                </Label>
                <Input type="number" step="0.01" value={subtotal} onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>
                  BTW
                  <ConfidenceBadge field="vat_amount" />
                </Label>
                <Input type="number" step="0.01" value={vatAmount} onChange={(e) => setVatAmount(parseFloat(e.target.value) || 0)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>
                  Totaal
                  <ConfidenceBadge field="total_amount" />
                </Label>
                <Input type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>BTW-tarief</Label>
                <Select value={vatRateType} onValueChange={(v) => setVatRateType(v as VatRateType)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">21%</SelectItem>
                    <SelectItem value="low">9%</SelectItem>
                    <SelectItem value="zero">0%</SelectItem>
                    <SelectItem value="reverse_charge">Verlegd</SelectItem>
                    <SelectItem value="icp">ICP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={onClose}>Annuleren</Button>
              <Button
                onClick={handleSave}
                disabled={createInvoice.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Valideren & opslaan
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
