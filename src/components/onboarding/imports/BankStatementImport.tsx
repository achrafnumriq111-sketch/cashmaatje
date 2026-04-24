import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Download, Check, Loader2, Banknote } from "lucide-react";
import { parseCsv, rowsToObjects, downloadCsvTemplate, parseAmount } from "@/lib/csvImport";
import { toast } from "sonner";
import type { OnboardingData } from "@/pages/Onboarding";

interface BankRow {
  bank_account_id: string;
  organization_id: string;
  transaction_date: string;
  amount: number;
  description: string;
  counterparty_name: string | null;
  counterparty_iban: string | null;
  external_id: string | null;
  status: "new";
  currency: "EUR";
}

interface Props {
  organizationId?: string | null;
  onboardingBankAccounts?: OnboardingData["bankAccounts"];
  pending?: boolean;
  onPendingChange?: (rows: BankRow[] | null) => void;
}

function toIsoDate(v: string): string {
  const s = v.trim();
  // dd-mm-yyyy or dd/mm/yyyy
  const dmy = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function BankStatementImport({ organizationId, onboardingBankAccounts, pending, onPendingChange }: Props) {
  const [parsed, setParsed] = useState<BankRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = async (file: File) => {
    if (!pending && !organizationId) { toast.error("Geen organisatie actief"); return; }
    const text = await file.text();
    const rows = rowsToObjects(parseCsv(text));
    if (rows.length === 0) { toast.error("CSV is leeg"); return; }
    const required = ["date", "amount"];
    const has = (k: string) => k in rows[0] || (k === "date" && "datum" in rows[0]) || (k === "amount" && "bedrag" in rows[0]);
    if (!required.every(has)) { toast.error("CSV mist verplichte kolommen 'date' en 'amount'"); return; }

    // During onboarding bank accounts don't exist in DB yet — the rows are queued
    // and inserted by Onboarding.finish() after bank_accounts have been created.
    // Outside onboarding: we need the user to pick which bank_account; here we
    // just take the first/primary for simplicity in onboarding.
    let bankAccountId = "";
    if (pending) {
      bankAccountId = "__primary__"; // placeholder mapped by Onboarding.finish
      if (!onboardingBankAccounts || onboardingBankAccounts.length === 0) {
        toast.error("Voeg eerst een bankrekening toe bij stap 'Bankrekeningen'");
        return;
      }
    } else {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: ba } = await supabase
        .from("bank_accounts")
        .select("id")
        .eq("organization_id", organizationId!)
        .eq("is_primary", true)
        .maybeSingle();
      if (!ba) { toast.error("Geen primaire bankrekening gevonden"); return; }
      bankAccountId = ba.id;
    }

    const list: BankRow[] = rows.map((r) => ({
      bank_account_id: bankAccountId,
      organization_id: organizationId ?? "__pending__",
      transaction_date: toIsoDate(r.date || r.datum),
      amount: parseAmount(r.amount || r.bedrag),
      description: r.description || r.omschrijving || "",
      counterparty_name: r.counterparty_name || r.tegenpartij || null,
      counterparty_iban: r.counterparty_iban || r.tegenrekening || null,
      external_id: r.external_id || r.reference || null,
      status: "new" as const,
      currency: "EUR" as const,
    })).filter((r) => r.transaction_date && !isNaN(r.amount));

    if (list.length === 0) { toast.error("Geen geldige transacties gevonden"); return; }
    setParsed(list);
    onPendingChange?.(list);
    if (pending) toast.success(`${list.length} transacties gereed.`);
  };

  const submit = async () => {
    if (!organizationId || !parsed) return;
    setBusy(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.from("bank_transactions").insert(parsed);
      if (error) throw error;
      toast.success(`${parsed.length} transacties geïmporteerd`);
      setDone(true);
    } catch (e: any) { toast.error(e.message || "Import mislukt"); }
    finally { setBusy(false); }
  };

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Banknote className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Bankafschriften</p>
            <p className="text-sm text-muted-foreground">CSV met date, amount, description, counterparty_name, counterparty_iban.</p>
          </div>
          {done && <Check className="h-5 w-5 text-primary" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCsvTemplate("bankafschriften-template.csv",
            ["date", "amount", "description", "counterparty_name", "counterparty_iban", "external_id"],
            [["2025-01-15", "-49.99", "Software abonnement", "Acme SaaS", "NL00INGB1111111111", "TX-0001"]],
          )}>
            <Download className="mr-2 h-3.5 w-3.5" /> Template downloaden
          </Button>
          <label>
            <input type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Button size="sm" variant="secondary" asChild><span><Upload className="mr-2 h-3.5 w-3.5" /> CSV uploaden</span></Button>
          </label>
          {!pending && parsed && !done && (
            <Button size="sm" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />} Importeren ({parsed.length})
            </Button>
          )}
        </div>
        {parsed && pending && (
          <p className="text-xs text-muted-foreground">{parsed.length} transacties gereed — wordt opgeslagen wanneer je het wizard afrondt.</p>
        )}
      </CardContent>
    </Card>
  );
}
