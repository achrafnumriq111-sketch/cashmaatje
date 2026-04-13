import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cardVariant } from "@/lib/animations";
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
        <circle cx="84" cy="84" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx="84" cy="84" r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          strokeLinecap="round"
          transform="rotate(-90 84 84)"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-muted-foreground/50">/ 100</span>
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
    <motion.div variants={cardVariant} className="arcory-glass rounded-2xl p-5 sm:p-6 h-full">
      <div className="mb-4">
        <span className="text-micro text-muted-foreground">Financiële Gezondheid</span>
      </div>

      <div className="flex flex-col items-center gap-4">
        {isLoading ? (
          <Skeleton className="h-[168px] w-[168px] rounded-full" />
        ) : (
          <>
            <CircularProgress score={score} />
            <div className="w-full space-y-2">
              {Object.entries(factors).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground/60">{factorLabels[key] ?? key}</span>
                  <span className="font-medium text-foreground">{typeof value === "number" ? value : "—"}</span>
                </div>
              ))}
              {Object.keys(factors).length === 0 && (
                <p className="text-xs text-muted-foreground/40 text-center">Nog geen data beschikbaar</p>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
