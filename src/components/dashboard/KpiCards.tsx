import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Wallet, Receipt, Flame } from "lucide-react";
import { useVatEngine } from "@/hooks/useVatEngine";
import { cardVariant, staggerContainer } from "@/lib/animations";

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
      icon: <Wallet className="w-4 h-4" />,
      iconColor: "text-emerald-400/60",
      subtitle: cashRunwayMonths != null
        ? `${cashRunwayMonths.toFixed(1)} maanden runway`
        : "Geen burn rate data",
      urgent: cashRunwayMonths != null && cashRunwayMonths < 3,
    },
    {
      label: "Omzet / maand",
      value: fmt(monthlyRevenue),
      icon: <TrendingUp className="w-4 h-4" />,
      iconColor: "text-blue-400/60",
      subtitle: `Marge: ${(grossMargin ?? 0).toFixed(0)}%`,
    },
    {
      label: "Kosten / maand",
      value: fmt(monthlyBurn),
      icon: <Flame className="w-4 h-4" />,
      iconColor: "text-orange-400/60",
      subtitle: `Netto: ${fmt(netProfit)}/mnd`,
    },
    {
      label: "BTW schuld",
      value: fmt(vat?.netVat ?? 0),
      icon: <Receipt className="w-4 h-4" />,
      iconColor: "text-purple-400/60",
      subtitle: vat ? `${fmt(vat.vatOwed)} af · ${fmt(vat.vatReclaimable)} terug` : "Laden...",
      liveIndicator: true,
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          variants={cardVariant}
          className={`
            relative overflow-hidden rounded-2xl
            arcory-glass
            p-5 sm:p-6 group
            ${c.urgent ? "ring-1 ring-red-500/50" : ""}
          `}
        >
          {/* Hover glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

          <div className="relative z-10">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-micro text-muted-foreground">{c.label}</span>
                    {c.liveIndicator && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    )}
                  </div>
                  <div className={`w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center ${c.iconColor}`}>
                    {c.icon}
                  </div>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.08 + 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-foreground leading-none"
                >
                  {c.value}
                </motion.p>

                <div className="mt-3">
                  <span className={`text-xs ${c.urgent ? "text-red-400 font-medium" : "text-muted-foreground/60"}`}>
                    {c.subtitle}
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
