import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { cardVariant } from "@/lib/animations";

interface JournalLine {
  credit_amount: number | null;
  debit_amount: number | null;
  journal_entries: { date: string; organization_id: string; status: string } | null;
}

const chartConfig = {
  revenue: { label: "Omzet", color: "hsl(160 84% 39%)" },
  expenses: { label: "Kosten", color: "hsl(0 84% 60%)" },
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

  return (
    <motion.div variants={cardVariant} className="arcory-glass rounded-2xl p-5 sm:p-6 h-full">
      <div className="mb-4">
        <span className="text-micro text-muted-foreground">Omzet & Kosten (12 maanden)</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-[260px] w-full rounded-xl" />
      ) : (
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0 84% 60%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(160 84% 39%)" fill="url(#fillRevenue)" strokeWidth={2} />
            <Area type="monotone" dataKey="expenses" stroke="hsl(0 84% 60%)" fill="url(#fillExpenses)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      )}
    </motion.div>
  );
}
