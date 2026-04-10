import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Wallet, BarChart3, Receipt, AlertTriangle, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useVatEngine } from "@/hooks/useVatEngine";
import type { Database } from "@/integrations/supabase/types";

type Snapshot = Database["public"]["Tables"]["financial_health_snapshots"]["Row"];
type Role = Database["public"]["Enums"]["user_role"] | undefined;

function fmt(n: number | null | undefined) {
  if (n == null) return "€ 0";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function pctChange(current: number | null | undefined, prev: number | null | undefined) {
  const c = current ?? 0;
  const p = prev ?? 0;
  if (p === 0) return null;
  return ((c - p) / Math.abs(p)) * 100;
}

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-xs text-muted-foreground">—</span>;
  const isUp = pct > 0;
  const isFlat = Math.abs(pct) < 0.5;
  const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
  const color = isFlat ? "text-muted-foreground" : isUp ? "text-emerald-400" : "text-red-400";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

const riskColors = {
  low: "text-emerald-400",
  medium: "text-yellow-400",
  high: "text-red-400",
};
const riskLabels = {
  low: "Laag risico",
  medium: "Let op",
  high: "Actie vereist",
};

interface Props {
  latest?: Snapshot | null;
  previous?: Snapshot | null;
  role: Role;
}

export function KpiCards({ latest, previous, role }: Props) {
  const { data: vat, isLoading: vatLoading } = useVatEngine();
  const isLoading = (!latest && !previous) || vatLoading;

  const cards = [
    {
      label: "Te betalen BTW",
      value: vat?.netVat ?? latest?.vat_reserve,
      prev: previous?.vat_reserve,
      icon: Receipt,
      subtitle: vat ? `${fmt(vat.vatOwed)} af te dragen · ${fmt(vat.vatReclaimable)} terug` : undefined,
      liveIndicator: true,
    },
    {
      label: "Te ontvangen BTW",
      value: vat?.vatReclaimable ?? 0,
      prev: null,
      icon: ArrowDownLeft,
      subtitle: "Voorbelasting dit kwartaal",
    },
    {
      label: "Verwacht einde kwartaal",
      value: vat?.quarterEstimate ?? 0,
      prev: null,
      icon: ArrowUpRight,
      subtitle: "Gebaseerd op huidig tempo",
    },
    {
      label: "Risico-indicator",
      value: null,
      prev: null,
      icon: AlertTriangle,
      isRisk: true,
      riskLevel: vat?.riskLevel ?? "low",
      riskReasons: vat?.riskReasons ?? [],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="border-border/50 bg-card">
          <CardContent className="p-5">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-32" />
              </div>
            ) : c.isRisk ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.label}</span>
                  <c.icon className={`h-4 w-4 ${riskColors[c.riskLevel!]}`} />
                </div>
                <div className={`text-2xl font-semibold tracking-tight ${riskColors[c.riskLevel!]}`}>
                  {riskLabels[c.riskLevel!]}
                </div>
                <div className="mt-1 space-y-0.5">
                  {c.riskReasons!.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Alles ziet er goed uit</span>
                  ) : (
                    c.riskReasons!.slice(0, 2).map((r, i) => (
                      <p key={i} className="text-xs text-muted-foreground">• {r}</p>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.label}</span>
                    {c.liveIndicator && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                  <c.icon className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <div className="text-2xl font-semibold tracking-tight text-foreground">{fmt(c.value)}</div>
                <div className="mt-1">
                  {c.subtitle ? (
                    <span className="text-xs text-muted-foreground">{c.subtitle}</span>
                  ) : (
                    <>
                      <TrendBadge pct={pctChange(c.value, c.prev)} />
                      <span className="text-xs text-muted-foreground ml-1">vs vorige maand</span>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
