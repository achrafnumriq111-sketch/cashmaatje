import { useMemo, useState } from "react";
import { useClientIntelligence, type ClientInsight } from "@/hooks/useClientIntelligence";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrendingUp, AlertTriangle, Clock, Users, Search, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

const riskColor: Record<ClientInsight["risk_score"], string> = {
  low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  high: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};
const riskLabel: Record<ClientInsight["risk_score"], string> = {
  low: "Laag", medium: "Aandacht", high: "Risico",
};

interface Props {
  onSelectContact?: (id: string) => void;
}

export function ClientIntelligencePanel({ onSelectContact }: Props) {
  const { data: insights = [], isLoading } = useClientIntelligence();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "customers" | "suppliers" | "risk">("all");

  const filtered = useMemo(() => {
    let list = insights;
    if (filter === "customers") list = list.filter((i) => i.is_customer);
    if (filter === "suppliers") list = list.filter((i) => i.is_supplier);
    if (filter === "risk") list = list.filter((i) => i.risk_score !== "low");
    if (search) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [insights, filter, search]);

  const stats = useMemo(() => {
    const customers = insights.filter((i) => i.is_customer);
    const totalOverdue = customers.reduce((s, i) => s + i.overdue_amount, 0);
    const atRisk = customers.filter((i) => i.risk_score !== "low").length;
    const top = customers[0];
    const avgPay = customers.filter((i) => i.avg_days_to_pay != null);
    const avgDays = avgPay.length
      ? Math.round(avgPay.reduce((s, i) => s + (i.avg_days_to_pay ?? 0), 0) / avgPay.length)
      : null;
    return { totalOverdue, atRisk, top, avgDays, count: customers.length };
  }, [insights]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Users className="h-3.5 w-3.5" /> Actieve klanten
          </div>
          <div className="text-2xl font-semibold tracking-tight">{stats.count}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingUp className="h-3.5 w-3.5" /> Top klant
          </div>
          <div className="text-sm font-medium truncate">{stats.top?.name ?? "—"}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{stats.top ? fmt(stats.top.total_revenue) : "—"}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Clock className="h-3.5 w-3.5" /> Gem. betaaltermijn
          </div>
          <div className="text-2xl font-semibold tracking-tight">
            {stats.avgDays != null ? `${stats.avgDays}d` : "—"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Te laat
          </div>
          <div className="text-2xl font-semibold tracking-tight text-red-600 dark:text-red-400">
            {fmt(stats.totalOverdue)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{stats.atRisk} klant(en) aandacht</div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek relatie…"
            className="pl-8 h-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(["all", "customers", "suppliers", "risk"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-secondary"
              }`}
            >
              {f === "all" ? "Alle" : f === "customers" ? "Klanten" : f === "suppliers" ? "Leveranciers" : "Aandacht"}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30 border-b border-border">
              <tr className="text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-medium">Relatie</th>
                <th className="text-right px-3 py-2.5 font-medium">Omzet</th>
                <th className="text-right px-3 py-2.5 font-medium hidden md:table-cell">Aandeel</th>
                <th className="text-right px-3 py-2.5 font-medium">Openstaand</th>
                <th className="text-right px-3 py-2.5 font-medium hidden sm:table-cell">Gem. betaal</th>
                <th className="text-center px-3 py-2.5 font-medium">Risico</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                    Geen relaties met activiteit gevonden
                  </td>
                </tr>
              ) : (
                filtered.map((i) => (
                  <tr
                    key={i.contact_id}
                    onClick={() => onSelectContact?.(i.contact_id)}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{i.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {i.invoice_count} factu(u)r{i.invoice_count === 1 ? "" : "en"}
                        {i.last_activity && ` · ${new Date(i.last_activity).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })}`}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmt(i.total_revenue)}</td>
                    <td className="px-3 py-3 text-right tabular-nums hidden md:table-cell text-muted-foreground">
                      {(i.revenue_share * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {i.open_amount > 0 ? (
                        <span className={i.overdue_amount > 0 ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                          {fmt(i.open_amount)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums hidden sm:table-cell text-muted-foreground">
                      {i.avg_days_to_pay != null ? `${i.avg_days_to_pay}d` : "—"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant="outline" className={`text-[10px] ${riskColor[i.risk_score]}`}>
                        {riskLabel[i.risk_score]}
                      </Badge>
                    </td>
                    <td className="pr-3">
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
