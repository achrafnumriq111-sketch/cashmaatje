import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, ExternalLink, Link2, ShoppingCart, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Document = Database["public"]["Tables"]["documents"]["Row"];

interface Props {
  document: Document;
  onClose: () => void;
  onUpdate: (updates: Record<string, unknown>) => void;
  orgId: string | undefined;
}

interface OcrConfidence {
  supplier_name?: number;
  invoice_number?: number;
  invoice_date?: number;
  vat_number?: number;
  subtotal?: number;
  total_amount?: number;
  iban?: number;
  payment_reference?: number;
  vat_amounts?: number;
}

function ConfidenceDot({ value }: { value?: number }) {
  if (value == null) return null;
  const color =
    value >= 0.8
      ? "bg-primary"
      : value >= 0.5
      ? "bg-yellow-500"
      : "bg-destructive";
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${color}`}
      title={`Betrouwbaarheid: ${Math.round(value * 100)}%`}
    />
  );
}

export function DocumentDetail({ document: doc, onClose, onUpdate, orgId }: Props) {
  const confidence: OcrConfidence =
    (doc.ocr_data as Record<string, unknown>)?.confidence as OcrConfidence ?? {};

  const [form, setForm] = useState({
    supplier_name: doc.extracted_supplier_name ?? "",
    invoice_number: doc.extracted_invoice_number ?? "",
    invoice_date: doc.extracted_date ?? "",
    vat_number: doc.extracted_vat_number ?? "",
    subtotal: "",
    vat_amount: doc.extracted_vat_amount?.toString() ?? "",
    total_amount: doc.extracted_amount?.toString() ?? "",
    iban: doc.extracted_iban ?? "",
    payment_reference: "",
  });

  useEffect(() => {
    const ocrData = doc.ocr_data as Record<string, unknown> | null;
    setForm({
      supplier_name: doc.extracted_supplier_name ?? "",
      invoice_number: doc.extracted_invoice_number ?? "",
      invoice_date: doc.extracted_date ?? "",
      vat_number: doc.extracted_vat_number ?? "",
      subtotal: (ocrData?.subtotal as number)?.toString() ?? "",
      vat_amount: doc.extracted_vat_amount?.toString() ?? "",
      total_amount: doc.extracted_amount?.toString() ?? "",
      iban: doc.extracted_iban ?? "",
      payment_reference: (ocrData?.payment_reference as string) ?? "",
    });
  }, [doc]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = () => {
    onUpdate({
      extracted_supplier_name: form.supplier_name || null,
      extracted_invoice_number: form.invoice_number || null,
      extracted_date: form.invoice_date || null,
      extracted_vat_number: form.vat_number || null,
      extracted_amount: form.total_amount ? parseFloat(form.total_amount) : null,
      extracted_vat_amount: form.vat_amount ? parseFloat(form.vat_amount) : null,
      extracted_iban: form.iban || null,
      is_validated: true,
      validated_at: new Date().toISOString(),
    });
  };

  const handleValidateVat = async () => {
    if (!form.vat_number) {
      toast.error("Geen BTW-nummer ingevuld");
      return;
    }
    // Simple VIES-style validation via format check
    const vatRegex = /^[A-Z]{2}\d{9}B\d{2}$/;
    if (vatRegex.test(form.vat_number.replace(/\s/g, ""))) {
      toast.success("BTW-nummer formaat is geldig");
    } else {
      toast.warning("BTW-nummer formaat lijkt ongeldig. Controleer het nummer.");
    }
  };

  // Get preview URL
  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(doc.file_path);
  const previewUrl = urlData?.publicUrl;

  const fields: {
    key: string;
    label: string;
    field: keyof typeof form;
    confKey: keyof OcrConfidence;
    type?: string;
  }[] = [
    { key: "supplier", label: "Leverancier", field: "supplier_name", confKey: "supplier_name" },
    { key: "number", label: "Factuurnummer", field: "invoice_number", confKey: "invoice_number" },
    { key: "date", label: "Datum", field: "invoice_date", confKey: "invoice_date", type: "date" },
    { key: "vat_nr", label: "BTW-nummer", field: "vat_number", confKey: "vat_number" },
    { key: "subtotal", label: "Bedrag excl. BTW", field: "subtotal", confKey: "subtotal", type: "number" },
    { key: "vat", label: "BTW bedrag", field: "vat_amount", confKey: "vat_amounts", type: "number" },
    { key: "total", label: "Totaalbedrag", field: "total_amount", confKey: "total_amount", type: "number" },
    { key: "iban", label: "IBAN", field: "iban", confKey: "iban" },
    { key: "ref", label: "Betalingskenmerk", field: "payment_reference", confKey: "payment_reference" },
  ];

  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {doc.file_name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Preview */}
          <div className="rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
            {doc.file_type?.startsWith("image/") && previewUrl ? (
              <img
                src={previewUrl}
                alt={doc.file_name}
                className="max-h-64 object-contain"
              />
            ) : doc.file_type === "application/pdf" && previewUrl ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Open PDF <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <div className="py-12">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            {doc.ocr_status === "completed" && (
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                OCR voltooid
              </Badge>
            )}
            {doc.is_duplicate && (
              <Badge variant="destructive">Mogelijke duplicaat</Badge>
            )}
            {doc.is_validated && (
              <Badge variant="outline">Gevalideerd</Badge>
            )}
          </div>

          <Separator />

          {/* Editable fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Geëxtraheerde gegevens
            </h3>
            {fields.map(({ key, label, field, confKey, type }) => (
              <div key={key} className="space-y-1">
                <Label className="flex items-center gap-2 text-xs">
                  {label}
                  <ConfidenceDot value={confidence[confKey]} />
                </Label>
                <Input
                  type={type ?? "text"}
                  value={form[field]}
                  onChange={set(field)}
                  className="h-9"
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={handleValidateVat}>
              Valideer BTW-nummer
            </Button>
            <Button variant="outline" size="sm" disabled>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Maak inkoopfactuur
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Link2 className="h-4 w-4 mr-2" />
              Koppel aan transactie
            </Button>
          </div>

          <Separator />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button onClick={handleSave}>Opslaan</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
