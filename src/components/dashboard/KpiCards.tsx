import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Wallet, Receipt, Flame, BarChart3 } from "lucide-react";
import { useVatEngine } from "@/hooks/useVatEngine";

function fmt(n: number | null | undefined) {
  if (n == null) return "€ 0";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

interface KpiData {
  cashBalance?: number;
  monthlyRevenue?: number;
  monthlyBurn?: number;
  netProfit?: number;
  grossMargin?: number;
  cashRunwayMonths?: number | null;
  isLoading: boolean;
}

export function KpiCards({ cashBalance, monthlyRevenue, monthlyBurn, netProfit, grossMargin, cashRunwayMonths, isLoading }: KpiData) {
  const { data: vat, isLoading: vatLoading } = useVatEngine();
  const loading = isLoading || vatLoading;

  const cards = [
    {
      label: "Cash positie",
      value: fmt(cashBalance),
      icon: Wallet,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      subtitle: cashRunwayMonths != null
        ? `${cashRunwayMonths.toFixed(1)} maanden runway`
        : "Geen burn rate data",
      urgent: cashRunwayMonths != null && cashRunwayMonths < 3,
    },
    {
      label: "Omzet / maand",
      value: fmt(monthlyRevenue),
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      subtitle: `Marge: ${(grossMargin ?? 0).toFixed(0)}%`,
    },
    {
      label: "Kosten / maand",
      value: fmt(monthlyBurn),
      icon: Flame,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      subtitle: `Netto: ${fmt(netProfit)}/mnd`,
    },
    {
      label: "BTW schuld",
      value: fmt(vat?.netVat ?? 0),
      icon: Receipt,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      subtitle: vat ? `${fmt(vat.vatOwed)} af · ${fmt(vat.vatReclaimable)} terug` : "Laden...",
      liveIndicator: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className={`border-border/50 bg-card ${c.urgent ? "ring-1 ring-red-500/50" : ""}`}>
          <CardContent className="p-5">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-32" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.label}</span>
                    {c.liveIndicator && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    )}
                  </div>
                  <div className={`p-1.5 rounded-lg ${c.bg}`}>
                    <c.icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-semibold tracking-tight text-foreground">{c.value}</div>
                <div className="mt-1">
                  <span className={`text-xs ${c.urgent ? "text-red-400 font-medium" : "text-muted-foreground"}`}>
                    {c.subtitle}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
