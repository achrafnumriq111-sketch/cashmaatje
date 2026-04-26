import { motion } from "framer-motion";
import { Flame, ArrowRight, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChaosData } from "@/hooks/useChaosData";

export function FixTheChaosCta() {
  const navigate = useNavigate();
  const { stats, items, dailyAnchor } = useChaosData();
  if (items.isLoading) return null;

  const hasIssues = stats.open > 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => navigate("/fix-the-chaos")}
      className={`group w-full text-left rounded-2xl border p-5 transition-all hover:shadow-lg ${
        hasIssues
          ? "bg-gradient-to-br from-red-500/10 via-amber-500/5 to-card border-red-500/20"
          : "bg-card hover:border-primary/30"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
            hasIssues
              ? "bg-red-500/15 text-red-500"
              : "bg-primary/10 text-primary"
          }`}
        >
          <Flame className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">FIX THE CHAOS</h3>
            {stats.red > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                {stats.red} urgent
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {hasIssues && dailyAnchor
              ? `Vandaag: ${dailyAnchor.recommended_action}`
              : hasIssues
              ? `${stats.open} open ${stats.open === 1 ? "actie" : "acties"} — klik om te zien wat je moet doen`
              : "Je business-reddingssysteem. Gooi je administratieve chaos hier en krijg per stuk een concrete actie."}
          </p>
          {hasIssues && (
            <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
              {stats.totalDue > 0 && (
                <span>€{stats.totalDue.toLocaleString("nl-NL", { maximumFractionDigits: 0 })} te regelen</span>
              )}
              {stats.red > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertTriangle className="w-3 h-3" /> {stats.red} urgent
                </span>
              )}
              {stats.orange > 0 && (
                <span className="text-amber-500">{stats.orange} belangrijk</span>
              )}
            </div>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}
