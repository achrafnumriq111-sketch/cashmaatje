import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HeartPulse, ArrowRight } from "lucide-react";
import { useHealthScore } from "@/hooks/useHealthScore";
import { Skeleton } from "@/components/ui/skeleton";

function gradeColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-rose-500";
}

export function LiveHealthCard() {
  const navigate = useNavigate();
  const { data, isLoading } = useHealthScore();

  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={() => navigate("/insights/health")}
      className="group text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors w-full"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-[12.5px]">
          <HeartPulse className="w-4 h-4 text-primary" />
          Financiële gezondheid
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-10 w-24 mt-3" />
      ) : (
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-[34px] font-semibold tracking-tight ${gradeColor(data.overall)}`}>
            {data.overall}
          </span>
          <span className="text-muted-foreground text-sm">/ 100 · {data.grade}</span>
        </div>
      )}

      {data && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.metrics.slice(0, 3).map((m) => (
            <span
              key={m.key}
              className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground"
            >
              {m.label}: {m.score}
            </span>
          ))}
        </div>
      )}
    </motion.button>
  );
}
