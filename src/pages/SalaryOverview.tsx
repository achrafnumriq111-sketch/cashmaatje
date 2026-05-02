import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import {
  TrendingUp, TrendingDown, Calculator, Package, Car, Home, Shield,
  ChevronRight, Wallet, MapPin, HandCoins, Briefcase, User, ArrowRight, PiggyBank, Receipt
} from "lucide-react";
import { useTaxDeductions } from "@/hooks/useTaxDeductions";
import { useBusinessExpenses } from "@/hooks/useBusinessExpenses";
import { useDepreciations } from "@/hooks/useDepreciations";
import { useDeductiblePremiums } from "@/hooks/useDeductiblePremiums";
import { useCompanyCar } from "@/hooks/useCompanyCar";
import { useMortgageDeduction } from "@/hooks/useMortgageDeduction";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

/**
 * Vereenvoudigde IB-schatting box 1 (2024/2025 schijven, indicatief).
 * Niet bedoeld voor exacte aangifte — alleen voor netto-indicatie.
 */
function estimateIB(taxable: number): { tax: number; effectiveRate: number } {
  if (taxable <= 0) return { tax: 0, effectiveRate: 0 };
  const bracket1 = Math.min(taxable, 75518);
  const bracket2 = Math.max(0, taxable - 75518);
  const tax = bracket1 * 0.3697 + bracket2 * 0.495;
  // Heffingskorting indicatief
  const algemeneKorting = Math.max(0, 3362 - Math.max(0, taxable - 24813) * 0.0631);
  const arbeidsKorting = taxable > 0 ? Math.min(5532, taxable * 0.30) : 0;
  const net = Math.max(0, tax - algemeneKorting - arbeidsKorting);
  return { tax: net, effectiveRate: taxable > 0 ? (net / taxable) * 100 : 0 };
}

interface ModuleCardProps {
  title: string;
  description: string;
  amount: number;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  tone?: "deduction" | "income" | "neutral";
}

function ModuleCard({ title, description, amount, icon, href, badge, tone = "neutral" }: ModuleCardProps) {
  const amountClass =
    tone === "deduction" ? "text-emerald-500"
    : tone === "income" ? "text-foreground"
    : "text-foreground";
  const prefix = tone === "deduction" && amount > 0 ? "−" : "";
  return (
    <Link to={href} className="block group">
      <Card className="arcory-glass h-full transition-all hover:border-primary/40 hover:shadow-md">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                {icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{title}</p>
                  {badge && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{badge}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
                <p className={`text-lg font-semibold tabular-nums mt-2 ${amountClass}`}>
                  {prefix}{fmt(amount)}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function FlowStep({
  label, amount, icon, tone, sublabel,
}: { label: string; amount: number; icon: React.ReactNode; tone: "income" | "deduction" | "tax" | "net"; sublabel?: string }) {
  const colorMap = {
    income: "bg-primary/10 text-primary border-primary/20",
    deduction: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    tax: "bg-destructive/10 text-destructive border-destructive/20",
    net: "bg-primary/15 text-primary border-primary/30",
  };
  return (
    <div className={`flex-1 min-w-[140px] rounded-xl border p-3 ${colorMap[tone]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-lg font-semibold tabular-nums text-foreground">{fmt(amount)}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>}
    </div>
  );
}

export default function SalaryOverview() {
  const [year, setYear] = useState(currentYear);
  const { profit, totalDeductions: taxDeductionTotal, taxableProfit } = useTaxDeductions(year);
  const { annualTotal: expensesTotal } = useBusinessExpenses(year);
  const { totalForYear: depreciationTotalFn } = useDepreciations();
  const depreciationTotal = depreciationTotalFn(year);
  const { annualTotal: premiumsTotal } = useDeductiblePremiums(year);
  const { totalBijtelling, totalCarCosts } = useCompanyCar(year);
  const { netDeduction: mortgageDeduction } = useMortgageDeduction(year);

  const totalAllDeductions = taxDeductionTotal + premiumsTotal + mortgageDeduction;
  const { tax, effectiveRate } = useMemo(() => estimateIB(taxableProfit), [taxableProfit]);
  const netAnnual = Math.max(0, taxableProfit - tax);
  const netMonthly = netAnnual / 12;
  const deductionRatio = profit > 0 ? Math.min(100, (totalAllDeductions / profit) * 100) : 0;

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={cardVariant} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Salarisoverzicht</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Van bruto winst naar netto in één oogopslag — inclusief alle aftrekposten en IB-schatting.
          </p>
        </div>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </motion.div>

      {/* Hero: Netto inkomen */}
      <motion.div variants={cardVariant}>
        <Card className="arcory-glass relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5 pointer-events-none" />
          <CardContent className="pt-6 pb-6 relative">
            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] items-center">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Geschat netto-inkomen {year}</p>
                <div className="flex items-baseline gap-3 mt-2 flex-wrap">
                  <p className="text-4xl sm:text-5xl font-bold tabular-nums text-foreground">{fmt(netAnnual)}</p>
                  <p className="text-base text-muted-foreground tabular-nums">/ {fmt(netMonthly)} per maand</p>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                    Effectief tarief {effectiveRate.toFixed(1)}%
                  </Badge>
                  <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
                    {fmt(totalAllDeductions)} bespaard via aftrek
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Aftrek-ratio</span>
                    <span className="tabular-nums font-medium">{deductionRatio.toFixed(1)}% van bruto</span>
                  </div>
                  <Progress value={deductionRatio} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bruto</p>
                    <p className="text-base font-semibold tabular-nums">{fmt(profit)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">IB & premies</p>
                    <p className="text-base font-semibold tabular-nums text-destructive">{fmt(tax)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Flow visualisatie */}
      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              Inkomensflow
            </CardTitle>
            <CardDescription className="text-xs">Van omzet naar netto in vier stappen.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <FlowStep label="Bruto winst" amount={profit} icon={<TrendingUp className="h-3.5 w-3.5" />} tone="income" />
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <FlowStep label="Totale aftrek" amount={totalAllDeductions} icon={<TrendingDown className="h-3.5 w-3.5" />} tone="deduction" sublabel="Aftrekposten + premies" />
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <FlowStep label="IB & premies" amount={tax} icon={<Receipt className="h-3.5 w-3.5" />} tone="tax" sublabel={`${effectiveRate.toFixed(1)}% effectief`} />
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <FlowStep label="Netto" amount={netAnnual} icon={<PiggyBank className="h-3.5 w-3.5" />} tone="net" sublabel={`${fmt(netMonthly)}/mnd`} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modules in tabs: Zakelijk / Privé / Alles */}
      <motion.div variants={cardVariant}>
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-medium text-foreground">Modules</h2>
            <TabsList>
              <TabsTrigger value="all">Alles</TabsTrigger>
              <TabsTrigger value="business" className="gap-1.5"><Briefcase className="h-3 w-3" />Zakelijk</TabsTrigger>
              <TabsTrigger value="private" className="gap-1.5"><User className="h-3 w-3" />Privé</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ModuleCard tone="deduction" title="Bedrijfskosten" description="Terugkerende en eenmalige zakelijke kosten" amount={expensesTotal} icon={<Package className="h-5 w-5 text-primary" />} href="/salaris/bedrijfskosten" />
              <ModuleCard tone="deduction" title="Afschrijvingen" description="Investeringen automatisch afgeschreven" amount={depreciationTotal} icon={<Calculator className="h-5 w-5 text-primary" />} href="/salaris/afschrijvingen" />
              <ModuleCard tone="deduction" title="Ondernemersaftrek" description="Zelfstandigenaftrek, MKB-vrijstelling" amount={taxDeductionTotal} icon={<TrendingDown className="h-5 w-5 text-primary" />} href="/belasting/ondernemersaftrek" />
              <ModuleCard tone="deduction" title="Aftrekbare premies" description="AOV en lijfrentepremies" amount={premiumsTotal} icon={<Shield className="h-5 w-5 text-primary" />} href="/salaris/premies" />
              <ModuleCard title="Auto van de zaak" description="Bijtelling en autokosten" amount={totalBijtelling + totalCarCosts} icon={<Car className="h-5 w-5 text-primary" />} href="/salaris/auto" />
              <ModuleCard tone="deduction" title="Koopwoning" description="Hypotheekrenteaftrek en erfpacht" amount={mortgageDeduction} icon={<Home className="h-5 w-5 text-primary" />} href="/salaris/woning" badge="Privé" />
              <ModuleCard title="Kilometerregistratie" description="Zakelijke ritten met €0,23/km" amount={0} icon={<MapPin className="h-5 w-5 text-primary" />} href="/salaris/kilometers" />
              <ModuleCard title="Toeslagen-check" description="Zorg, huur, kinderopvang & KGB" amount={0} icon={<HandCoins className="h-5 w-5 text-primary" />} href="/salaris/toeslagen" badge="Privé" />
            </motion.div>
          </TabsContent>

          <TabsContent value="business" className="mt-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ModuleCard tone="deduction" title="Bedrijfskosten" description="Terugkerende en eenmalige zakelijke kosten" amount={expensesTotal} icon={<Package className="h-5 w-5 text-primary" />} href="/salaris/bedrijfskosten" />
              <ModuleCard tone="deduction" title="Afschrijvingen" description="Investeringen automatisch afgeschreven" amount={depreciationTotal} icon={<Calculator className="h-5 w-5 text-primary" />} href="/salaris/afschrijvingen" />
              <ModuleCard tone="deduction" title="Ondernemersaftrek" description="Zelfstandigenaftrek, MKB-vrijstelling" amount={taxDeductionTotal} icon={<TrendingDown className="h-5 w-5 text-primary" />} href="/belasting/ondernemersaftrek" />
              <ModuleCard tone="deduction" title="Aftrekbare premies" description="AOV en lijfrentepremies" amount={premiumsTotal} icon={<Shield className="h-5 w-5 text-primary" />} href="/salaris/premies" />
              <ModuleCard title="Auto van de zaak" description="Bijtelling en autokosten" amount={totalBijtelling + totalCarCosts} icon={<Car className="h-5 w-5 text-primary" />} href="/salaris/auto" />
              <ModuleCard title="Kilometerregistratie" description="Zakelijke ritten met €0,23/km" amount={0} icon={<MapPin className="h-5 w-5 text-primary" />} href="/salaris/kilometers" />
            </div>
          </TabsContent>

          <TabsContent value="private" className="mt-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ModuleCard tone="deduction" title="Koopwoning" description="Hypotheekrenteaftrek en erfpacht" amount={mortgageDeduction} icon={<Home className="h-5 w-5 text-primary" />} href="/salaris/woning" badge="Privé" />
              <ModuleCard title="Toeslagen-check" description="Zorg, huur, kinderopvang & KGB" amount={0} icon={<HandCoins className="h-5 w-5 text-primary" />} href="/salaris/toeslagen" badge="Privé" />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Berekening detail */}
      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Berekening {year}</CardTitle>
            <CardDescription className="text-xs">
              Volledige opbouw van bruto winst naar netto inkomen. IB-schatting is indicatief.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Brutowinst</span>
                <span className="tabular-nums font-medium">{fmt(profit)}</span>
              </div>
              {expensesTotal > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>− Bedrijfskosten</span><span className="tabular-nums">{fmt(expensesTotal)}</span>
                </div>
              )}
              {depreciationTotal > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>− Afschrijvingen</span><span className="tabular-nums">{fmt(depreciationTotal)}</span>
                </div>
              )}
              {taxDeductionTotal > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>− Ondernemersaftrek</span><span className="tabular-nums">{fmt(taxDeductionTotal)}</span>
                </div>
              )}
              {premiumsTotal > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>− Aftrekbare premies</span><span className="tabular-nums">{fmt(premiumsTotal)}</span>
                </div>
              )}
              {totalBijtelling > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>+ Bijtelling auto</span><span className="tabular-nums">{fmt(totalBijtelling)}</span>
                </div>
              )}
              {mortgageDeduction > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>− Hypotheekrenteaftrek</span><span className="tabular-nums">{fmt(mortgageDeduction)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Belastbare winst</span>
                <span className="tabular-nums">{fmt(taxableProfit)}</span>
              </div>
              <div className="flex justify-between text-destructive">
                <span>− Inkomstenbelasting (schatting)</span>
                <span className="tabular-nums">{fmt(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base text-primary">
                <span>Netto inkomen</span>
                <span className="tabular-nums">{fmt(netAnnual)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground pt-2">
                * IB-schatting o.b.v. box 1 schijven incl. algemene heffingskorting en arbeidskorting (indicatief).
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
