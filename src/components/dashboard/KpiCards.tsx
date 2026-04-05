import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Wallet, BarChart3, Users, Receipt } from "lucide-react";
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

interface Props {
  latest?: Snapshot | null;
  previous?: Snapshot | null;
  role: Role;
}

export function KpiCards({ latest, previous, role }: Props) {
  const isLoading = !latest && !previous;

  const cards = [
    {
      label: "Kassaldo",
      value: latest?.cash_balance,
      prev: previous?.cash_balance,
      icon: Wallet,
    },
    {
      label: role === "entrepreneur" ? "Omzet deze maand" : "Revenue MTD",
      value: latest?.revenue_mtd,
      prev: previous?.revenue_mtd,
      icon: BarChart3,
    },
    {
      label: "Openstaand debiteuren",
      value: latest?.accounts_receivable,
      prev: previous?.accounts_receivable,
      icon: Users,
    },
    {
      label: "BTW reservering",
      value: latest?.vat_reserve,
      prev: previous?.vat_reserve,
      icon: Receipt,
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
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.label}</span>
                  <c.icon className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <div className="text-2xl font-semibold tracking-tight text-foreground">{fmt(c.value)}</div>
                <div className="mt-1">
                  <TrendBadge pct={pctChange(c.value, c.prev)} />
                  <span className="text-xs text-muted-foreground ml-1">vs vorige maand</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
