import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet, Upload, Download, Check, Loader2 } from "lucide-react";
import { parseCsv, rowsToObjects, downloadCsvTemplate, parseAmount } from "@/lib/csvImport";
import { toast } from "sonner";

interface Props {
  organizationId?: string | null;
  /** When true, store parsed rows in pendingState rather than calling the RPC. */
  pending?: boolean;
  onPendingChange?: (rows: { account_code: string; debit: number; credit: number; description: string }[] | null) => void;
}

export function OpeningBalanceImport({ organizationId, pending, onPendingChange }: Props) {
  const [parsed, setParsed] = useState<{ account_code: string; debit: number; credit: number; description: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const rows = rowsToObjects(parseCsv(text));
    if (rows.length === 0) { toast.error("CSV is leeg"); return; }
    const required = ["account_code"];
    if (!required.every((k) => k in rows[0])) {
      toast.error("CSV mist verplichte kolom 'account_code'");
      return;
    }
    const lines = rows.map((r) => ({
      account_code: r.account_code,
      debit: parseAmount(r.debit ?? "0"),
      credit: parseAmount(r.credit ?? "0"),
      description: r.description || r.omschrijving || "Beginsaldo",
    }));
    const totalD = lines.reduce((s, l) => s + l.debit, 0);
    const totalC = lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalD - totalC) > 0.01) {
      toast.error(`Openingsbalans is niet in evenwicht (debet €${totalD.toFixed(2)} vs credit €${totalC.toFixed(2)})`);
      return;
    }
    setParsed(lines);
    onPendingChange?.(lines);
    if (pending) toast.success(`${lines.length} regels gevalideerd. Wordt verwerkt na afronden.`);
  };

  const submit = async () => {
    if (!organizationId || !parsed) return;
    setBusy(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.rpc("import_opening_balance", {
        p_org_id: organizationId,
        p_date: new Date().toISOString().slice(0, 10),
        p_lines: parsed as never,
      });
      if (error) throw error;
      toast.success("Openingsbalans geïmporteerd");
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
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Openingsbalans</p>
            <p className="text-sm text-muted-foreground">CSV met kolommen: account_code, debit, credit, description.</p>
          </div>
          {done && <Check className="h-5 w-5 text-primary" />}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCsvTemplate("openingsbalans-template.csv",
            ["account_code", "debit", "credit", "description"],
            [["1120", "5000.00", "0.00", "Bank beginsaldo"], ["3100", "0.00", "5000.00", "Eigen vermogen beginsaldo"]],
          )}>
            <Download className="mr-2 h-3.5 w-3.5" /> Template downloaden
          </Button>
          <label>
            <input type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Button size="sm" variant="secondary" asChild><span><Upload className="mr-2 h-3.5 w-3.5" /> CSV uploaden</span></Button>
          </label>
          {!pending && parsed && !done && (
            <Button size="sm" onClick={submit} disabled={busy || !organizationId}>
              {busy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />} Importeren ({parsed.length} regels)
            </Button>
          )}
        </div>
        {parsed && pending && (
          <p className="text-xs text-muted-foreground">{parsed.length} regels gereed — wordt opgeslagen wanneer je het wizard afrondt.</p>
        )}
      </CardContent>
    </Card>
  );
}
