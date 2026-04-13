import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileText, FileSpreadsheet, CheckCircle2, AlertTriangle, Building2, TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { exportMultiSheet } from "@/lib/exportUtils";
import { format, startOfYear, endOfYear } from "date-fns";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

interface AccountLine {
  code: string;
  name: string;
  nameNl: string | null;
  accountType: string;
  accountSubtype: string | null;
  balance: number;
  debitTotal: number;
  creditTotal: number;
}

export default function AnnualReport() {
  const { orgId, fetchAccountBalances, fetchBalanceSheet } = useReportData();
  const { membership } = useOrganization();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [balanceLines, setBalanceLines] = useState<AccountLine[]>([]);
  const [plLines, setPlLines] = useState<AccountLine[]>([]);
  const [invoiceStats, setInvoiceStats] = useState({ salesCount: 0, salesTotal: 0, purchaseCount: 0, purchaseTotal: 0 });
  const [loading, setLoading] = useState(false);

  const yearNum = parseInt(year);
  const startDate = format(startOfYear(new Date(yearNum, 0, 1)), "yyyy-MM-dd");
  const endDate = format(endOfYear(new Date(yearNum, 0, 1)), "yyyy-MM-dd");

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    Promise.all([
      fetchBalanceSheet(endDate),
      fetchAccountBalances(startDate, endDate),
      supabase.from("invoices").select("invoice_type, total_amount").eq("organization_id", orgId).gte("invoice_date", startDate).lte("invoice_date", endDate),
    ]).then(([balance, pl, invoicesRes]) => {
      setBalanceLines(balance);
      setPlLines(pl);
      const inv = invoicesRes.data ?? [];
      setInvoiceStats({
        salesCount: inv.filter((i: any) => i.invoice_type === "sales").length,
        salesTotal: inv.filter((i: any) => i.invoice_type === "sales").reduce((s: number, i: any) => s + Number(i.total_amount), 0),
        purchaseCount: inv.filter((i: any) => i.invoice_type === "purchase").length,
        purchaseTotal: inv.filter((i: any) => i.invoice_type === "purchase").reduce((s: number, i: any) => s + Number(i.total_amount), 0),
      });
      setLoading(false);
    });
  }, [orgId, year]);

  const fmt = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  const assets = useMemo(() => balanceLines.filter((l) => l.accountType === "asset"), [balanceLines]);
  const liabilities = useMemo(() => balanceLines.filter((l) => l.accountType === "liability"), [balanceLines]);
  const equity = useMemo(() => balanceLines.filter((l) => l.accountType === "equity"), [balanceLines]);
  const revenue = useMemo(() => plLines.filter((l) => l.accountType === "revenue"), [plLines]);
  const expenses = useMemo(() => plLines.filter((l) => l.accountType === "expense"), [plLines]);

  const totalAssets = assets.reduce((s, l) => s + l.balance, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + Math.abs(l.balance), 0);
  const totalEquity = equity.reduce((s, l) => s + Math.abs(l.balance), 0);
  const totalRevenue = revenue.reduce((s, l) => s + Math.abs(l.balance), 0);
  const totalExpenses = expenses.reduce((s, l) => s + Math.abs(l.balance), 0);
  const result = totalRevenue - totalExpenses;

  const handleExportExcel = useCallback(() => {
    const balanceData = [...assets, ...liabilities, ...equity].filter((l) => Math.abs(l.balance) > 0.005).map((l) => ({
      code: l.code, rekening: l.nameNl ?? l.name, type: l.accountType, saldo: Math.abs(l.balance),
    }));
    const plData = [...revenue, ...expenses].filter((l) => Math.abs(l.balance) > 0.005).map((l) => ({
      code: l.code, rekening: l.nameNl ?? l.name, type: l.accountType === "revenue" ? "Omzet" : "Kosten", bedrag: Math.abs(l.balance),
    }));
    exportMultiSheet([
      { name: "Balans", data: balanceData, columns: [
        { header: "Code", key: "code" }, { header: "Rekening", key: "rekening" },
        { header: "Type", key: "type" }, { header: "Saldo", key: "saldo", format: "currency" },
      ]},
      { name: "Winst & Verlies", data: plData, columns: [
        { header: "Code", key: "code" }, { header: "Rekening", key: "rekening" },
        { header: "Type", key: "type" }, { header: "Bedrag", key: "bedrag", format: "currency" },
      ]},
    ], `Jaarrekening_${year}`);
  }, [assets, liabilities, equity, revenue, expenses, year]);

  const renderLines = (items: AccountLine[], showNonZero = true) =>
    items.filter((i) => !showNonZero || Math.abs(i.balance) > 0.005).map((l) => (
      <TableRow key={l.code}>
        <TableCell className="font-mono text-xs text-muted-foreground">{l.code}</TableCell>
        <TableCell>{l.nameNl ?? l.name}</TableCell>
        <TableCell className="text-right tabular-nums">{fmt(Math.abs(l.balance))}</TableCell>
      </TableRow>
    ));

  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      {/* Header */}
      <motion.div variants={cardVariant} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Jaarrekening</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {membership?.organizationName ?? "—"} • Boekjaar {year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4" />Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled>
            <FileDown className="h-4 w-4" />PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled>
            <FileText className="h-4 w-4" />Word
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : (
        <Tabs defaultValue="samenvatting" className="space-y-6">
          <TabsList className="bg-muted/30 border border-border/50">
            <TabsTrigger value="samenvatting">Samenvatting</TabsTrigger>
            <TabsTrigger value="balans">Balans</TabsTrigger>
            <TabsTrigger value="wv">Winst & Verlies</TabsTrigger>
            <TabsTrigger value="toelichting">Toelichting</TabsTrigger>
          </TabsList>

          {/* Summary */}
          <TabsContent value="samenvatting">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
              {/* KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Omzet", value: totalRevenue, icon: TrendingUp, color: "text-primary" },
                  { label: "Kosten", value: totalExpenses, icon: TrendingDown, color: "text-orange-400" },
                  { label: "Resultaat", value: result, icon: result >= 0 ? TrendingUp : TrendingDown, color: result >= 0 ? "text-primary" : "text-destructive" },
                  { label: "Balanstotaal", value: totalAssets, icon: Wallet, color: "text-blue-400" },
                ].map((kpi) => (
                  <motion.div key={kpi.label} variants={cardVariant}>
                    <Card className="arcory-glass">
                      <CardContent className="pt-5 pb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{kpi.label}</span>
                          <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                        </div>
                        <p className={`text-2xl font-bold tabular-nums mt-1 ${kpi.color}`}>{fmt(kpi.value)}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Management Summary */}
              <motion.div variants={cardVariant}>
                <Card className="arcory-glass">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Management Samenvatting</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>In boekjaar {year} is een omzet gerealiseerd van <strong className="text-foreground">{fmt(totalRevenue)}</strong> met totale kosten van <strong className="text-foreground">{fmt(totalExpenses)}</strong>.</p>
                    <p>Het resultaat bedraagt <strong className={result >= 0 ? "text-primary" : "text-destructive"}>{fmt(result)}</strong>.</p>
                    <p>Er zijn <strong className="text-foreground">{invoiceStats.salesCount}</strong> verkoopfacturen en <strong className="text-foreground">{invoiceStats.purchaseCount}</strong> inkoopfacturen verwerkt.</p>
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant="outline" className="gap-1">
                        <Receipt className="h-3 w-3" />Verkoop: {fmt(invoiceStats.salesTotal)}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Receipt className="h-3 w-3" />Inkoop: {fmt(invoiceStats.purchaseTotal)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Deponering */}
              <motion.div variants={cardVariant}>
                <Card className="arcory-glass border-primary/20">
                  <CardContent className="flex items-center justify-between py-5">
                    <div>
                      <p className="font-medium text-foreground">Deponeringsversie genereren</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Voor KVK, bank, Belastingdienst of investeerders</p>
                    </div>
                    <Button size="sm" className="gap-1.5" disabled>
                      <CheckCircle2 className="h-4 w-4" />Genereer
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Balance */}
          <TabsContent value="balans">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <motion.div variants={cardVariant}>
                  <Card className="arcory-glass">
                    <CardHeader className="pb-2"><CardTitle className="text-base">Activa</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Rekening</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {renderLines(assets)}
                          <TableRow className="font-semibold border-t-2">
                            <TableCell /><TableCell>Totaal Activa</TableCell><TableCell className="text-right tabular-nums">{fmt(totalAssets)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
              <div className="space-y-4">
                <motion.div variants={cardVariant}>
                  <Card className="arcory-glass">
                    <CardHeader className="pb-2"><CardTitle className="text-base">Passiva</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Rekening</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {renderLines(liabilities)}
                          {renderLines(equity)}
                          {result !== 0 && (
                            <TableRow><TableCell /><TableCell className="italic text-muted-foreground">Resultaat boekjaar</TableCell><TableCell className="text-right tabular-nums">{fmt(result)}</TableCell></TableRow>
                          )}
                          <TableRow className="font-semibold border-t-2">
                            <TableCell /><TableCell>Totaal Passiva</TableCell><TableCell className="text-right tabular-nums">{fmt(totalLiabilities + totalEquity + result)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </TabsContent>

          {/* P&L */}
          <TabsContent value="wv">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
              <motion.div variants={cardVariant}>
                <Card className="arcory-glass">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Omzet</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Rekening</TableHead><TableHead className="text-right">Bedrag</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {renderLines(revenue)}
                        <TableRow className="font-semibold border-t-2"><TableCell /><TableCell>Totaal Omzet</TableCell><TableCell className="text-right tabular-nums">{fmt(totalRevenue)}</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={cardVariant}>
                <Card className="arcory-glass">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Kosten</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Rekening</TableHead><TableHead className="text-right">Bedrag</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {renderLines(expenses)}
                        <TableRow className="font-semibold border-t-2"><TableCell /><TableCell>Totaal Kosten</TableCell><TableCell className="text-right tabular-nums">{fmt(totalExpenses)}</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={cardVariant}>
                <Card className={`arcory-glass ${result >= 0 ? "border-primary/30" : "border-destructive/30"}`}>
                  <CardContent className="flex items-center justify-between py-5">
                    <span className="text-lg font-semibold">Resultaat na belasting</span>
                    <span className={`text-xl font-bold tabular-nums ${result >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(result)}</span>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Notes */}
          <TabsContent value="toelichting">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
              <motion.div variants={cardVariant}>
                <Card className="arcory-glass">
                  <CardHeader><CardTitle className="text-base">Toelichting op de jaarrekening</CardTitle></CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Algemeen</h4>
                      <p>De jaarrekening is opgesteld conform de bepalingen van Titel 9, Boek 2 van het Burgerlijk Wetboek en de stellige uitspraken in de Richtlijnen voor de Jaarverslaggeving voor kleine rechtspersonen / eenmanszaken.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Grondslagen voor waardering</h4>
                      <p>Activa en passiva worden in het algemeen gewaardeerd tegen de verkrijgings- of vervaardigingsprijs of de actuele waarde. Indien geen specifieke waarderingsgrondslag is vermeld, vindt waardering plaats tegen de verkrijgingsprijs.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Materiële vaste activa</h4>
                      <p>Materiële vaste activa worden gewaardeerd tegen aanschaffingswaarde verminderd met cumulatieve afschrijvingen en indien van toepassing met bijzondere waardeverminderingen.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Vorderingen</h4>
                      <p>Vorderingen worden bij eerste verwerking gewaardeerd tegen de reële waarde en vervolgens tegen de geamortiseerde kostprijs, verminderd met eventuele voorzieningen wegens oninbaarheid.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Omzetverantwoording</h4>
                      <p>Opbrengsten uit dienstverlening worden verantwoord naar rato van de verrichte prestatie op basis van de bestede kosten in verhouding tot de geschatte totale kosten.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Per-account notes */}
              {[
                { title: "Liquide middelen", items: assets.filter((a) => ["cash", "bank"].includes(a.accountSubtype ?? "")) },
                { title: "Debiteuren", items: assets.filter((a) => a.accountSubtype === "accounts_receivable") },
                { title: "Crediteuren", items: liabilities.filter((a) => a.accountSubtype === "accounts_payable") },
                { title: "Eigen vermogen", items: equity },
              ].filter((g) => g.items.some((i) => Math.abs(i.balance) > 0.005)).map((group) => (
                <motion.div key={group.title} variants={cardVariant}>
                  <Card className="arcory-glass">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">{group.title}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {group.items.filter((i) => Math.abs(i.balance) > 0.005).map((l) => (
                            <TableRow key={l.code}>
                              <TableCell className="font-mono text-xs text-muted-foreground">{l.code}</TableCell>
                              <TableCell className="text-sm">{l.nameNl ?? l.name}</TableCell>
                              <TableCell className="text-right tabular-nums text-sm">{fmt(Math.abs(l.balance))}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
}
