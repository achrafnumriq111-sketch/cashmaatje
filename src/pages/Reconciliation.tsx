import { useState, useMemo } from "react";
import { format, startOfYear, endOfYear } from "date-fns";
import { nl } from "date-fns/locale";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowRightLeft, Check, X, Plus, Search, Link2, BookOpen, ShieldOff, Loader2 } from "lucide-react";
import {
  useUnreconciledTransactions,
  useTransactionStats,
  useOpenInvoices,
  useSuggestedMatches,
  useMatchTransaction,
  useBookDirectly,
  useExcludeTransaction,
  useReconciliationRules,
  useCreateRule,
  type ReconciliationFilters,
} from "@/hooks/useReconciliation";
import { useBankAccounts, useAccounts } from "@/hooks/useTransactions";

export default function Reconciliation() {
  const now = new Date();
  const [filters, setFilters] = useState<ReconciliationFilters>({
    bankAccountId: null,
    dateFrom: format(startOfYear(now), "yyyy-MM-dd"),
    dateTo: format(endOfYear(now), "yyyy-MM-dd"),
  });
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState("");

  const { data: transactions, isLoading: txLoading } = useUnreconciledTransactions(filters);
  const { data: stats } = useTransactionStats();
  const { data: bankAccounts } = useBankAccounts();
  const { data: accounts } = useAccounts();
  const { data: suggestions, isLoading: sugLoading } = useSuggestedMatches(selectedTxId);
  const { data: openInvoices } = useOpenInvoices(invoiceSearch);
  const { data: rules } = useReconciliationRules();

  const matchMutation = useMatchTransaction();
  const bookMutation = useBookDirectly();
  const excludeMutation = useExcludeTransaction();
  const createRuleMutation = useCreateRule();

  const selectedTx = useMemo(
    () => transactions?.find((t) => t.id === selectedTxId) ?? null,
    [transactions, selectedTxId]
  );

  const handleMatch = (invoiceId: string) => {
    if (!selectedTx) return;
    matchMutation.mutate(
      { transactionId: selectedTx.id, invoiceId, amount: selectedTx.amount },
      {
        onSuccess: () => {
          toast.success("Transactie gekoppeld aan factuur");
          setSelectedTxId(null);
        },
        onError: () => toast.error("Koppeling mislukt"),
      }
    );
  };

  const handleBookDirect = () => {
    if (!selectedTx || !selectedAccountId) return;
    bookMutation.mutate(
      { transactionId: selectedTx.id, accountId: selectedAccountId },
      {
        onSuccess: () => {
          toast.success("Transactie geboekt");
          setShowBookDialog(false);
          setSelectedTxId(null);
          setSelectedAccountId(null);
        },
      }
    );
  };

  const handleExclude = () => {
    if (!selectedTx) return;
    excludeMutation.mutate(selectedTx.id, {
      onSuccess: () => {
        toast.success("Transactie uitgesloten");
        setSelectedTxId(null);
      },
    });
  };

  const handleCreateRule = () => {
    if (!selectedTx || !ruleName) return;
    createRuleMutation.mutate(
      {
        name: ruleName,
        match_counterparty: selectedTx.counterparty_name ?? undefined,
        match_description: selectedTx.description ?? undefined,
        assign_account_id: selectedAccountId ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success("Regel aangemaakt");
          setShowRuleDialog(false);
          setRuleName("");
        },
      }
    );
  };

  const confidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{confidence}%</Badge>;
    if (confidence >= 70) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{confidence}%</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">{confidence}%</Badge>;
  };

  const methodLabel = (m: string) => {
    const map: Record<string, string> = {
      exact_reference: "Referentie",
      amount_and_date: "Bedrag",
      counterparty_pattern: "Relatie",
      ai_fuzzy: "AI",
    };
    return map[m] ?? m;
  };

  const formatAmount = (n: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reconciliatie</h1>
        {stats && (
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-muted-foreground">
              {stats.matched} van {stats.total} transacties gekoppeld ({stats.percentage}%)
            </span>
            <Progress value={stats.percentage} className="w-40 h-2" />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          value={filters.bankAccountId ?? "all"}
          onValueChange={(v) => setFilters({ ...filters, bankAccountId: v === "all" ? null : v })}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Alle bankrekeningen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle bankrekeningen</SelectItem>
            {bankAccounts?.map((ba) => (
              <SelectItem key={ba.id} value={ba.id}>{ba.name} ({ba.iban})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className="w-40"
        />
        <span className="text-muted-foreground text-sm">t/m</span>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className="w-40"
        />
      </div>

      {/* Split screen */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border border-border">
        {/* LEFT: Unreconciled transactions */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                Niet-gekoppelde transacties
                {transactions && (
                  <Badge variant="secondary" className="ml-auto">{transactions.length}</Badge>
                )}
              </h2>
            </div>
            <ScrollArea className="flex-1">
              {txLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !transactions?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                  <Check className="h-8 w-8 mb-2 text-primary" />
                  Alle transacties zijn gekoppeld!
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <button
                      key={tx.id}
                      onClick={() => setSelectedTxId(tx.id === selectedTxId ? null : tx.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors ${
                        tx.id === selectedTxId ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(tx.transaction_date), "d MMM yyyy", { locale: nl })}
                        </span>
                        <span className={`text-sm font-medium tabular-nums ${tx.amount >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                          {formatAmount(tx.amount)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate mt-0.5">
                        {tx.counterparty_name || "Onbekend"}
                      </p>
                      {tx.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{tx.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT: Matches & open invoices */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full">
            {!selectedTx ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                <Link2 className="h-8 w-8" />
                Selecteer een transactie om te koppelen
              </div>
            ) : (
              <ScrollArea className="flex-1">
                {/* Selected transaction summary */}
                <div className="px-4 py-3 border-b border-border bg-accent/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{selectedTx.counterparty_name || "Onbekend"}</p>
                      <p className="text-xs text-muted-foreground">{selectedTx.description}</p>
                    </div>
                    <span className={`text-lg font-bold tabular-nums ${selectedTx.amount >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                      {formatAmount(selectedTx.amount)}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => setShowBookDialog(true)}>
                      <BookOpen className="h-3.5 w-3.5 mr-1" /> Direct boeken
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleExclude}>
                      <ShieldOff className="h-3.5 w-3.5 mr-1" /> Uitsluiten
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setRuleName(selectedTx.counterparty_name ?? ""); setShowRuleDialog(true); }}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Maak regel
                    </Button>
                  </div>
                </div>

                {/* Suggested matches */}
                <div className="px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Voorgestelde matches</h3>
                  {sugLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : !suggestions?.length ? (
                    <p className="text-xs text-muted-foreground py-2">Geen matches gevonden</p>
                  ) : (
                    <div className="space-y-2">
                      {suggestions.map((s) => (
                        <Card key={s.id} className="border-border">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{s.invoice_number}</span>
                                  {confidenceBadge(s.confidence)}
                                  <Badge variant="outline" className="text-xs">{methodLabel(s.matchMethod)}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{s.contact_name}</p>
                                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                  <span>{formatAmount(s.amount_due ?? s.total_amount - (s.amount_paid ?? 0))}</span>
                                  {s.due_date && <span>Vervalt {format(new Date(s.due_date), "d MMM", { locale: nl })}</span>}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleMatch(s.id)}
                                disabled={matchMutation.isPending}
                              >
                                Koppelen
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Open invoices */}
                <div className="px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Open facturen</h3>
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Zoek factuur..."
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    {openInvoices?.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{inv.invoice_number}</span>
                            <span className="text-xs text-muted-foreground">{inv.contact_name}</span>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>{formatAmount(inv.amount_due ?? inv.total_amount - (inv.amount_paid ?? 0))}</span>
                            {inv.due_date && <span>{format(new Date(inv.due_date), "d MMM yyyy", { locale: nl })}</span>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMatch(inv.id)}
                          disabled={matchMutation.isPending}
                        >
                          Koppelen
                        </Button>
                      </div>
                    ))}
                    {!openInvoices?.length && (
                      <p className="text-xs text-muted-foreground py-2">Geen open facturen gevonden</p>
                    )}
                  </div>
                </div>

                {/* Rules section */}
                {rules && rules.length > 0 && (
                  <>
                    <Separator />
                    <div className="px-4 py-3">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Actieve regels</h3>
                      <div className="space-y-1">
                        {rules.map((rule) => (
                          <div key={rule.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-accent/30">
                            <div>
                              <span className="text-sm text-foreground">{rule.name}</span>
                              {rule.match_counterparty && (
                                <p className="text-xs text-muted-foreground">Tegenpartij: {rule.match_counterparty}</p>
                              )}
                            </div>
                            <Badge variant="secondary">{rule.times_applied ?? 0}×</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </ScrollArea>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Direct booking dialog */}
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Direct boeken op grootboekrekening</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Grootboekrekening</Label>
              <Select value={selectedAccountId ?? ""} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecteer rekening" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.code} — {a.name_nl ?? a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookDialog(false)}>Annuleren</Button>
            <Button onClick={handleBookDirect} disabled={!selectedAccountId || bookMutation.isPending}>
              Boeken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create rule dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reconciliatieregel aanmaken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Regelnaam</Label>
              <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} className="mt-1" />
            </div>
            {selectedTx && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Tegenpartij: <span className="text-foreground">{selectedTx.counterparty_name}</span></p>
                <p>Omschrijving: <span className="text-foreground">{selectedTx.description}</span></p>
              </div>
            )}
            <div>
              <Label>Boeken op rekening (optioneel)</Label>
              <Select value={selectedAccountId ?? ""} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecteer rekening" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.code} — {a.name_nl ?? a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>Annuleren</Button>
            <Button onClick={handleCreateRule} disabled={!ruleName || createRuleMutation.isPending}>
              Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
