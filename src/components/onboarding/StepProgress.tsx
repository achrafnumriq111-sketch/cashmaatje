import { Check, CircleAlert, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "complete" | "blocker" | "pending" | "skippable";

export interface StepIndicator {
  title: string;
  status: StepStatus;
  reason?: string;
}

interface Props {
  steps: StepIndicator[];
  current: number;
  onJump?: (index: number) => void;
}

export default function StepProgress({ steps, current, onJump }: Props) {
  const completed = steps.filter((s) => s.status === "complete").length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-all"
          style={{ width: `${Math.max(pct, ((current + 1) / steps.length) * 100)}%` }}
        />
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5">
        {steps.map((s, i) => {
          const active = i === current;
          const Icon =
            s.status === "complete" ? Check
            : s.status === "blocker" ? CircleAlert
            : Circle;
          const color =
            s.status === "complete" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
            : s.status === "blocker" ? "text-destructive border-destructive/30 bg-destructive/10"
            : active ? "text-primary border-primary/40 bg-primary/10"
            : "text-muted-foreground border-border bg-muted/40";
          return (
            <button
              key={i}
              type="button"
              onClick={() => onJump?.(i)}
              title={s.reason ?? s.title}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                color,
                active && "ring-2 ring-primary/20",
              )}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Blocker explanation for current step */}
      {steps[current]?.status === "blocker" && steps[current]?.reason && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong className="font-semibold">Deze stap is nog niet compleet:</strong> {steps[current].reason}
          </span>
        </div>
      )}
    </div>
  );
}
