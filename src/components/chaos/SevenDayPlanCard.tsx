import { motion } from "framer-motion";
import { CalendarCheck, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChaosData } from "@/hooks/useChaosData";

interface Props {
  onOpenItem?: (id: string) => void;
}

export function SevenDayPlanCard({ onOpenItem }: Props) {
  const { recoveryPlan, generateRecoveryPlan, updateRecoveryPlanDay, stats } = useChaosData();
  const plan = recoveryPlan.data;

  if (!plan) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Je 7-daags herstelplan</h3>
              <span className="text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                AI
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              In één klik krijg je een dag-voor-dag rescue-plan op basis van al je
              openstaande zaken. Geen dashboard — een uitweg.
            </p>
            <Button
              className="mt-4"
              size="sm"
              disabled={stats.open === 0 || generateRecoveryPlan.isPending}
              onClick={() => generateRecoveryPlan.mutate()}
            >
              {generateRecoveryPlan.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Plan wordt opgesteld…
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Genereer mijn herstelplan
                </>
              )}
            </Button>
            {stats.open === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Geen openstaande zaken — geen plan nodig.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  const completed = plan.days.filter((d) => d.done).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-6"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Je 7-daags herstelplan</h3>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {completed}/{plan.days.length}
            </span>
          </div>
          {plan.summary && (
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">{plan.summary}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={generateRecoveryPlan.isPending}
          onClick={() => generateRecoveryPlan.mutate()}
        >
          {generateRecoveryPlan.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Opnieuw genereren"
          )}
        </Button>
      </div>

      <ol className="space-y-2">
        {plan.days.map((d) => (
          <li
            key={d.day}
            className={`rounded-xl border p-3 transition-colors ${
              d.done ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card"
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() =>
                  updateRecoveryPlanDay.mutate({
                    plan_id: plan.id,
                    day: d.day,
                    done: !d.done,
                  })
                }
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center text-[10px] font-semibold transition-colors ${
                  d.done
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-border text-muted-foreground hover:border-foreground"
                }`}
                aria-label={d.done ? "Markeer als open" : "Markeer als klaar"}
              >
                {d.done ? "✓" : d.day}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-sm font-medium text-foreground">{d.title}</div>
                  <div className="text-[10px] tabular-nums text-muted-foreground">
                    {new Date(d.date).toLocaleDateString("nl-NL", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{d.why}</p>
                {d.item_id && onOpenItem && (
                  <button
                    onClick={() => onOpenItem(d.item_id!)}
                    className="mt-1 text-[11px] text-primary hover:underline"
                  >
                    → open dossier
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}
