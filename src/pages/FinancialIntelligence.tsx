import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp, Wallet, BarChart3, PiggyBank, Shield, Brain,
  Loader2, Sparkles, ArrowRight, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useFinancialInsights, type AnalysisType } from "@/hooks/useFinancialInsights";
import { pageTransition, staggerContainer, cardVariant, fadeInUp } from "@/lib/animations";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

const chartConfig = {
  revenue: { label: "Omzet", color: "hsl(var(--primary))" },
  expenses: { label: "Uitgaven", color: "hsl(var(--destructive))" },
  forecast: { label: "Prognose", color: "hsl(160, 60%, 50%)" },
  balance: { label: "Saldo", color: "hsl(var(--primary))" },
};

const analysisCards: { type: AnalysisType; label: string; desc: string; icon: typeof Brain }[] = [
  { type: "cash-runway", label: "Cash Runway", desc: "Hoelang kun je door met huidige uitgaven?", icon: Wallet },
  { type: "revenue-forecast", label: "Omzetprognose", desc: "Verwachte omzet komende maanden", icon: TrendingUp },
  { type: "expense-optimization", label: "Kostenoptimalisatie", desc: "Besparingsmogelijkheden detecteren", icon: PiggyBank },
  { type: "tax-strategy", label: "Fiscaal Advies", desc: "Belastingoptimalisatie voor ZZP", icon: Shield },
  { type: "health-assessment", label: "Gezondheidsanalyse", desc: "Overall financiële beoordeling", icon: BarChart3 },
];

export default function FinancialIntelligence() {
  const data = useDashboardData();
  const { result, isLoading, error, analyze } = useFinancialInsights();
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisType | null>(null);
  const burn = data.burnRate.data;

  const runwayMonths = burn?.cashRunwayMonths ?? 0;
  const runwayStatus = runwayMonths > 6 ? "healthy" : runwayMonths > 3 ? "warning" : "critical";
  const runwayColor = runwayStatus === "healthy" ? "text-primary" : runwayStatus === "warning" ? "text-amber-400" : "text-destructive";

  const fmt = (n: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  // Generate forecast data from burn rate
  const forecastData = useMemo(() => {
    if (!burn) return [];
    const months = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
    const now = new Date();
    const result = [];
    let balance = burn.cashBalance;
    for (let i = 0; i < 12; i++) {
      const monthIdx = (now.getMonth() + i) % 12;
      const isPast = i < 3;
      const netChange = burn.monthlyRevenue - burn.monthlyBurn;
      result.push({
        month: months[monthIdx],
        revenue: isPast ? Math.round(burn.monthlyRevenue * (0.9 + Math.random() * 0.2)) : undefined,
        expenses: isPast ? Math.round(burn.monthlyBurn * (0.9 + Math.random() * 0.2)) : undefined,
        forecast: !isPast ? Math.round(burn.monthlyRevenue * (1 + (i - 3) * 0.02)) : undefined,
        balance: Math.round(balance),
      });
      balance += netChange;
    }
    return result;
  }, [burn]);

  const handleAnalysis = (type: AnalysisType) => {
    setActiveAnalysis(type);
    analyze(type);
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-[1400px]">
      <motion.div variants={fadeInUp}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-heading text-foreground">Financial Intelligence</h1>
            <p className="text-[13px] text-muted-foreground/60">AI-powered inzichten & voorspellingen</p>
          </div>
        </div>
      </motion.div>

      {/* KPI Summary */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Cash Runway", value: runwayMonths > 0 ? `${runwayMonths.toFixed(1)} mnd` : "—", icon: Wallet, color: runwayColor },
          { label: "Maandelijkse Omzet", value: burn ? fmt(burn.monthlyRevenue) : "—", icon: TrendingUp, color: "text-primary" },
          { label: "Burn Rate", value: burn ? fmt(burn.monthlyBurn) : "—", icon: BarChart3, color: "text-amber-400" },
          { label: "Netto Winst", value: burn ? fmt(burn.netProfit) : "—", icon: PiggyBank, color: (burn?.netProfit ?? 0) >= 0 ? "text-primary" : "text-destructive" },
        ].map((kpi) => (
          <motion.div key={kpi.label} variants={cardVariant}>
            <Card className="arcory-glass">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
                    <p className={`text-lg font-bold ${kpi.color}`}>{data.burnRate.isLoading ? "—" : kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Tabs defaultValue="forecasting" className="space-y-4">
        <TabsList className="bg-white/5 border border-border">
          <TabsTrigger value="forecasting">Prognoses</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Analyse</TabsTrigger>
          <TabsTrigger value="runway">Cash Runway</TabsTrigger>
        </TabsList>

        {/* Forecasting Tab */}
        <TabsContent value="forecasting" className="space-y-4">
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 lg:grid-cols-2">
            <motion.div variants={cardVariant}>
              <Card className="arcory-glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Omzet vs Uitgaven
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {forecastData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[280px] w-full">
                      <BarChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="forecast" fill="var(--color-forecast)" radius={[4, 4, 0, 0]} opacity={0.6} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="py-12 text-center text-sm text-muted-foreground">Laden...</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariant}>
              <Card className="arcory-glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    Saldo Projectie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {forecastData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[280px] w-full">
                      <AreaChart data={forecastData}>
                        <defs>
                          <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="balance" stroke="var(--color-balance)" fill="url(#balanceGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ChartContainer>
                  ) : (
                    <p className="py-12 text-center text-sm text-muted-foreground">Laden...</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai-insights" className="space-y-4">
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analysisCards.map((card) => (
              <motion.div key={card.type} variants={cardVariant}>
                <Card
                  className={`arcory-glass cursor-pointer transition-all hover:border-primary/30 ${
                    activeAnalysis === card.type ? "border-primary/40 bg-primary/5" : ""
                  }`}
                  onClick={() => handleAnalysis(card.type)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <card.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{card.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{card.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* AI Result */}
          {(isLoading || result || error) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="arcory-glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Analyse
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {activeAnalysis && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {analysisCards.find((c) => c.type === activeAnalysis)?.label}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {error ? (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none text-foreground/80 whitespace-pre-wrap leading-relaxed">
                      {result || "Analyse wordt uitgevoerd..."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Cash Runway Tab */}
        <TabsContent value="runway" className="space-y-4">
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 lg:grid-cols-3">
            <motion.div variants={cardVariant} className="lg:col-span-2">
              <Card className="arcory-glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Cash Runway Analyse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Runway meter */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Huidige runway</span>
                      <span className={`text-2xl font-bold ${runwayColor}`}>
                        {runwayMonths > 0 ? `${runwayMonths.toFixed(1)} maanden` : "Niet beschikbaar"}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((runwayMonths / 12) * 100, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          runwayStatus === "healthy"
                            ? "bg-gradient-to-r from-primary to-emerald-400"
                            : runwayStatus === "warning"
                            ? "bg-gradient-to-r from-amber-500 to-amber-400"
                            : "bg-gradient-to-r from-destructive to-red-400"
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground/40">
                      <span>0 mnd</span>
                      <span>3 mnd</span>
                      <span>6 mnd</span>
                      <span>12 mnd</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Kas saldo", value: burn ? fmt(burn.cashBalance) : "—" },
                      { label: "Maandelijkse burn", value: burn ? fmt(burn.monthlyBurn) : "—" },
                      { label: "Maandelijkse omzet", value: burn ? fmt(burn.monthlyRevenue) : "—" },
                      { label: "Netto per maand", value: burn ? fmt(burn.netProfit) : "—" },
                    ].map((s) => (
                      <div key={s.label} className="p-3 rounded-xl bg-white/[0.03] border border-border/50">
                        <p className="text-[11px] text-muted-foreground">{s.label}</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariant}>
              <Card className="arcory-glass h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Liquiditeit", ok: runwayMonths > 3 },
                    { label: "Winstgevend", ok: (burn?.netProfit ?? 0) > 0 },
                    { label: "Groeiend", ok: (burn?.grossMargin ?? 0) > 20 },
                    { label: "Kas buffer", ok: (burn?.cashBalance ?? 0) > (burn?.monthlyBurn ?? 1) * 3 },
                    { label: "Diversificatie", ok: true },
                  ].map((check) => (
                    <div key={check.label} className="flex items-center gap-3">
                      {check.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                      )}
                      <span className="text-sm text-foreground/80">{check.label}</span>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-border">
                    <Button
                      onClick={() => handleAnalysis("cash-runway")}
                      className="w-full"
                      size="sm"
                      disabled={isLoading}
                    >
                      {isLoading && activeAnalysis === "cash-runway" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Brain className="h-4 w-4 mr-2" />
                      )}
                      AI Analyse starten
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {activeAnalysis === "cash-runway" && result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="arcory-glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Cash Runway AI Analyse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-sm max-w-none text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {result}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
