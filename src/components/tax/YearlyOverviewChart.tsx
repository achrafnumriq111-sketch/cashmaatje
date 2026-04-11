import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Wallet, Percent as PercentIcon, Calendar } from "lucide-react";
import type { MonthlyProfitData } from "@/hooks/useTaxDeductions";

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

interface Props {
  year: number;
  monthlyData: MonthlyProfitData[];
  totalProfit: number;
  taxableProfit: number;
  totalDeductions: number;
  taxBurdenPct: number;
  avgMonthlyNet: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums text-foreground">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function YearlyOverviewChart({ year, monthlyData, totalProfit, taxableProfit, totalDeductions, taxBurdenPct, avgMonthlyNet }: Props) {
  const hasData = monthlyData.some((m) => m.revenue > 0 || m.expenses > 0);

  const kpis = [
    {
      label: "Brutowinst",
      value: fmt(totalProfit),
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Gem. netto/maand",
      value: fmt(avgMonthlyNet),
      icon: Wallet,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Belastingdruk",
      value: `${taxBurdenPct.toFixed(1)}%`,
      icon: PercentIcon,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      subtitle: `${fmt(totalDeductions)} aftrek`,
    },
    {
      label: "Belastbare winst",
      value: fmt(taxableProfit),
      icon: Calendar,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{k.label}</span>
                <div className={`p-1 rounded-md ${k.bg}`}>
                  <k.icon className={`h-3.5 w-3.5 ${k.color}`} />
                </div>
              </div>
              <div className="text-lg font-semibold tabular-nums text-foreground">{k.value}</div>
              {k.subtitle && <span className="text-[10px] text-muted-foreground">{k.subtitle}</span>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Jaaroverzicht {year}</CardTitle>
            <Badge variant="outline" className="text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Bruto
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-400" /> Netto
                </span>
              </div>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
              Geen data beschikbaar voor {year}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="grossProfit"
                  name="Brutowinst"
                  stroke="#34d399"
                  fill="url(#grossGrad)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="netProfit"
                  name="Nettowinst"
                  stroke="#60a5fa"
                  fill="url(#netGrad)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
