import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Upload, Download, Check, Loader2 } from "lucide-react";
import { parseCsv, rowsToObjects, downloadCsvTemplate } from "@/lib/csvImport";
import { toast } from "sonner";

interface ContactRow {
  name: string;
  email?: string;
  phone?: string;
  btw_number?: string;
  kvk_number?: string;
  iban?: string;
  is_customer?: boolean;
  is_supplier?: boolean;
  address_street?: string;
  address_postal_code?: string;
  address_city?: string;
}

interface Props {
  organizationId?: string | null;
  pending?: boolean;
  onPendingChange?: (rows: ContactRow[] | null) => void;
}

const truthy = (v: string) => /^(1|true|yes|ja|y|x)$/i.test((v ?? "").trim());

export function ContactsImport({ organizationId, pending, onPendingChange }: Props) {
  const [parsed, setParsed] = useState<ContactRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const rows = rowsToObjects(parseCsv(text));
    if (rows.length === 0) { toast.error("CSV is leeg"); return; }
    if (!("name" in rows[0]) && !("naam" in rows[0])) {
      toast.error("CSV mist verplichte kolom 'name'");
      return;
    }
    const list: ContactRow[] = rows
      .map((r) => ({
        name: (r.name || r.naam || "").trim(),
        email: r.email || undefined,
        phone: r.phone || r.telefoon || undefined,
        btw_number: r.btw_number || r.btw || undefined,
        kvk_number: r.kvk_number || r.kvk || undefined,
        iban: r.iban || undefined,
        is_customer: truthy(r.is_customer || r.klant || ""),
        is_supplier: truthy(r.is_supplier || r.leverancier || ""),
        address_street: r.address_street || r.straat || undefined,
        address_postal_code: r.address_postal_code || r.postcode || undefined,
        address_city: r.address_city || r.plaats || undefined,
      }))
      .filter((r) => r.name);
    if (list.length === 0) { toast.error("Geen geldige rijen gevonden"); return; }
    setParsed(list);
    onPendingChange?.(list);
    if (pending) toast.success(`${list.length} contacten gereed.`);
  };

  const submit = async () => {
    if (!organizationId || !parsed) return;
    setBusy(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const insertRows = parsed.map((c) => ({ ...c, organization_id: organizationId }));
      const { error } = await supabase.from("contacts").insert(insertRows);
      if (error) throw error;
      toast.success(`${parsed.length} contacten geïmporteerd`);
      setDone(true);
    } catch (e: any) {
      toast.error(e.message || "Import mislukt");
    } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Contacten</p>
            <p className="text-sm text-muted-foreground">CSV met klanten en leveranciers (name, email, btw_number, iban, is_customer, is_supplier…).</p>
          </div>
          {done && <Check className="h-5 w-5 text-primary" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCsvTemplate("contacten-template.csv",
            ["name", "email", "phone", "btw_number", "kvk_number", "iban", "is_customer", "is_supplier", "address_street", "address_postal_code", "address_city"],
            [["Acme BV", "info@acme.nl", "020-1234567", "NL123456789B01", "12345678", "NL00INGB0000000000", "1", "0", "Hoofdstraat 1", "1011AA", "Amsterdam"]],
          )}>
            <Download className="mr-2 h-3.5 w-3.5" /> Template downloaden
          </Button>
          <label>
            <input type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Button size="sm" variant="secondary" asChild><span><Upload className="mr-2 h-3.5 w-3.5" /> CSV uploaden</span></Button>
          </label>
          {!pending && parsed && !done && (
            <Button size="sm" onClick={submit} disabled={busy || !organizationId}>
              {busy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />} Importeren ({parsed.length})
            </Button>
          )}
        </div>
        {parsed && pending && (
          <p className="text-xs text-muted-foreground">{parsed.length} contacten gereed — wordt opgeslagen wanneer je het wizard afrondt.</p>
        )}
      </CardContent>
    </Card>
  );
}
