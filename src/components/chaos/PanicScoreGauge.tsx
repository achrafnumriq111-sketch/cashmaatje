import { motion } from "framer-motion";
import type { PanicBand } from "@/hooks/useChaosData";

const bandLabel: Record<PanicBand, { label: string; color: string; ring: string; sub: string }> = {
  stable: {
    label: "STABIEL",
    color: "text-emerald-500",
    ring: "stroke-emerald-500",
    sub: "Geen acute risico's",
  },
  warning: {
    label: "LET OP",
    color: "text-amber-500",
    ring: "stroke-amber-500",
    sub: "Plan deze week actie",
  },
  high: {
    label: "HOOG RISICO",
    color: "text-orange-500",
    ring: "stroke-orange-500",
    sub: "Onderneem actie binnen 48 uur",
  },
  immediate: {
    label: "ONMIDDELLIJK",
    color: "text-red-500",
    ring: "stroke-red-500",
    sub: "Doe dit vandaag — niet morgen",
  },
};

function bandFromScore(score: number): PanicBand {
  if (score >= 81) return "immediate";
  if (score >= 61) return "high";
  if (score >= 31) return "warning";
  return "stable";
}

interface Props {
  score: number;
  openCount: number;
  size?: number;
}

export function PanicScoreGauge({ score, openCount, size = 220 }: Props) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const band = bandFromScore(safeScore);
  const meta = bandLabel[band];

  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius * 0.75; // 270° arc
  const offset = circumference * (1 - safeScore / 100);

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Paniekniveau
          </div>
          <div className={`text-sm font-semibold ${meta.color}`}>{meta.label}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-muted-foreground">Open zaken</div>
          <div className="text-sm font-semibold text-foreground">{openCount}</div>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative" style={{ width: size, height: size * 0.78 }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="overflow-visible"
            style={{ transform: "rotate(135deg)" }}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={10}
              className="stroke-muted/40"
              strokeDasharray={`${circumference} ${2 * Math.PI * radius}`}
              strokeLinecap="round"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={10}
              className={meta.ring}
              strokeDasharray={`${circumference} ${2 * Math.PI * radius}`}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center -mt-4">
            <div className={`text-5xl font-semibold tabular-nums ${meta.color}`}>
              {safeScore}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">
              / 100
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-center text-muted-foreground">{meta.sub}</p>
    </div>
  );
}
