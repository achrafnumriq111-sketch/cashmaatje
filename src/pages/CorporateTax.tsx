import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Calculator, Sparkles, FileText, AlertCircle } from "lucide-react";
import { useVpbReturns, useUpsertVpb, calcVpb } from "@/hooks/useVpb";
import { useReportData } from "@/hooks/useReportData";
import { useOrganization } from "@/hooks/useOrganization";
import { pageTransition, cardVariant, staggerContainer } from "@/lib/animations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

export default function CorporateTax() {
  const { membership } = useOrganization();
  const orgType = (membership?.organization as any)?.org_type;
  const isBV = orgType === "bv" || orgType === "nv";

  const [year, setYear] = useState(currentYear);
  const { data: returns = [] } = useVpbReturns();
  const upsert = useUpsertVpb();

  // Pull profit from P&L
  const reportFrom = `${year}-01-01`;
  const reportTo = `${year}-12-31`;
  const { profitLoss } = useReportData(reportFrom, reportTo);
  const computedProfit = useMemo(() => {
    const result = (profitLoss?.data as any)?.result ?? 0;
    return Math.max(0, Math.round(Number(result) || 0));
  }, [profitLoss?.data]);

  const existing = returns.find((r) => r.fiscal_year === year);
  const [taxableProfit, setTaxableProfit] = useState(0);
  const [lossCarry, setLossCarry] = useState(0);
  const [innovation, setInnovation] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (existing) {
      setTaxableProfit(Number(existing.taxable_profit));
      setLossCarry(Number(existing.loss_carryforward));
      setInnovation(Number(existing.innovation_box_amount));
      setNotes(existing.notes ?? "");
    } else {
      setTaxableProfit(computedProfit);
      setLossCarry(0);
      setInnovation(0);
      setNotes("");
    }
  }, [year, existing?.id, computedProfit]);

  const calc = useMemo(
    () =>
      calcVpb({
        taxable_profit: taxableProfit,
        loss_carryforward: lossCarry,
        innovation_box_amount: innovation,
      }),
    [taxableProfit, lossCarry, innovation]
  );

  const autoFill = () => {
    setTaxableProfit(computedProfit);
    toast.success("Winst overgenomen uit Winst & Verlies");
  };

  const save = () =>
    upsert.mutate({
      fiscal_year: year,
      taxable_profit: taxableProfit,
      loss_carryforward: lossCarry,
      innovation_box_amount: innovation,
      notes,
      status: "draft",
    });

  const finalize = () =>
    upsert.mutate({
      fiscal_year: year,
      taxable_profit: taxableProfit,
      loss_carryforward: lossCarry,
      innovation_box_amount: innovation,
      notes,
      status: "finalized",
    });

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vennootschapsbelasting</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automatische VPB-berekening voor BV's en NV's. Tarieven 2024+: 19% tot €200.000, 25,8% daarboven.
          </p>
        </div>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </motion.div>

      {!isBV && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            VPB geldt alleen voor BV's en NV's. Jouw onderneming is geregistreerd als{" "}
            <strong>{orgType ?? "onbekend"}</strong>. Pas de rechtsvorm aan in instellingen om VPB te activeren.
          </AlertDescription>
        </Alert>
      )}

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-4">
        {[
          { icon: <Building2 className="h-5 w-5 text-primary" />, label: "Belastbare winst", value: fmt(calc.adjusted_profit) },
          { icon: <Calculator className="h-5 w-5 text-primary" />, label: "Lage schijf (19%)", value: fmt(calc.tax_low_bracket) },
          { icon: <Calculator className="h-5 w-5 text-destructive" />, label: "Hoge schijf (25,8%)", value: fmt(calc.tax_high_bracket) },
          { icon: <FileText className="h-5 w-5 text-primary" />, label: `Totaal VPB (${calc.effective_rate}%)`, value: fmt(calc.total_tax) },
        ].map((kpi, i) => (
          <motion.div key={i} variants={cardVariant}>
            <Card className="arcory-glass">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">{kpi.icon}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-lg font-semibold tabular-nums">{kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Aangifte {year}</CardTitle>
              {existing && (
                <Badge variant="outline" className="mt-1">
                  Status: {existing.status === "submitted" ? "Ingediend" : existing.status === "finalized" ? "Definitief" : "Concept"}
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={autoFill} className="gap-2">
              <Sparkles className="h-4 w-4" /> Auto-vul uit W&V
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Belastbare winst</Label>
                <Input type="number" value={taxableProfit} onChange={(e) => setTaxableProfit(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground mt-1">Berekend uit W&V: {fmt(computedProfit)}</p>
              </div>
              <div>
                <Label>Verliescompensatie</Label>
                <Input type="number" value={lossCarry} onChange={(e) => setLossCarry(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground mt-1">Verliezen uit voorgaande jaren</p>
              </div>
              <div>
                <Label>Innovatiebox (9%)</Label>
                <Input type="number" value={innovation} onChange={(e) => setInnovation(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground mt-1">Winst uit innovatie/IP</p>
              </div>
            </div>
            <div>
              <Label>Notities</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optionele notities..." />
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Belastbare winst (na compensatie & innovatiebox)</span><span className="tabular-nums">{fmt(calc.adjusted_profit)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Lage schijf (19%)</span><span className="tabular-nums">{fmt(calc.tax_low_bracket)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Hoge schijf (25,8%) + innovatiebox</span><span className="tabular-nums">{fmt(calc.tax_high_bracket)}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold text-base"><span>Totaal te betalen</span><span className="tabular-nums">{fmt(calc.total_tax)}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Effectief tarief</span><span>{calc.effective_rate}%</span></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={save} disabled={upsert.isPending}>Opslaan als concept</Button>
              <Button onClick={finalize} disabled={upsert.isPending}>Definitief maken</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardHeader><CardTitle className="text-base">Historie</CardTitle></CardHeader>
          <CardContent>
            {returns.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen aangiftes opgeslagen.</p>
            ) : (
              <div className="space-y-2">
                {returns.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border-b border-border/50 py-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{r.fiscal_year}</span>
                      <Badge variant="outline">{r.status === "submitted" ? "Ingediend" : r.status === "finalized" ? "Definitief" : "Concept"}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">Winst: {fmt(Number(r.taxable_profit))}</span>
                      <span className="font-medium tabular-nums">{fmt(Number(r.total_tax))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
