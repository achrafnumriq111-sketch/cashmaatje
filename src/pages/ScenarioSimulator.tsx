import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { pageTransition, cardVariant } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, RotateCcw, Sparkles, BookOpen } from "lucide-react";
import { useTaxReserve } from "@/hooks/useTaxReserve";
import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { MemorialJournalDialog } from "@/components/journal/MemorialJournalDialog";

const NL_INCOME_TAX_RATE = 0.3193;
const NL_VAT_RATE = 0.21;

export default function ScenarioSimulator() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const { data: reserve } = useTaxReserve();
  const [memorialOpen, setMemorialOpen] = useState(false);

  // Haal YTD baseline op
  const { data: baseline } = useQuery({
    queryKey: ["scenario-baseline", orgId],
    queryFn: async () => {
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
      const [salesRes, purchasesRes] = await Promise.all([
        supabase.from("invoices").select("total_amount, total_vat")
          .eq("organization_id", orgId!).eq("invoice_type", "sales").gte("invoice_date", yearStart),
        supabase.from("invoices").select("total_amount, total_vat")
          .eq("organization_id", orgId!).eq("invoice_type", "purchase").gte("invoice_date", yearStart),
      ]);
      const ytdRevenue = (salesRes.data ?? []).reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
      const ytdSpend = (purchasesRes.data ?? []).reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
      const monthsElapsed = Math.max(1, new Date().getMonth() + 1);
      return {
        ytdRevenue,
        ytdSpend,
        annualizedRevenue: (ytdRevenue / monthsElapsed) * 12,
        annualizedSpend: (ytdSpend / monthsElapsed) * 12,
      };
    },
    enabled: !!orgId,
  });

  // Sliders: verandering in %
  const [revenueDelta, setRevenueDelta] = useState(0); // -50 tot +100
  const [costDelta, setCostDelta] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(75);
  const [hoursPerWeek, setHoursPerWeek] = useState(0); // 0 = gebruik baseline

  const projection = useMemo(() => {
    const baseRevenue = baseline?.annualizedRevenue ?? 0;
    const baseSpend = baseline?.annualizedSpend ?? 0;

    const projectedRevenue =
      hoursPerWeek > 0
        ? hoursPerWeek * 48 * hourlyRate
        : baseRevenue * (1 + revenueDelta / 100);
    const projectedSpend = baseSpend * (1 + costDelta / 100);
    const projectedProfit = projectedRevenue - projectedSpend;
    const projectedVat = projectedRevenue * NL_VAT_RATE - projectedSpend * NL_VAT_RATE;
    const projectedIncomeTax = Math.max(0, projectedProfit) * NL_INCOME_TAX_RATE;
    const netTakeHome = projectedProfit - projectedIncomeTax;

    const baseProfit = baseRevenue - baseSpend;
    const profitDelta = projectedProfit - baseProfit;
    const profitDeltaPct = baseProfit !== 0 ? (profitDelta / Math.abs(baseProfit)) * 100 : 0;

    return {
      projectedRevenue,
      projectedSpend,
      projectedProfit,
      projectedVat,
      projectedIncomeTax,
      netTakeHome,
      baseRevenue,
      baseSpend,
      baseProfit,
      profitDelta,
      profitDeltaPct,
    };
  }, [baseline, revenueDelta, costDelta, hourlyRate, hoursPerWeek]);

  const reset = () => {
    setRevenueDelta(0);
    setCostDelta(0);
    setHoursPerWeek(0);
    setHourlyRate(75);
  };

  const fmt = (n: number) => `€${Math.round(n).toLocaleString("nl-NL")}`;

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Scenario Simulator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Wat als je 20% meer verdient? Of een werknemer aanneemt? Speel met de variabelen en zie direct het effect op winst en belasting.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setMemorialOpen(true)}>
            <BookOpen className="h-3.5 w-3.5 mr-1" />Memoriaalboeking
          </Button>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" />Reset
          </Button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={cardVariant}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />Variabelen
              </CardTitle>
              <CardDescription>
                Baseline = jouw YTD geannualiseerd: {fmt(projection.baseRevenue)} omzet · {fmt(projection.baseSpend)} kosten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Omzet verandering</label>
                  <span className={`text-sm font-mono ${revenueDelta > 0 ? "text-emerald-500" : revenueDelta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {revenueDelta > 0 ? "+" : ""}{revenueDelta}%
                  </span>
                </div>
                <Slider value={[revenueDelta]} onValueChange={(v) => setRevenueDelta(v[0])} min={-50} max={100} step={5} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Kosten verandering</label>
                  <span className={`text-sm font-mono ${costDelta < 0 ? "text-emerald-500" : costDelta > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {costDelta > 0 ? "+" : ""}{costDelta}%
                  </span>
                </div>
                <Slider value={[costDelta]} onValueChange={(v) => setCostDelta(v[0])} min={-50} max={100} step={5} />
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <p className="text-xs text-muted-foreground">Of bereken vanaf uurtarief (override):</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Uurtarief (€)</label>
                    <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Declarabele uren/week</label>
                    <Input type="number" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(Number(e.target.value))} placeholder="0 = uit" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {hoursPerWeek > 0 ? `Override actief: ${hoursPerWeek}u × 48 weken × €${hourlyRate}` : "Override staat uit — sliders worden gebruikt"}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariant} className="space-y-3">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Geprojecteerde winst</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground tabular-nums">{fmt(projection.projectedProfit)}</div>
              <div className={`flex items-center gap-1 mt-1 text-sm ${projection.profitDelta >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                {projection.profitDelta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : projection.profitDelta < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                {projection.profitDelta >= 0 ? "+" : ""}{fmt(projection.profitDelta)} ({projection.profitDeltaPct.toFixed(0)}%) vs baseline
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <Row label="Geprojecteerde omzet" value={fmt(projection.projectedRevenue)} />
              <Row label="Geprojecteerde kosten" value={fmt(projection.projectedSpend)} muted />
              <div className="border-t border-border my-2" />
              <Row label="BTW saldo (af te dragen)" value={fmt(Math.max(0, projection.projectedVat))} muted />
              <Row label="Inkomstenbelasting (indicatief)" value={fmt(projection.projectedIncomeTax)} muted />
              <div className="border-t border-border my-2" />
              <Row label="Netto in eigen zak" value={fmt(projection.netTakeHome)} highlight />
            </CardContent>
          </Card>

          {reserve && (
            <p className="text-[11px] text-muted-foreground italic">
              Belastingtarieven zijn indicatief (NL box-1 eerste schijf 2025). Voor exacte berekening: raadpleeg je accountant.
            </p>
          )}
        </motion.div>
      </div>
      <MemorialJournalDialog open={memorialOpen} onOpenChange={setMemorialOpen} />
    </motion.div>
  );
}

function Row({ label, value, muted, highlight }: { label: string; value: string; muted?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${muted ? "text-muted-foreground" : "text-foreground"}`}>{label}</span>
      <span className={`text-sm tabular-nums ${highlight ? "font-bold text-primary" : muted ? "text-foreground" : "font-medium text-foreground"}`}>{value}</span>
    </div>
  );
}
