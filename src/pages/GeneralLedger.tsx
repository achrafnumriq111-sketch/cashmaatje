import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LedgerFilters } from "@/components/ledger/LedgerFilters";
import { LedgerTable } from "@/components/ledger/LedgerTable";
import { AccountDetail } from "@/components/ledger/AccountDetail";
import { CreateAccountDialog } from "@/components/ledger/CreateAccountDialog";
import { useGeneralLedger, type LedgerFilters as Filters, type LedgerAccount } from "@/hooks/useGeneralLedger";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format } from "date-fns";
import { pageTransition, cardVariant } from "@/lib/animations";

export default function GeneralLedger() {
  const now = new Date();
  const [period, setPeriod] = useState("year");
  const [filters, setFilters] = useState<Filters>({ search: "", accountType: "all", activity: "all" });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getRange = (p: string) => {
    const start = p === "month" ? startOfMonth(now) : p === "quarter" ? startOfQuarter(now) : startOfYear(now);
    const end = p === "month" ? endOfMonth(now) : p === "quarter" ? endOfQuarter(now) : endOfYear(now);
    return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") };
  };

  const { start: dateFrom, end: dateTo } = getRange(period);
  const { data: accounts = [], isLoading } = useGeneralLedger(filters, dateFrom, dateTo);

  const selectedAccount = useMemo<LedgerAccount | null>(() => accounts.find((a) => a.id === selectedId) ?? null, [accounts, selectedId]);

  const stats = useMemo(() => {
    const active = accounts.filter((a) => a.entryCount > 0).length;
    const anomalies = accounts.filter((a) => (a.accountType === "revenue" && a.balance > 0) || (a.accountType === "expense" && a.balance < 0)).length;
    return { total: accounts.length, active, anomalies };
  }, [accounts]);

  const handleExport = () => {
    if (!accounts.length) { toast.info("Geen data om te exporteren"); return; }
    const header = "Code,Rekening,Type,BTW Box,Debet,Credit,Saldo\n";
    const rows = accounts.map((a) => `${a.code},"${(a.nameNl ?? a.name).replace(/"/g, '""')}",${a.accountType},${a.vatBoxMapping ?? ""},${a.debitTotal.toFixed(2)},${a.creditTotal.toFixed(2)},${a.balance.toFixed(2)}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `grootboek_${dateFrom}_${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Export gedownload");
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-4">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Grootboek</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.active} actieve rekeningen van {stats.total}
            {stats.anomalies > 0 && <Badge variant="secondary" className="ml-2 bg-amber-500/15 text-amber-400 border-0 text-[10px]">{stats.anomalies} afwijkend saldo</Badge>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateAccountDialog />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Maand</SelectItem>
              <SelectItem value="quarter">Kwartaal</SelectItem>
              <SelectItem value="year">Jaar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div variants={cardVariant}><LedgerFilters filters={filters} onChange={setFilters} onExport={handleExport} /></motion.div>
      <motion.div variants={cardVariant}><LedgerTable accounts={accounts} isLoading={isLoading} onRowClick={setSelectedId} /></motion.div>
      <AccountDetail account={selectedAccount} open={!!selectedId} onClose={() => setSelectedId(null)} dateFrom={dateFrom} dateTo={dateTo} />
    </motion.div>
  );
}
