import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { useContacts, useNextInvoiceNumber, useCreateInvoice, validateVatSetup, suggestVatTreatment, VAT_PERCENTAGES, type InvoiceLineInput } from "@/hooks/useInvoices";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type VatRateType = Database["public"]["Enums"]["vat_rate_type"];

const VAT_OPTIONS: Array<{ value: VatRateType; label: string; pct: number }> = [
  { value: "high", label: "21%", pct: 21 },
  { value: "low", label: "9%", pct: 9 },
  { value: "zero", label: "0%", pct: 0 },
  { value: "exempt", label: "Vrijgesteld", pct: 0 },
  { value: "reverse_charge", label: "Verlegd", pct: 0 },
  { value: "icp", label: "ICP", pct: 0 },
  { value: "export", label: "Export", pct: 0 },
];

const VAT_BOX_MAP: Record<string, string> = {
  high: "1a", low: "1b", zero: "1c", reverse_charge: "1e",
  icp: "3b", export: "3a", exempt: "—", import: "4a",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

function emptyLine(): InvoiceLineInput {
  return { description: "", quantity: 1, unit_price: 0, vat_rate_type: "high", vat_percentage: 21 };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SalesInvoiceForm({ open, onClose }: Props) {
  const { data: contacts = [] } = useContacts();
  const { data: nextNumber = "" } = useNextInvoiceNumber("sales");
  const createInvoice = useCreateInvoice();

  const today = new Date().toISOString().split("T")[0];
  const defaultDue = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [contactId, setContactId] = useState<string | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState(defaultDue);
  const [lines, setLines] = useState<InvoiceLineInput[]>([emptyLine()]);
  const [notes, setNotes] = useState("");

  const selectedContact = contacts.find((c) => c.id === contactId) ?? null;

  // Auto-suggest VAT when contact changes
  useEffect(() => {
    if (selectedContact) {
      const suggested = suggestVatTreatment(selectedContact);
      setLines((prev) =>
        prev.map((l) => ({
          ...l,
          vat_rate_type: suggested,
          vat_percentage: VAT_PERCENTAGES[suggested] ?? 0,
        }))
      );
    }
  }, [contactId]);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const updateLine = (i: number, patch: Partial<InvoiceLineInput>) => {
    setLines((prev) =>
      prev.map((l, j) => {
        if (j !== i) return l;
        const updated = { ...l, ...patch };
        if (patch.vat_rate_type) {
          updated.vat_percentage = VAT_PERCENTAGES[patch.vat_rate_type] ?? 0;
        }
        return updated;
      })
    );
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    const vatByType: Record<string, { base: number; vat: number; pct: number; box: string }> = {};

    for (const line of lines) {
      const lt = line.quantity * line.unit_price;
      const va = lt * (line.vat_percentage / 100);
      subtotal += lt;

      const key = line.vat_rate_type;
      if (!vatByType[key]) {
        vatByType[key] = { base: 0, vat: 0, pct: line.vat_percentage, box: VAT_BOX_MAP[key] || "—" };
      }
      vatByType[key].base += lt;
      vatByType[key].vat += va;
    }

    const totalVat = Object.values(vatByType).reduce((s, v) => s + v.vat, 0);
    return { subtotal, totalVat, total: subtotal + totalVat, vatByType };
  }, [lines]);

  const vatWarnings = useMemo(() => {
    return lines
      .map((l, i) => ({ ...validateVatSetup(selectedContact, l.vat_rate_type), index: i }))
      .filter((w) => !w.valid);
  }, [lines, selectedContact]);

  const handleSave = async (status: "draft" | "sent") => {
    if (lines.every((l) => !l.description)) {
      toast.error("Voeg minimaal één regel toe");
      return;
    }

    try {
      await createInvoice.mutateAsync({
        contact_id: contactId,
        contact_name: selectedContact?.name ?? (contactSearch || "Onbekend"),
        invoice_date: invoiceDate,
        due_date: dueDate,
        invoice_type: "sales",
        notes,
        lines: lines.filter((l) => l.description),
        status,
      });
      toast.success(status === "sent" ? "Factuur geboekt" : "Concept opgeslagen");
      onClose();
    } catch (err: unknown) {
      toast.error("Fout bij opslaan: " + (err instanceof Error ? err.message : "onbekend"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>Nieuwe verkoopfactuur</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Contact */}
          <div className="space-y-2">
            <Label>Relatie</Label>
            <Input
              placeholder="Zoek relatie..."
              value={contactSearch}
              onChange={(e) => {
                setContactSearch(e.target.value);
                if (!e.target.value) setContactId(null);
              }}
              className="bg-secondary border-border"
            />
            {contactSearch && !contactId && filteredContacts.length > 0 && (
              <div className="bg-popover border border-border rounded-md max-h-32 overflow-y-auto">
                {filteredContacts.slice(0, 8).map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary"
                    onClick={() => {
                      setContactId(c.id);
                      setContactSearch(c.name);
                    }}
                  >
                    {c.name}
                    {c.btw_number && <span className="ml-2 text-muted-foreground text-xs">{c.btw_number}</span>}
                  </button>
                ))}
              </div>
            )}
            {selectedContact && (
              <div className="text-xs text-muted-foreground">
                {selectedContact.address_country ?? "NL"}
                {selectedContact.btw_number && ` · ${selectedContact.btw_number}`}
              </div>
            )}
          </div>

          {/* Invoice number */}
          <div className="space-y-2">
            <Label>Factuurnummer</Label>
            <Input value={nextNumber} disabled className="bg-secondary border-border font-mono" />
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <Label>Factuurdatum</Label>
            <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label>Vervaldatum</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-secondary border-border" />
          </div>
        </div>

        {/* VAT Warnings */}
        {vatWarnings.length > 0 && (
          <div className="mt-4 space-y-1">
            {vatWarnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 px-3 py-2 rounded-md">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Regel {w.index + 1}: {w.warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Line items */}
        <div className="mt-6">
          <Label className="mb-2 block">Regels</Label>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_100px_140px_100px_36px] gap-2 text-xs text-muted-foreground px-1">
              <span>Omschrijving</span>
              <span>Aantal</span>
              <span>Prijs</span>
              <span>BTW</span>
              <span className="text-right">Bedrag</span>
              <span />
            </div>
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_100px_140px_100px_36px] gap-2 items-center">
                <Input
                  placeholder="Omschrijving"
                  value={line.description}
                  onChange={(e) => updateLine(i, { description: e.target.value })}
                  className="bg-secondary border-border text-sm"
                />
                <Input
                  type="number"
                  min="0"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, { quantity: parseFloat(e.target.value) || 0 })}
                  className="bg-secondary border-border text-sm"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unit_price}
                  onChange={(e) => updateLine(i, { unit_price: parseFloat(e.target.value) || 0 })}
                  className="bg-secondary border-border text-sm"
                />
                <Select
                  value={line.vat_rate_type}
                  onValueChange={(v) => updateLine(i, { vat_rate_type: v as VatRateType })}
                >
                  <SelectTrigger className="bg-secondary border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VAT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-right text-sm font-medium">
                  {fmt(line.quantity * line.unit_price)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setLines((prev) => prev.filter((_, j) => j !== i))}
                  disabled={lines.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-primary"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
          >
            <Plus className="h-4 w-4 mr-1" /> Regel toevoegen
          </Button>
        </div>

        {/* Totals & VAT summary */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          {/* VAT Summary */}
          <div className="space-y-2">
            <Label>BTW-overzicht</Label>
            <div className="bg-secondary rounded-md p-3 space-y-1 text-sm">
              {Object.entries(totals.vatByType).map(([type, v]) => (
                <div key={type} className="flex justify-between">
                  <span>
                    {VAT_OPTIONS.find((o) => o.value === type)?.label ?? type}
                    <span className="text-muted-foreground ml-2">(Vak {v.box})</span>
                  </span>
                  <span>
                    {fmt(v.base)} → {fmt(v.vat)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotaal</span>
              <span>{fmt(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">BTW</span>
              <span>{fmt(totals.totalVat)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t border-border pt-2">
              <span>Totaal</span>
              <span>{fmt(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4 space-y-2">
          <Label>Notities</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optionele opmerkingen..."
            className="bg-secondary border-border"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button
            variant="secondary"
            onClick={() => handleSave("draft")}
            disabled={createInvoice.isPending}
          >
            Opslaan als concept
          </Button>
          <Button
            onClick={() => handleSave("sent")}
            disabled={createInvoice.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Boeken
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
