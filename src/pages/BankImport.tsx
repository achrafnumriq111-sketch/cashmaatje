import { useState } from "react";
import { motion } from "framer-motion";
import { pageTransition, cardVariant } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { parseBankCsv, importBankTransactions, type ParseResult, type ImportResult } from "@/lib/bankCsvImport";
import { parseCamt053, parseMt940, detectStatementFormat } from "@/lib/bankStatementParsers";
import { buildCounterpartyGroups, txGroupKey, type CounterpartyGroup, type ContactRow } from "@/lib/contactMatcher";
import { ContactMatchStep } from "@/components/transactions/ContactMatchStep";
import { toast } from "sonner";
import { SmartEmptyState } from "@/components/ui/smart-empty-state";

export default function BankImport() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const qc = useQueryClient();
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [groups, setGroups] = useState<CounterpartyGroup[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bank_accounts")
        .select("id, name, iban, is_primary")
        .eq("organization_id", orgId!)
        .eq("is_active", true)
        .order("is_primary", { ascending: false });
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts-match", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("contacts")
        .select("id, name, iban, is_customer, is_supplier")
        .eq("organization_id", orgId!)
        .eq("is_active", true);
      return (data ?? []) as ContactRow[];
    },
    enabled: !!orgId,
  });

  const handleFile = async (file: File) => {
    setImportResult(null);
    setGroups([]);
    const text = await file.text();
    const ext = file.name.toLowerCase().split(".").pop();
    let format = detectStatementFormat(text);
    if (format === "unknown") {
      if (ext === "xml") format = "camt053";
      else if (ext === "sta" || ext === "mt940" || ext === "txt") format = "mt940";
      else format = "csv";
    }
    let result: ParseResult;
    if (format === "camt053") result = parseCamt053(text);
    else if (format === "mt940") result = parseMt940(text);
    else result = parseBankCsv(text);
    setParsed(result);
    if (result.transactions.length === 0 && result.errors.length === 0) {
      toast.error("Geen transacties gevonden in dit bestand");
    } else {
      toast.success(`${result.transactions.length} transacties uit ${format.toUpperCase()} gelezen`);
    }
    if (bankAccounts.length === 1) setAccountId(bankAccounts[0].id);
    else if (bankAccounts.find((b) => b.is_primary)) setAccountId(bankAccounts.find((b) => b.is_primary)!.id);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsed || !orgId || !accountId) throw new Error("Selecteer een rekening");
      return importBankTransactions(orgId, accountId, parsed.transactions);
    },
    onSuccess: (res) => {
      setImportResult(res);
      qc.invalidateQueries({ queryKey: ["bank-transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`${res.inserted} transacties geïmporteerd · ${res.matched} automatisch gematcht`);
    },
    onError: (e: any) => toast.error(e.message ?? "Import mislukt"),
  });

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bankafschriften importeren</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload CSV, CAMT.053 of MT940 — wij lezen het uit en matchen automatisch tegen openstaande facturen.
        </p>
      </motion.div>

      {bankAccounts.length === 0 ? (
        <SmartEmptyState
          icon={FileSpreadsheet}
          title="Eerst een bankrekening instellen"
          description="Voeg in Instellingen je bankrekening toe voordat je transacties importeert."
          actionLabel="Naar instellingen"
          actionTo="/instellingen"
        />
      ) : (
        <>
          <motion.div variants={cardVariant}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. Upload bestand</CardTitle>
                <CardDescription>CSV (ING, Rabobank, ABN, Bunq, Knab, Triodos), CAMT.053 (XML) of MT940 (.sta/.txt) — formaat wordt automatisch gedetecteerd.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition ${
                    isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Sleep een bankafschrift hierheen</p>
                    <p className="text-xs text-muted-foreground mt-1">CSV · CAMT.053 (.xml) · MT940 (.sta/.txt)</p>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".csv,.xml,.sta,.mt940,.txt,text/csv,application/xml,text/xml,text/plain"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80">
                      Kies bestand
                    </span>
                  </label>
                </div>

                {bankAccounts.length > 1 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Bankrekening</label>
                    <Select value={accountId} onValueChange={setAccountId}>
                      <SelectTrigger><SelectValue placeholder="Kies rekening" /></SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name} · {b.iban}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {parsed && (
            <motion.div variants={cardVariant}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    2. Voorbeeld ({parsed.transactions.length} transacties)
                  </CardTitle>
                  <CardDescription>
                    Gedetecteerd: {parsed.detected.dateColumn ?? "?"} · {parsed.detected.amountColumn ?? "?"} · {parsed.detected.descriptionColumn ?? "?"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {parsed.errors.length > 0 && (
                    <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                      {parsed.errors.slice(0, 3).join(" · ")}
                      {parsed.errors.length > 3 && ` · +${parsed.errors.length - 3} meer`}
                    </div>
                  )}
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum</TableHead>
                          <TableHead>Tegenpartij</TableHead>
                          <TableHead>Omschrijving</TableHead>
                          <TableHead className="text-right">Bedrag</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsed.transactions.slice(0, 8).map((t, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs">{t.transaction_date}</TableCell>
                            <TableCell className="text-xs">{t.counterparty_name ?? "—"}</TableCell>
                            <TableCell className="text-xs max-w-[300px] truncate">{t.description}</TableCell>
                            <TableCell className={`text-xs text-right font-medium ${t.amount < 0 ? "text-destructive" : "text-emerald-500"}`}>
                              €{t.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {parsed.transactions.length > 8 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30 border-t border-border">
                        +{parsed.transactions.length - 8} meer rijen worden geïmporteerd
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => importMutation.mutate()}
                      disabled={importMutation.isPending || !accountId || parsed.transactions.length === 0}
                    >
                      {importMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importeren…</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4 mr-2" />Importeer {parsed.transactions.length} transacties</>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => { setParsed(null); setImportResult(null); }}>Annuleer</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {importResult && (
            <motion.div variants={cardVariant}>
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />Import voltooid
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Geïmporteerd</span>
                    <Badge variant="secondary">{importResult.inserted}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Automatisch gematcht aan facturen</span>
                    <Badge className="bg-primary text-primary-foreground">{importResult.matched}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duplicaten overgeslagen</span>
                    <Badge variant="outline">{importResult.duplicates}</Badge>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="flex items-center justify-between text-destructive">
                      <span>Fouten</span>
                      <Badge variant="destructive">{importResult.errors.length}</Badge>
                    </div>
                  )}
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <a href="/transacties">Naar transacties →</a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
