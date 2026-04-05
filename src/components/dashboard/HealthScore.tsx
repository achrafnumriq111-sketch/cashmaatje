import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";

type Snapshot = Database["public"]["Tables"]["financial_health_snapshots"]["Row"];

function scoreColor(score: number) {
  if (score < 40) return "hsl(0 84% 60%)";
  if (score < 70) return "hsl(38 92% 50%)";
  return "hsl(160 84% 39%)";
}

function CircularProgress({ score }: { score: number }) {
  const radius = 70;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="168" height="168" viewBox="0 0 168 168">
        <circle cx="84" cy="84" r={radius} fill="none" stroke="hsl(240 3.7% 15.9%)" strokeWidth={stroke} />
        <circle
          cx="84" cy="84" r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 84 84)"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

interface Props {
  snapshot?: Snapshot | null;
  isLoading: boolean;
}

export function HealthScore({ snapshot, isLoading }: Props) {
  const score = snapshot?.health_score ?? 0;
  const factors = (snapshot?.health_factors as Record<string, number> | null) ?? {};

  const factorLabels: Record<string, string> = {
    liquidity: "Liquiditeit",
    profitability: "Winstgevendheid",
    receivables: "Debiteuren",
    payables: "Crediteuren",
    tax_compliance: "Fiscale compliance",
    cash_flow: "Cashflow",
  };

  return (
    <Card className="border-border/50 bg-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Financiële Gezondheid</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {isLoading ? (
          <Skeleton className="h-[168px] w-[168px] rounded-full" />
        ) : (
          <>
            <CircularProgress score={score} />
            <div className="w-full space-y-2">
              {Object.entries(factors).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{factorLabels[key] ?? key}</span>
                  <span className="font-medium text-foreground">{typeof value === "number" ? value : "—"}</span>
                </div>
              ))}
              {Object.keys(factors).length === 0 && (
                <p className="text-xs text-muted-foreground text-center">Nog geen data beschikbaar</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
