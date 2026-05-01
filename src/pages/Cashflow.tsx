import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { ArrowDownLeft, ArrowUpRight, AlertTriangle, Sparkles, TrendingUp, Wallet, Receipt, Repeat } from "lucide-react";
import { useCashflowForecast } from "@/hooks/useCashflowForecast";
import { buildForecastInsight } from "@/lib/cashflowForecast";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartEmptyState } from "@/components/ui/smart-empty-state";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

const chartConfig = {
  cumulative: { label: "Cash positie", color: "hsl(var(--primary))" },
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const horizons: Array<{ value: 30 | 60 | 90; label: string }> = [
  { value: 30, label: "30 dagen" },
  { value: 60, label: "60 dagen" },
  { value: 90, label: "90 dagen" },
];

export default function Cashflow() {
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);
  const { data: forecast, isLoading } = useCashflowForecast(horizon);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-[1400px]">
      <motion.div variants={cardVariant} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-foreground">Cashflow forecast</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Voorspelling op basis van openstaande facturen, terugkerende kosten en BTW-deadlines.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          {horizons.map((h) => (
            <button
              key={h.value}
              onClick={() => setHorizon(h.value)}
              className={`px-3 py-1.5 text-[12.5px] rounded-lg transition-colors ${
                horizon === h.value
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : !forecast || forecast.points.length === 0 ? (
        <Card className="arcory-glass">
          <CardContent>
            <SmartEmptyState
              icon={TrendingUp}
              title="Nog geen forecast beschikbaar"
              description="Voeg openstaande facturen of een bankrekening toe om een voorspelling te maken."
              whyItMatters="Een forecast laat tekorten zien vóórdat ze gebeuren — zo kun je op tijd bijsturen."
              actionLabel="Maak factuur"
              actionTo="/facturen/verkoop"
            />
          </CardContent>
        </Card>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
          {/* AI insight */}
          <motion.div variants={cardVariant}>
            <Card
              className={`arcory-glass border ${
                forecast.riskOfShortage ? "border-red-400/30" : "border-primary/20"
              }`}
            >
              <CardContent className="flex items-start gap-3 p-4">
                {forecast.riskOfShortage ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                ) : (
                  <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                )}
                <p className="text-[13.5px] text-foreground/90">{buildForecastInsight(forecast)}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* KPI strip */}
          <motion.div variants={cardVariant} className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Start", value: forecast.startBalance, icon: Wallet, color: "text-foreground" },
              { label: "Eind (verwacht)", value: forecast.endBalance, icon: TrendingUp, color: forecast.endBalance >= forecast.startBalance ? "text-emerald-400" : "text-amber-400" },
              { label: "Ontvangsten", value: forecast.totalInflow, icon: ArrowDownLeft, color: "text-emerald-400" },
              { label: "Uitgaven", value: forecast.totalOutflow, icon: ArrowUpRight, color: "text-red-400" },
            ].map((k) => (
              <div key={k.label} className="arcory-glass rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <k.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-micro text-muted-foreground">{k.label}</span>
                </div>
                <p className={`mt-2 text-[20px] font-semibold tracking-tight tabular-nums ${k.color}`}>
                  {fmtEur(k.value)}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Forecast chart */}
          <motion.div variants={cardVariant}>
            <Card className="arcory-glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Verwachte cashpositie · komende {horizon} dagen</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <AreaChart data={forecast.points}>
                    <defs>
                      <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                      tickFormatter={(d) => d.slice(5)}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                      tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#cashGradient)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Component breakdown */}
          <motion.div variants={cardVariant} className="grid gap-4 md:grid-cols-3">
            <Card className="arcory-glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-micro text-muted-foreground">Verwachte ontvangsten</span>
                </div>
                <p className="mt-2 text-[18px] font-semibold tabular-nums text-emerald-400">
                  {fmtEur(forecast.expectedReceivables)}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">Uit openstaande verkoopfacturen</p>
              </CardContent>
            </Card>
            <Card className="arcory-glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Repeat className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-micro text-muted-foreground">Terugkerende kosten</span>
                </div>
                <p className="mt-2 text-[18px] font-semibold tabular-nums text-amber-400">
                  {fmtEur(forecast.recurringExpenses)}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">Software, abonnementen, vaste lasten</p>
              </CardContent>
            </Card>
            <Card className="arcory-glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-micro text-muted-foreground">BTW-afdracht</span>
                </div>
                <p className="mt-2 text-[18px] font-semibold tabular-nums text-blue-400">
                  {fmtEur(forecast.vatObligation)}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {forecast.vatObligation > 0 ? "Valt binnen forecast-periode" : "Geen deadline binnen periode"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
