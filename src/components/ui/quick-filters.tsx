import { cn } from "@/lib/utils";

export interface QuickFilterOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  options: QuickFilterOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export function QuickFilters<T extends string>({ options, value, onChange, className }: Props<T>) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-full border border-border bg-card p-1", className)}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0 text-[10px] tabular-nums",
                  active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export type DateRangePreset = "today" | "week" | "month" | "quarter" | "year" | "all";

export function getDateRangeFromPreset(preset: DateRangePreset): { from: string; to: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "today":
      return { from: fmt(today), to: fmt(today) };
    case "week": {
      const day = today.getDay() || 7;
      const monday = new Date(today);
      monday.setDate(today.getDate() - day + 1);
      return { from: fmt(monday), to: fmt(today) };
    }
    case "month":
      return {
        from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      return {
        from: fmt(new Date(now.getFullYear(), q * 3, 1)),
        to: fmt(new Date(now.getFullYear(), q * 3 + 3, 0)),
      };
    }
    case "year":
      return {
        from: fmt(new Date(now.getFullYear(), 0, 1)),
        to: fmt(new Date(now.getFullYear(), 11, 31)),
      };
    case "all":
      return { from: "2000-01-01", to: fmt(today) };
  }
}

export const DATE_PRESETS: QuickFilterOption<DateRangePreset>[] = [
  { value: "today", label: "Vandaag" },
  { value: "week", label: "Week" },
  { value: "month", label: "Maand" },
  { value: "quarter", label: "Kwartaal" },
  { value: "year", label: "Jaar" },
];
