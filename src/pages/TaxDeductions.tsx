import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, TrendingDown, Calculator, Info, Percent } from "lucide-react";
import { useTaxDeductions } from "@/hooks/useTaxDeductions";
import { YearlyOverviewChart } from "@/components/tax/YearlyOverviewChart";
import { toast } from "sonner";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

interface DeductionRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  amount?: number;
  onAmountChange?: (v: number) => void;
  isPercentage?: boolean;
  percentage?: number;
  onPercentageChange?: (v: number) => void;
  calculatedAmount?: number;
  badge?: string;
}

function DeductionRow({ label, description, enabled, onToggle, amount, onAmountChange, isPercentage, percentage, onPercentageChange, calculatedAmount, badge }: DeductionRowProps) {
  return (
    <div className={`rounded-lg border p-4 transition-colors ${enabled ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{label}</span>
            {badge && (
              <Badge variant="outline" className="text-xs border-muted-foreground/30">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {enabled && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {onAmountChange != null && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Bedrag</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                <Input
                  type="number"
                  value={amount ?? 0}
                  onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
                  className="w-28 pl-7 h-8 text-sm"
                />
              </div>
            </div>
          )}
          {isPercentage && onPercentageChange && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Percentage</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  value={percentage ?? 0}
                  onChange={(e) => onPercentageChange(parseFloat(e.target.value) || 0)}
                  className="w-24 pr-7 h-8 text-sm"
                />
                <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          )}
          {calculatedAmount != null && (
            <Badge variant="secondary" className="text-xs">
              Aftrek: {fmt(calculatedAmount)}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export default function TaxDeductions() {
  const [year, setYear] = useState(currentYear);
  const {
    deduction,
    setDeduction,
    profit,
    totalDeductions,
    taxableProfit,
    taxBurdenPct,
    monthlyData,
    avgMonthlyNet,
    loading,
    saving,
    save,
  } = useTaxDeductions(year);

  const update = <K extends keyof typeof deduction>(key: K, value: (typeof deduction)[K]) => {
    setDeduction((d) => ({ ...d, [key]: value }));
  };

  const handleSave = async () => {
    await save(deduction);
    toast.success("Aftrekposten opgeslagen");
  };

  // Calculate individual amounts for display
  const forAmount = deduction.for_enabled
    ? Math.min(
        Math.max(0, profit - (deduction.zelfstandigenaftrek_enabled ? deduction.zelfstandigenaftrek_amount : 0) - (deduction.startersaftrek_enabled ? deduction.startersaftrek_amount : 0) - (deduction.meewerkaftrek_enabled ? deduction.meewerkaftrek_amount : 0) - (deduction.stakingsaftrek_enabled ? deduction.stakingsaftrek_amount : 0)) * (deduction.for_percentage / 100),
        deduction.for_max_amount
      )
    : 0;

  const mkbBase = Math.max(0, profit - totalDeductions + (deduction.mkb_winstvrijstelling_enabled ? taxableProfit * (deduction.mkb_winstvrijstelling_percentage / 100) / (1 - deduction.mkb_winstvrijstelling_percentage / 100) : 0));
  const mkbAmount = deduction.mkb_winstvrijstelling_enabled
    ? (profit - (deduction.zelfstandigenaftrek_enabled ? deduction.zelfstandigenaftrek_amount : 0) - (deduction.startersaftrek_enabled ? deduction.startersaftrek_amount : 0) - (deduction.meewerkaftrek_enabled ? deduction.meewerkaftrek_amount : 0) - (deduction.stakingsaftrek_enabled ? deduction.stakingsaftrek_amount : 0) - forAmount) * (deduction.mkb_winstvrijstelling_percentage / 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ondernemersaftrek</h1>
          <p className="text-sm text-muted-foreground mt-1">Stel aftrekposten in per belastingjaar en zie het effect op je belastbare winst.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Opslaan..." : "Opslaan"}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Winst {year}</span>
                </div>
                <div className="text-2xl font-semibold tabular-nums text-foreground">{fmt(profit)}</div>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Totale aftrek</span>
                </div>
                <div className="text-2xl font-semibold tabular-nums text-primary">{fmt(totalDeductions)}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Belastbare winst</span>
                </div>
                <div className="text-2xl font-semibold tabular-nums text-foreground">{fmt(taxableProfit)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Deduction Toggles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Aftrekposten {year}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DeductionRow
                label="Zelfstandigenaftrek"
                description="Vaste aftrek voor ondernemers die voldoen aan het urencriterium (1.225 uur per jaar)."
                enabled={deduction.zelfstandigenaftrek_enabled}
                onToggle={(v) => update("zelfstandigenaftrek_enabled", v)}
                amount={deduction.zelfstandigenaftrek_amount}
                onAmountChange={(v) => update("zelfstandigenaftrek_amount", v)}
                badge="Urencriterium"
              />

              <DeductionRow
                label="Startersaftrek"
                description="Extra aftrek voor starters — max. 3x in de eerste 5 jaar na start."
                enabled={deduction.startersaftrek_enabled}
                onToggle={(v) => update("startersaftrek_enabled", v)}
                amount={deduction.startersaftrek_amount}
                onAmountChange={(v) => update("startersaftrek_amount", v)}
                badge="Starter"
              />

              <Separator />

              <DeductionRow
                label="MKB-winstvrijstelling"
                description="Percentage vrijstelling over de winst na ondernemersaftrek."
                enabled={deduction.mkb_winstvrijstelling_enabled}
                onToggle={(v) => update("mkb_winstvrijstelling_enabled", v)}
                isPercentage
                percentage={deduction.mkb_winstvrijstelling_percentage}
                onPercentageChange={(v) => update("mkb_winstvrijstelling_percentage", v)}
                calculatedAmount={Math.max(0, mkbAmount)}
              />

              <Separator />

              <DeductionRow
                label="Fiscale Oudedagsreserve (FOR)"
                description={`Max. ${deduction.for_percentage}% van de winst, tot € ${deduction.for_max_amount.toLocaleString("nl-NL")}.`}
                enabled={deduction.for_enabled}
                onToggle={(v) => update("for_enabled", v)}
                isPercentage
                percentage={deduction.for_percentage}
                onPercentageChange={(v) => update("for_percentage", v)}
                amount={deduction.for_max_amount}
                onAmountChange={(v) => update("for_max_amount", v)}
                calculatedAmount={forAmount}
                badge="Pensioen"
              />

              <DeductionRow
                label="Meewerkaftrek"
                description="Aftrek als je partner minimaal 525 uur meewerkt in de onderneming."
                enabled={deduction.meewerkaftrek_enabled}
                onToggle={(v) => update("meewerkaftrek_enabled", v)}
                amount={deduction.meewerkaftrek_amount}
                onAmountChange={(v) => update("meewerkaftrek_amount", v)}
              />

              <DeductionRow
                label="Stakingsaftrek"
                description="Eenmalige aftrek bij het staken van je onderneming."
                enabled={deduction.stakingsaftrek_enabled}
                onToggle={(v) => update("stakingsaftrek_enabled", v)}
                amount={deduction.stakingsaftrek_amount}
                onAmountChange={(v) => update("stakingsaftrek_amount", v)}
              />
            </CardContent>
          </Card>

          {/* Visual breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Berekening overzicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Winst vóór aftrek</span>
                  <span className="tabular-nums font-medium text-foreground">{fmt(profit)}</span>
                </div>
                {deduction.zelfstandigenaftrek_enabled && (
                  <div className="flex justify-between text-primary">
                    <span>− Zelfstandigenaftrek</span>
                    <span className="tabular-nums">{fmt(deduction.zelfstandigenaftrek_amount)}</span>
                  </div>
                )}
                {deduction.startersaftrek_enabled && (
                  <div className="flex justify-between text-primary">
                    <span>− Startersaftrek</span>
                    <span className="tabular-nums">{fmt(deduction.startersaftrek_amount)}</span>
                  </div>
                )}
                {deduction.meewerkaftrek_enabled && deduction.meewerkaftrek_amount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>− Meewerkaftrek</span>
                    <span className="tabular-nums">{fmt(deduction.meewerkaftrek_amount)}</span>
                  </div>
                )}
                {deduction.stakingsaftrek_enabled && (
                  <div className="flex justify-between text-primary">
                    <span>− Stakingsaftrek</span>
                    <span className="tabular-nums">{fmt(deduction.stakingsaftrek_amount)}</span>
                  </div>
                )}
                {deduction.for_enabled && forAmount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>− FOR ({deduction.for_percentage}%)</span>
                    <span className="tabular-nums">{fmt(forAmount)}</span>
                  </div>
                )}
                {deduction.mkb_winstvrijstelling_enabled && mkbAmount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>− MKB-winstvrijstelling ({deduction.mkb_winstvrijstelling_percentage}%)</span>
                    <span className="tabular-nums">{fmt(Math.max(0, mkbAmount))}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span className="text-foreground">Belastbare winst</span>
                  <span className="tabular-nums text-foreground">{fmt(taxableProfit)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
