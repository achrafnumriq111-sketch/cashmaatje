import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { 
  TrendingUp, TrendingDown, Calculator, Package, Car, Home, Shield, 
  ChevronRight, Wallet 
} from "lucide-react";
import { useTaxDeductions } from "@/hooks/useTaxDeductions";
import { useBusinessExpenses } from "@/hooks/useBusinessExpenses";
import { useDepreciations } from "@/hooks/useDepreciations";
import { useDeductiblePremiums } from "@/hooks/useDeductiblePremiums";
import { useCompanyCar } from "@/hooks/useCompanyCar";
import { useMortgageDeduction } from "@/hooks/useMortgageDeduction";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

interface ModuleCardProps {
  title: string;
  description: string;
  amount: number;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

function ModuleCard({ title, description, amount, icon, href, badge }: ModuleCardProps) {
  return (
    <Link to={href} className="block group">
      <Card className="transition-colors hover:border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{title}</p>
                  {badge && <Badge variant="outline" className="text-xs">{badge}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                <p className="text-lg font-semibold tabular-nums mt-2">{fmt(amount)}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Salarisoverzicht</h1>
          <p className="text-sm text-muted-foreground mt-1">Compleet overzicht van alle inkomensgegevens en aftrekposten.</p>
        </div>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Top KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Brutowinst</p>
                <p className="text-xl font-semibold tabular-nums">{fmt(profit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Totale aftrek</p>
                <p className="text-xl font-semibold tabular-nums">{fmt(totalAllDeductions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Belastbare winst</p>
                <p className="text-xl font-semibold tabular-nums">{fmt(taxableProfit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Netto/maand (schatting)</p>
                <p className="text-xl font-semibold tabular-nums">{fmt(Math.max(0, taxableProfit) / 12)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module cards */}
      <div>
        <h2 className="text-lg font-medium text-foreground mb-4">Modules</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleCard
            title="Bedrijfskosten"
            description="Terugkerende en eenmalige zakelijke kosten"
            amount={expensesTotal}
            icon={<Package className="h-5 w-5 text-primary" />}
            href="/salaris/bedrijfskosten"
          />
          <ModuleCard
            title="Afschrijvingen"
            description="Investeringen automatisch afgeschreven"
            amount={depreciationTotal}
            icon={<Calculator className="h-5 w-5 text-primary" />}
            href="/salaris/afschrijvingen"
          />
          <ModuleCard
            title="Ondernemersaftrek"
            description="Zelfstandigenaftrek, MKB-vrijstelling etc."
            amount={taxDeductionTotal}
            icon={<TrendingDown className="h-5 w-5 text-primary" />}
            href="/belasting/ondernemersaftrek"
          />
          <ModuleCard
            title="Aftrekbare premies"
            description="AOV en lijfrentepremies"
            amount={premiumsTotal}
            icon={<Shield className="h-5 w-5 text-primary" />}
            href="/salaris/premies"
          />
          <ModuleCard
            title="Auto van de zaak"
            description="Bijtelling en autokosten"
            amount={totalBijtelling + totalCarCosts}
            icon={<Car className="h-5 w-5 text-primary" />}
            href="/salaris/auto"
          />
          <ModuleCard
            title="Koopwoning"
            description="Hypotheekrenteaftrek en erfpacht"
            amount={mortgageDeduction}
            icon={<Home className="h-5 w-5 text-primary" />}
            href="/salaris/woning"
          />
        </div>
      </div>

      {/* Summary breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Berekening {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Brutowinst</span>
              <span className="tabular-nums font-medium">{fmt(profit)}</span>
            </div>
            {expensesTotal > 0 && (
              <div className="flex justify-between text-primary">
                <span>− Bedrijfskosten</span>
                <span className="tabular-nums">{fmt(expensesTotal)}</span>
              </div>
            )}
            {depreciationTotal > 0 && (
              <div className="flex justify-between text-primary">
                <span>− Afschrijvingen</span>
                <span className="tabular-nums">{fmt(depreciationTotal)}</span>
              </div>
            )}
            {taxDeductionTotal > 0 && (
              <div className="flex justify-between text-primary">
                <span>− Ondernemersaftrek</span>
                <span className="tabular-nums">{fmt(taxDeductionTotal)}</span>
              </div>
            )}
            {premiumsTotal > 0 && (
              <div className="flex justify-between text-primary">
                <span>− Aftrekbare premies</span>
                <span className="tabular-nums">{fmt(premiumsTotal)}</span>
              </div>
            )}
            {totalBijtelling > 0 && (
              <div className="flex justify-between text-destructive">
                <span>+ Bijtelling auto</span>
                <span className="tabular-nums">{fmt(totalBijtelling)}</span>
              </div>
            )}
            {mortgageDeduction > 0 && (
              <div className="flex justify-between text-primary">
                <span>− Hypotheekrenteaftrek</span>
                <span className="tabular-nums">{fmt(mortgageDeduction)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Belastbare winst</span>
              <span className="tabular-nums">{fmt(taxableProfit)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
