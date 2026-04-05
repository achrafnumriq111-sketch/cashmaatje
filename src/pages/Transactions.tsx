import { useState, useMemo } from "react";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { TransactionDetail } from "@/components/transactions/TransactionDetail";
import { CsvImportModal } from "@/components/transactions/CsvImportModal";
import { BulkActions } from "@/components/transactions/BulkActions";
import { useTransactions, useBankAccounts, useAccounts, type TransactionFilters as TFilters } from "@/hooks/useTransactions";
import { useOrganization } from "@/hooks/useOrganization";

export default function Transactions() {
  const { membership } = useOrganization();
  const now = new Date();
  const [filters, setFilters] = useState<TFilters>({
    bankAccountId: null,
    dateFrom: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    dateTo: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
    status: "all",
    search: "",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: transactions = [], isLoading } = useTransactions(filters);
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: accounts = [] } = useAccounts();

  const selectedTx = useMemo(
    () => transactions.find((t) => t.id === detailId) ?? null,
    [transactions, detailId]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transacties</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {transactions.length} transacties gevonden
          </p>
        </div>
      </div>

      <TransactionFilters
        filters={filters}
        onChange={setFilters}
        bankAccounts={bankAccounts}
        onImport={() => setImportOpen(true)}
        selectedCount={selectedIds.size}
      />

      {selectedIds.size > 0 && (
        <BulkActions
          selectedIds={Array.from(selectedIds)}
          accounts={accounts}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      <TransactionsTable
        transactions={transactions}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(id) => setDetailId(id)}
        role={membership?.role}
      />

      <TransactionDetail
        transaction={selectedTx}
        open={!!detailId}
        onClose={() => setDetailId(null)}
        accounts={accounts}
      />

      <CsvImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        bankAccounts={bankAccounts}
      />
    </div>
  );
}
