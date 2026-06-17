import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, PlayCircle, CheckCircle2, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pageTransition } from "@/lib/animations";

interface DummyTx {
  date: string;
  amount: number;
  description: string;
  counterparty: string;
  iban: string;
  matchHint?: string;
}

function buildDummyTransactions(): DummyTx[] {
  const today = new Date();
  const d = (offset: number) => new Date(today.getTime() - offset * 86400e3).toISOString().slice(0, 10);
  return [
    { date: d(2), amount: 1815.00, description: "Betaling factuur F2026-0001", counterparty: "Acme Holding B.V.", iban: "NL00ACME0000000001", matchHint: "factuur" },
    { date: d(3), amount: 605.00,  description: "F2026-0002 Globex", counterparty: "Globex N.V.", iban: "NL00GLOB0000000002", matchHint: "factuur" },
    { date: d(5), amount: -49.99,  description: "Adobe Creative Cloud", counterparty: "Adobe Systems Software", iban: "IE00ADBE0000000099", matchHint: "abonnement" },
    { date: d(6), amount: -12.50,  description: "Bedrijfskosten - lunchafspraak", counterparty: "Café De Hoek", iban: "NL00CAFE0000000003", matchHint: "bonnetje" },
    { date: d(8), amount: -1250.00,description: "Huur kantoorruimte april", counterparty: "Real Estate B.V.", iban: "NL00REAL0000000004", matchHint: "vaste last" },
    { date: d(10),amount: 2420.00, description: "Inkomende betaling F2026-0003", counterparty: "Initech B.V.", iban: "NL00INIT0000000005", matchHint: "factuur" },
    { date: d(12),amount: -89.00,  description: "CloudHost Europe", counterparty: "CloudHost Europe", iban: "IE00CLOU0000000006", matchHint: "abonnement" },
    { date: d(14),amount: -210.45, description: "Brandstof tankstation A2", counterparty: "Shell Nederland", iban: "NL00SHEL0000000007", matchHint: "auto" },
  ];
}

export default function Psd2TestImport() {
  const navigate = useNavigate();
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const qc = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const { data: bankAccount } = useQuery({
    queryKey: ["onboarding-bank-account", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("bank_accounts")
        .select("id, name, iban")
        .eq("organization_id", orgId!)
        .order("is_primary", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: recentTx = [], refetch } = useQuery({
    queryKey: ["psd2-test-txs", orgId],
    enabled: !!orgId && imported,
    queryFn: async () => {
      const { data } = await supabase
        .from("bank_transactions")
        .select("id, transaction_date, amount, description, counterparty_name, status")
        .eq("organization_id", orgId!)
        .order("transaction_date", { ascending: false })
        .limit(15);
      return data ?? [];
    },
  });

  const runImport = async () => {
    if (!orgId || !bankAccount?.id) {
      toast.error("Geen bankrekening gevonden. Voltooi onboarding eerst.");
      return;
    }
    setImporting(true);
    try {
      const rows = buildDummyTransactions().map((tx) => ({
        organization_id: orgId,
        bank_account_id: bankAccount.id,
        transaction_date: tx.date,
        value_date: tx.date,
        amount: tx.amount,
        currency: "EUR",
        description: tx.description,
        counterparty_name: tx.counterparty,
        counterparty_iban: tx.iban,
        status: "new",
      }));
      const { error } = await supabase.from("bank_transactions").insert(rows);
      if (error) throw error;
      setImported(true);
      await refetch();
      qc.invalidateQueries({ queryKey: ["bank-transactions"] });
      toast.success(`${rows.length} test-transacties geïmporteerd via mock PSD2-stream.`);
    } catch (e: any) {
      toast.error(e.message || "Import mislukt");
    } finally {
      setImporting(false);
    }
  };

  return (
    <motion.div {...pageTransition} className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wide">
            <Sparkles className="h-3 w-3" /> Onboarding test
          </div>
          <h1 className="text-3xl font-semibold mt-2">PSD2 koppeling testen</h1>
          <p className="text-muted-foreground mt-1">
            Simuleer een PSD2-stream met 8 dummy transacties en bekijk hoe Cash Maatje ze automatisch matcht met openstaande facturen en vaste lasten.
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/")}>
          Naar dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" /> Stap 1 · Mock PSD2 verbinding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div>
              <p className="font-medium">{bankAccount?.name || "Geen rekening gekoppeld"}</p>
              <p className="text-xs text-muted-foreground font-mono">{bankAccount?.iban || "—"}</p>
            </div>
            <Badge variant={bankAccount ? "default" : "destructive"}>
              {bankAccount ? "Klaar voor sandbox" : "Geen IBAN"}
            </Badge>
          </div>
          <Button onClick={runImport} disabled={!bankAccount || importing || imported} className="w-full sm:w-auto">
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            {imported ? "Test geïmporteerd" : "Start test-import (8 transacties)"}
          </Button>
        </CardContent>
      </Card>

      {imported && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Stap 2 · Mock reconciliatie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Cash Maatje matcht automatisch op IBAN, bedrag en factuurnummer. Voorbeelden hieronder zijn dummy data.
            </p>
            <div className="rounded-lg border border-border divide-y divide-border">
              {recentTx.map((tx) => {
                const matched = tx.status === "matched";
                return (
                  <div key={tx.id} className="grid grid-cols-[1fr_auto] gap-3 p-3 items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.counterparty_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tx.transaction_date} · {tx.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm ${Number(tx.amount) >= 0 ? "text-emerald-500" : "text-foreground"}`}>
                        {new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(tx.amount))}
                      </span>
                      <Badge variant={matched ? "default" : "secondary"} className="text-[10px]">
                        {matched ? "Gematcht" : "Open"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {recentTx.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">Geen transacties — refresh om te laden.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => navigate("/reconciliatie")}>
                Open volledig reconciliatie-scherm
              </Button>
              <Button onClick={() => navigate("/")}>
                Klaar — naar dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
