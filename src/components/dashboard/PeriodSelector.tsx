import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type PeriodKey = "month" | "quarter" | "ytd" | "year" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
  key: PeriodKey;
}

function getPresets(): { key: PeriodKey; label: string; from: Date; to: Date }[] {
  const now = new Date();
  return [
    { key: "month", label: "Deze maand", from: startOfMonth(now), to: endOfMonth(now) },
    { key: "quarter", label: "Dit kwartaal", from: startOfQuarter(now), to: endOfQuarter(now) },
    { key: "ytd", label: "YTD", from: startOfYear(now), to: now },
    { key: "year", label: "Dit jaar", from: startOfYear(now), to: endOfYear(now) },
  ];
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function PeriodSelector({ value, onChange }: Props) {
  const presets = getPresets();
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(value.from);
  const [customTo, setCustomTo] = useState<Date | undefined>(value.to);

  return (
    <div className="inline-flex items-center gap-0.5 bg-white/[0.03] rounded-xl p-1">
      {presets.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange({ ...p })}
          className={`
            relative px-3.5 py-1.5 rounded-lg text-[12px] font-medium
            transition-all duration-200
            ${value.key === p.key ? "text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground"}
          `}
        >
          {value.key === p.key && (
            <motion.div
              layoutId="period-active"
              className="absolute inset-0 bg-primary rounded-lg"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{p.label}</span>
        </button>
      ))}

      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <button
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
              transition-colors
              ${value.key === "custom" ? "text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground"}
            `}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            {value.key === "custom"
              ? `${format(value.from, "d MMM", { locale: nl })} – ${format(value.to, "d MMM", { locale: nl })}`
              : "Aangepast"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex flex-col sm:flex-row">
            <div className="p-3 border-b sm:border-b-0 sm:border-r border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Van</p>
              <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} locale={nl} className={cn("p-0 pointer-events-auto")} />
            </div>
            <div className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Tot</p>
              <Calendar mode="single" selected={customTo} onSelect={setCustomTo} locale={nl} disabled={(date) => customFrom ? date < customFrom : false} className={cn("p-0 pointer-events-auto")} />
            </div>
          </div>
          <div className="flex justify-end gap-2 p-3 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setCustomOpen(false)}>Annuleren</Button>
            <Button
              size="sm"
              disabled={!customFrom || !customTo}
              onClick={() => {
                if (customFrom && customTo) {
                  onChange({
                    key: "custom",
                    label: `${format(customFrom, "d MMM", { locale: nl })} – ${format(customTo, "d MMM yyyy", { locale: nl })}`,
                    from: customFrom,
                    to: customTo,
                  });
                  setCustomOpen(false);
                }
              }}
            >
              Toepassen
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function getDefaultPeriod(): DateRange {
  const now = new Date();
  return {
    key: "quarter",
    label: "Dit kwartaal",
    from: startOfQuarter(now),
    to: endOfQuarter(now),
  };
}
