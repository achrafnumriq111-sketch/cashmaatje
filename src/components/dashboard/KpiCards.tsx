import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Wallet, Receipt, Flame } from "lucide-react";
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

export function KpiCards({
  cashBalance, monthlyRevenue, monthlyBurn, netProfit, grossMargin, cashRunwayMonths, isLoading,
}: KpiData) {
  const { data: vat, isLoading: vatLoading } = useVatEngine();
  const loading = isLoading || vatLoading;

  const cards = [
    {
      label: "Cash positie",
      value: fmt(cashBalance),
      icon: Wallet,
      subtitle: cashRunwayMonths != null ? `${cashRunwayMonths.toFixed(1)} mnd runway` : "Geen burn data",
      urgent: cashRunwayMonths != null && cashRunwayMonths < 3,
      accent: true,
    },
    {
      label: "Omzet / maand",
      value: fmt(monthlyRevenue),
      icon: TrendingUp,
      subtitle: `Marge ${(grossMargin ?? 0).toFixed(0)}%`,
    },
    {
      label: "Kosten / maand",
      value: fmt(monthlyBurn),
      icon: Flame,
      subtitle: `Netto ${fmt(netProfit)}/mnd`,
    },
    {
      label: "BTW gereserveerd",
      value: fmt(vat?.netVat ?? 0),
      icon: Receipt,
      subtitle: vat ? `${fmt(vat.vatOwed)} af · ${fmt(vat.vatReclaimable)} terug` : "Laden…",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className={`
              relative rounded-2xl bg-card border border-border p-6
              transition-all duration-200
              hover:border-foreground/10 hover:shadow-[0_8px_24px_-12px_rgba(17,17,17,0.08)]
              ${c.urgent ? "ring-1 ring-destructive/30" : ""}
            `}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-muted-foreground">
                {c.label}
              </span>
              <div className="w-7 h-7 rounded-lg bg-secondary/70 grid place-items-center text-muted-foreground/70">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <p
                className={`text-[26px] font-semibold tracking-[-0.02em] leading-none ${
                  c.accent ? "text-primary" : "text-foreground"
                }`}
              >
                {c.value}
              </p>
            )}

            <p className={`mt-3 text-[12.5px] ${c.urgent ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              {c.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
