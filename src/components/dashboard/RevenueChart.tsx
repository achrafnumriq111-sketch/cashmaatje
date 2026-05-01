import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useMemo } from "react";

interface JournalLine {
  credit_amount: number | null;
  debit_amount: number | null;
  journal_entries: { date: string; organization_id: string; status: string } | null;
}

const chartConfig = {
  revenue: { label: "Omzet", color: "hsl(var(--primary))" },
  expenses: { label: "Kosten", color: "hsl(220 9% 46%)" },
};

export function RevenueChart({ data, isLoading }: { data?: JournalLine[] | null; isLoading: boolean }) {
  const chartData = useMemo(() => {
    if (!data) return [];
    const months: Record<string, { revenue: number; expenses: number }> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { revenue: 0, expenses: 0 };
    }
    data.forEach((line) => {
      const entry = line.journal_entries as unknown as { date: string } | null;
      if (!entry?.date) return;
      const key = entry.date.slice(0, 7);
      if (months[key]) {
        months[key].revenue += line.credit_amount ?? 0;
        months[key].expenses += line.debit_amount ?? 0;
      }
    });
    return Object.entries(months).map(([month, vals]) => ({
      month: new Date(month + "-01").toLocaleDateString("nl-NL", { month: "short" }),
      ...vals,
    }));
  }, [data]);

  const total = chartData.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="rounded-2xl bg-card border border-border p-6 h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-muted-foreground">
            Omzet & kosten
          </p>
          <p className="text-[24px] font-semibold tracking-[-0.02em] text-foreground mt-1.5">
            {new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(total)}
          </p>
          <p className="text-[12px] text-muted-foreground mt-0.5">Laatste 12 maanden</p>
        </div>
        <div className="flex items-center gap-4 text-[12px]">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary" /> Omzet
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-foreground/30" /> Kosten
          </span>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[260px] w-full rounded-xl" />
      ) : (
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
              width={48}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              fill="transparent"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#fillRevenue)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(var(--primary))" }}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}
