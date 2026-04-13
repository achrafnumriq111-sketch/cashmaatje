import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { TransactionDetail } from "@/components/transactions/TransactionDetail";
import { CsvImportModal } from "@/components/transactions/CsvImportModal";
import { BulkActions } from "@/components/transactions/BulkActions";
import { BankRulesManager } from "@/components/transactions/BankRulesManager";
import { RecurringPatterns } from "@/components/transactions/RecurringPatterns";
import { useTransactions, useBankAccounts, useAccounts, useCategorizeTransactions, type TransactionFilters as TFilters } from "@/hooks/useTransactions";
import { useApplyBankRules } from "@/hooks/useBankRules";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { pageTransition, cardVariant } from "@/lib/animations";

export default function Transactions() {
  const { membership } = useOrganization();
  const now = new Date();
  const [filters, setFilters] = useState<TFilters>({
    bankAccountId: null,
    dateFrom: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    dateTo: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
    status: "all", search: "",
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

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-4">
      <motion.div variants={cardVariant} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Transacties</h1>
          <p className="mt-1 text-sm text-muted-foreground">{transactions.length} transacties gevonden</p>
        </div>
        {newTxIds.length > 0 && (
          <Button onClick={handleAutoCategories} disabled={categorize.isPending || applyRules.isPending} className="gap-2 w-full sm:w-auto">
            <Sparkles className="h-4 w-4" />
            {categorize.isPending || applyRules.isPending ? "Bezig..." : `Auto-categoriseer (${newTxIds.length})`}
          </Button>
        )}
      </motion.div>

      <motion.div variants={cardVariant}>
        <Tabs defaultValue="transactions">
          <TabsList>
            <TabsTrigger value="transactions">Transacties</TabsTrigger>
            <TabsTrigger value="rules" className="gap-1.5"><Zap className="h-3.5 w-3.5" /> Regels</TabsTrigger>
            <TabsTrigger value="recurring">Terugkerend</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4 mt-4">
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
