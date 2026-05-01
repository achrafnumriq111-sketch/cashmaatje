import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { TransactionDetail } from "@/components/transactions/TransactionDetail";
import { CsvImportModal } from "@/components/transactions/CsvImportModal";
import { BulkActions } from "@/components/transactions/BulkActions";
import { BankRulesManager } from "@/components/transactions/BankRulesManager";
import { RecurringPatterns } from "@/components/transactions/RecurringPatterns";
import { QuickFilters, DATE_PRESETS, getDateRangeFromPreset, type DateRangePreset } from "@/components/ui/quick-filters";
import { useTransactions, useBankAccounts, useAccounts, useCategorizeTransactions, type TransactionFilters as TFilters } from "@/hooks/useTransactions";
import { useApplyBankRules } from "@/hooks/useBankRules";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Zap, FileDown } from "lucide-react";
import { toast } from "sonner";
import { exportTransactionsPDF } from "@/lib/pdfExport";
import { pageTransition, cardVariant } from "@/lib/animations";

const STATUS_TABS = [
  { value: "all" as const, label: "Alles" },
  { value: "new" as const, label: "Nieuw" },
  { value: "matched" as const, label: "Gematcht" },
  { value: "manually_matched" as const, label: "Handmatig" },
  { value: "excluded" as const, label: "Uitgesloten" },
];

export default function Transactions() {
  const { membership } = useOrganization();
  const [preset, setPreset] = useState<DateRangePreset>("month");
  const initial = getDateRangeFromPreset("month");
  const [filters, setFilters] = useState<TFilters>({
    bankAccountId: null,
    dateFrom: initial.from,
    dateTo: initial.to,
    status: "all",
    search: "",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: transactions = [], isLoading } = useTransactions(filters);
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: accounts = [] } = useAccounts();
  const categorize = useCategorizeTransactions();
  const applyRules = useApplyBankRules();

  const selectedTx = useMemo(() => transactions.find((t) => t.id === detailId) ?? null, [transactions, detailId]);
  const newTxIds = useMemo(() => transactions.filter(t => t.status === "new").map(t => t.id), [transactions]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: transactions.length };
    transactions.forEach((t) => { map[t.status] = (map[t.status] || 0) + 1; });
    return map;
  }, [transactions]);

  const handlePreset = (p: DateRangePreset) => {
    const r = getDateRangeFromPreset(p);
    setPreset(p);
    setFilters((f) => ({ ...f, dateFrom: r.from, dateTo: r.to }));
  };

  const handleAutoCategories = async () => {
    if (!newTxIds.length) { toast.info("Geen nieuwe transacties om te categoriseren"); return; }
    try {
      const rulesResult = await applyRules.mutateAsync(newTxIds);
      const remaining = newTxIds.length - rulesResult.matched;
      if (remaining > 0) {
        await categorize.mutateAsync(newTxIds.filter(id => { const tx = transactions.find(t => t.id === id); return tx?.status === "new"; }));
      }
      toast.success(`${rulesResult.matched} via regels, ${remaining} via AI gecategoriseerd`);
    } catch { toast.error("Fout bij automatisch categoriseren"); }
  };

  const handleExport = () => {
    if (!transactions.length) { toast.info("Geen transacties om te exporteren"); return; }
    exportTransactionsPDF({ transactions: transactions as any, dateFrom: filters.dateFrom, dateTo: filters.dateTo });
    toast.success("PDF gedownload");
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Transacties</h1>
          <p className="mt-1 text-sm text-muted-foreground">{transactions.length} transacties gevonden</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="rounded-xl">
            <FileDown className="h-4 w-4 mr-2" /> Export PDF
          </Button>
          {newTxIds.length > 0 && (
            <Button onClick={handleAutoCategories} disabled={categorize.isPending || applyRules.isPending} className="rounded-xl">
              <Sparkles className="h-4 w-4 mr-2" />
              {categorize.isPending || applyRules.isPending ? "Bezig..." : `Auto (${newTxIds.length})`}
            </Button>
          )}
        </div>
      </motion.div>

      <motion.div variants={cardVariant}>
        <Tabs defaultValue="transactions">
          <TabsList className="rounded-xl">
            <TabsTrigger value="transactions" className="rounded-lg">Transacties</TabsTrigger>
            <TabsTrigger value="rules" className="gap-1.5 rounded-lg"><Zap className="h-3.5 w-3.5" /> Regels</TabsTrigger>
            <TabsTrigger value="recurring" className="rounded-lg">Terugkerend</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4 mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <QuickFilters
                options={STATUS_TABS.map((t) => ({ ...t, count: counts[t.value] ?? 0 }))}
                value={filters.status}
                onChange={(v) => setFilters({ ...filters, status: v as TFilters["status"] })}
              />
              <QuickFilters options={DATE_PRESETS} value={preset} onChange={handlePreset} />
            </div>
            <TransactionFilters filters={filters} onChange={setFilters} bankAccounts={bankAccounts} onImport={() => setImportOpen(true)} selectedCount={selectedIds.size} />
            {selectedIds.size > 0 && <BulkActions selectedIds={Array.from(selectedIds)} accounts={accounts} onClear={() => setSelectedIds(new Set())} />}
            <TransactionsTable transactions={transactions} isLoading={isLoading} selectedIds={selectedIds} onSelectionChange={setSelectedIds} onRowClick={(id) => setDetailId(id)} role={membership?.role} />
          </TabsContent>
          <TabsContent value="rules" className="mt-4"><BankRulesManager /></TabsContent>
          <TabsContent value="recurring" className="mt-4"><RecurringPatterns /></TabsContent>
        </Tabs>
      </motion.div>

      <TransactionDetail transaction={selectedTx} open={!!detailId} onClose={() => setDetailId(null)} accounts={accounts} />
      <CsvImportModal open={importOpen} onClose={() => setImportOpen(false)} bankAccounts={bankAccounts} />
    </motion.div>
  );
}
