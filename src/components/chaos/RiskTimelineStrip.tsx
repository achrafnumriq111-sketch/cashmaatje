import type { RiskTimelineStep } from "@/hooks/useChaosData";

interface Props {
  steps: RiskTimelineStep[] | null | undefined;
}

export function RiskTimelineStrip({ steps }: Props) {
  if (!steps || steps.length === 0) return null;

  return (
    <section>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Wat gebeurt er als je niets doet
      </h4>
      <ol className="relative border-l border-border ml-2 space-y-3">
        {steps.map((s, i) => {
          const tone =
            i === 0
              ? "bg-emerald-500"
              : i < steps.length - 1
              ? "bg-amber-500"
              : "bg-red-500";
          return (
            <li key={i} className="pl-4 relative">
              <span
                className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${tone}`}
              />
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {s.when}
              </div>
              <div className="text-sm font-medium text-foreground">{s.stage}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {s.consequence}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
