import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportButton } from "@/components/ExportButton";
import { exportToExcel } from "@/lib/exportUtils";
import { FileDown, TrendingUp, TrendingDown } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from "date-fns";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

interface AccountLine { code: string; name: string; nameNl: string | null; accountType: string; accountSubtype: string | null; balance: number; }

export default function ProfitLoss() {
  const { orgId, fetchAccountBalances } = useReportData();
  const [period, setPeriod] = useState("month");
  const [compare, setCompare] = useState(false);
  const [lines, setLines] = useState<AccountLine[]>([]);
  const [prevLines, setPrevLines] = useState<AccountLine[]>([]);
  const [loading, setLoading] = useState(false);
  const now = new Date();

  const getRange = (p: string, offset = 0) => {
    const ref = p === "month" ? subMonths(now, offset) : p === "quarter" ? subQuarters(now, offset) : subYears(now, offset);
    const start = p === "month" ? startOfMonth(ref) : p === "quarter" ? startOfQuarter(ref) : startOfYear(ref);
    const end = p === "month" ? endOfMonth(ref) : p === "quarter" ? endOfQuarter(ref) : endOfYear(ref);
    return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") };
  };

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    const { start, end } = getRange(period, 0);
    fetchAccountBalances(start, end).then((d) => {
      setLines(d);
      if (compare) {
        const prev = getRange(period, 1);
        fetchAccountBalances(prev.start, prev.end).then((pd) => { setPrevLines(pd); setLoading(false); });
      } else { setPrevLines([]); setLoading(false); }
    });
  }, [orgId, period, compare, fetchAccountBalances]);

  const revenue = useMemo(() => lines.filter((l) => l.accountType === "revenue"), [lines]);
  const expenses = useMemo(() => lines.filter((l) => l.accountType === "expense"), [lines]);
  const prevRevenue = useMemo(() => prevLines.filter((l) => l.accountType === "revenue"), [prevLines]);
  const prevExpenses = useMemo(() => prevLines.filter((l) => l.accountType === "expense"), [prevLines]);

  const totalRevenue = revenue.reduce((s, l) => s + Math.abs(l.balance), 0);
  const totalExpenses = expenses.reduce((s, l) => s + Math.abs(l.balance), 0);
  const result = totalRevenue - totalExpenses;
  const prevTotalRevenue = prevRevenue.reduce((s, l) => s + Math.abs(l.balance), 0);
  const prevTotalExpenses = prevExpenses.reduce((s, l) => s + Math.abs(l.balance), 0);
  const prevResult = prevTotalRevenue - prevTotalExpenses;

  const fmt = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  const grouped = useMemo(() => {
    const groups: Record<string, AccountLine[]> = {};
    expenses.forEach((e) => { const key = e.accountSubtype ?? "overig"; if (!groups[key]) groups[key] = []; groups[key].push(e); });
    return groups;
  }, [expenses]);

  const renderSection = (title: string, items: AccountLine[], total: number, prevTotal?: number) => (
    <motion.div variants={cardVariant}>
      <Card className="arcory-glass">
        <CardHeader className="pb-2"><CardTitle className="text-base font-medium">{title}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Code</TableHead><TableHead>Rekening</TableHead><TableHead className="text-right">Bedrag</TableHead>{compare && <TableHead className="text-right">Vorige periode</TableHead>}</TableRow>
            </TableHeader>
            <TableBody>
              {items.filter(i => Math.abs(i.balance) > 0.005).map((l) => {
                const prevLine = prevLines.find((p) => p.code === l.code);
                return (
                  <TableRow key={l.code}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{l.code}</TableCell>
                    <TableCell>{l.nameNl ?? l.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(Math.abs(l.balance))}</TableCell>
                    {compare && <TableCell className="text-right tabular-nums text-muted-foreground">{prevLine ? fmt(Math.abs(prevLine.balance)) : "—"}</TableCell>}
                  </TableRow>
                );
              })}
              <TableRow className="font-semibold border-t-2">
                <TableCell /><TableCell>Totaal {title.toLowerCase()}</TableCell><TableCell className="text-right tabular-nums">{fmt(total)}</TableCell>
                {compare && <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(prevTotal ?? 0)}</TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Winst & Verlies</h1>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="month">Maand</SelectItem><SelectItem value="quarter">Kwartaal</SelectItem><SelectItem value="year">Jaar</SelectItem></SelectContent>
          </Select>
          <div className="flex items-center gap-2"><Switch checked={compare} onCheckedChange={setCompare} id="compare" /><Label htmlFor="compare" className="text-sm text-muted-foreground">Vergelijken</Label></div>
          <Button variant="outline" size="sm"><FileDown className="mr-1.5 h-4 w-4" />PDF</Button>
          <ExportButton onClick={() => {
            const allLines = [...revenue, ...expenses].filter(l => Math.abs(l.balance) > 0.005);
            exportToExcel(allLines.map(l => ({ code: l.code, rekening: l.nameNl ?? l.name, type: l.accountType === "revenue" ? "Omzet" : "Kosten", bedrag: Math.abs(l.balance) })),
              [{ header: "Code", key: "code" }, { header: "Rekening", key: "rekening" }, { header: "Type", key: "type" }, { header: "Bedrag", key: "bedrag", format: "currency" }],
              `WinstVerlies_${period}`, "W&V");
          }} />
        </div>
      </motion.div>

      {loading ? <p className="text-sm text-muted-foreground">Laden...</p> : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
          {renderSection("Omzet", revenue, totalRevenue, prevTotalRevenue)}

          <motion.div variants={cardVariant}>
            <Card className="arcory-glass">
              <CardHeader className="pb-2"><CardTitle className="text-base font-medium">Kosten</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Rekening</TableHead><TableHead className="text-right">Bedrag</TableHead>{compare && <TableHead className="text-right">Vorige periode</TableHead>}</TableRow></TableHeader>
                  <TableBody>
                    {Object.entries(grouped).map(([group, items]) => (
                      items.filter(i => Math.abs(i.balance) > 0.005).map((l) => {
                        const prevLine = prevLines.find((p) => p.code === l.code);
                        return (
                          <TableRow key={l.code}>
                            <TableCell className="font-mono text-xs text-muted-foreground">{l.code}</TableCell>
                            <TableCell>{l.nameNl ?? l.name}</TableCell>
                            <TableCell className="text-right tabular-nums">{fmt(Math.abs(l.balance))}</TableCell>
                            {compare && <TableCell className="text-right tabular-nums text-muted-foreground">{prevLine ? fmt(Math.abs(prevLine.balance)) : "—"}</TableCell>}
                          </TableRow>
                        );
                      })
                    ))}
                    <TableRow className="font-semibold border-t-2">
                      <TableCell /><TableCell>Totaal kosten</TableCell><TableCell className="text-right tabular-nums">{fmt(totalExpenses)}</TableCell>
                      {compare && <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(prevTotalExpenses)}</TableCell>}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariant}>
            <Card className={`arcory-glass ${result >= 0 ? "border-primary/30" : "border-destructive/30"}`}>
              <CardContent className="flex items-center justify-between py-5">
                <div className="flex items-center gap-3">
                  {result >= 0 ? <TrendingUp className="h-5 w-5 text-primary" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
                  <span className="text-lg font-semibold">Resultaat</span>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-bold tabular-nums ${result >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(result)}</span>
                  {compare && <span className="ml-4 text-sm text-muted-foreground tabular-nums">{fmt(prevResult)}</span>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
