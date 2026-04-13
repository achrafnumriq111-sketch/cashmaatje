import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useReportData } from "@/hooks/useReportData";
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { pageTransition, cardVariant } from "@/lib/animations";

export default function TrialBalance() {
  const { orgId, fetchAccountBalances } = useReportData();
  const [period, setPeriod] = useState("year");
  const [typeFilter, setTypeFilter] = useState("all");
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const now = new Date();

  const getRange = (p: string) => {
    const start = p === "month" ? startOfMonth(now) : p === "quarter" ? startOfQuarter(now) : startOfYear(now);
    const end = p === "month" ? endOfMonth(now) : p === "quarter" ? endOfQuarter(now) : endOfYear(now);
    return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") };
  };

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    const { start, end } = getRange(period);
    fetchAccountBalances(start, end).then((d) => { setLines(d); setLoading(false); });
  }, [orgId, period, fetchAccountBalances]);

  const filtered = useMemo(
    () => (typeFilter === "all" ? lines : lines.filter((l) => l.accountType === typeFilter)).filter((l) => Math.abs(l.debitTotal) > 0.005 || Math.abs(l.creditTotal) > 0.005),
    [lines, typeFilter]
  );

  const totalDebit = filtered.reduce((s, l) => s + l.debitTotal, 0);
  const totalCredit = filtered.reduce((s, l) => s + l.creditTotal, 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.02;
  const fmt = (n: number) => n === 0 ? "—" : new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Proefbalans</h1>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="month">Maand</SelectItem><SelectItem value="quarter">Kwartaal</SelectItem><SelectItem value="year">Jaar</SelectItem></SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle typen</SelectItem><SelectItem value="asset">Activa</SelectItem><SelectItem value="liability">Passiva</SelectItem>
              <SelectItem value="equity">Eigen vermogen</SelectItem><SelectItem value="revenue">Omzet</SelectItem><SelectItem value="expense">Kosten</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : (
        <motion.div variants={cardVariant}>
          <Card className="arcory-glass">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Code</TableHead><TableHead>Rekening</TableHead><TableHead className="text-right">Debet</TableHead><TableHead className="text-right">Credit</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.code}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{l.code}</TableCell>
                      <TableCell>{l.nameNl ?? l.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(l.debitTotal)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(l.creditTotal)}</TableCell>
                      <TableCell className={`text-right tabular-nums font-medium ${l.balance > 0 ? "" : l.balance < 0 ? "text-destructive" : "text-muted-foreground"}`}>{fmt(l.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-semibold">
                    <TableCell />
                    <TableCell className="flex items-center gap-2">Totaal{!balanced && <Badge variant="destructive" className="text-[10px]">Niet in balans</Badge>}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(totalDebit)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(totalCredit)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(totalDebit - totalCredit)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
