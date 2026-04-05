import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { format } from "date-fns";

export default function BalanceSheet() {
  const { orgId, fetchBalanceSheet } = useReportData();
  const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    fetchBalanceSheet(asOfDate).then((d) => {
      setLines(d);
      setLoading(false);
    });
  }, [orgId, asOfDate, fetchBalanceSheet]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  const assets = useMemo(() => lines.filter((l) => l.accountType === "asset"), [lines]);
  const liabilities = useMemo(() => lines.filter((l) => l.accountType === "liability"), [lines]);
  const equity = useMemo(() => lines.filter((l) => l.accountType === "equity"), [lines]);

  const fixedAssets = assets.filter((a) => a.code.startsWith("0"));
  const currentAssets = assets.filter((a) => a.code.startsWith("1"));

  const totalAssets = assets.reduce((s, l) => s + l.balance, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + Math.abs(l.balance), 0);
  const totalEquity = equity.reduce((s, l) => s + Math.abs(l.balance), 0);
  // Add P&L result to equity side
  const revenueLines = lines.filter((l) => l.accountType === "revenue");
  const expenseLines = lines.filter((l) => l.accountType === "expense");
  const plResult = revenueLines.reduce((s, l) => s + Math.abs(l.balance), 0) - expenseLines.reduce((s, l) => s + Math.abs(l.balance), 0);
  const totalPassiva = totalLiabilities + totalEquity + plResult;
  const balanced = Math.abs(totalAssets - totalPassiva) < 0.02;

  const renderGroup = (title: string, items: any[], total: number) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Rekening</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.filter(i => Math.abs(i.balance) > 0.005).map((l: any) => (
              <TableRow key={l.code}>
                <TableCell className="font-mono text-xs text-muted-foreground">{l.code}</TableCell>
                <TableCell>{l.nameNl ?? l.name}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(Math.abs(l.balance))}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold border-t-2">
              <TableCell />
              <TableCell>Totaal</TableCell>
              <TableCell className="text-right tabular-nums">{fmt(total)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Balans</h1>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Per datum</Label>
          <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="w-[160px]" />
        </div>
      </div>

      {!balanced && !loading && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Balans is niet in evenwicht. Activa ({fmt(totalAssets)}) ≠ Passiva ({fmt(totalPassiva)}).
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Activa</h2>
            {renderGroup("Vaste activa (0xxx)", fixedAssets, fixedAssets.reduce((s, l) => s + l.balance, 0))}
            {renderGroup("Vlottende activa (1xxx)", currentAssets, currentAssets.reduce((s, l) => s + l.balance, 0))}
            <Card className="border-primary/30">
              <CardContent className="flex items-center justify-between py-4">
                <span className="font-semibold">Totaal Activa</span>
                <span className="text-lg font-bold tabular-nums">{fmt(totalAssets)}</span>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Passiva</h2>
            {renderGroup("Kort vreemd vermogen (2xxx)", liabilities, totalLiabilities)}
            {renderGroup("Eigen vermogen (3xxx)", equity, totalEquity)}
            {plResult !== 0 && (
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <span className="text-sm text-muted-foreground">Resultaat lopend boekjaar</span>
                  <span className="tabular-nums">{fmt(plResult)}</span>
                </CardContent>
              </Card>
            )}
            <Card className="border-primary/30">
              <CardContent className="flex items-center justify-between py-4">
                <span className="font-semibold">Totaal Passiva</span>
                <span className="text-lg font-bold tabular-nums">{fmt(totalPassiva)}</span>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
