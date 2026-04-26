import { FileQuestion } from "lucide-react";
import type { MissingDoc } from "@/hooks/useChaosData";

interface Props {
  docs: MissingDoc[] | null | undefined;
}

const sevTone: Record<string, string> = {
  high: "text-red-500 border-red-500/30 bg-red-500/5",
  medium: "text-amber-500 border-amber-500/30 bg-amber-500/5",
  low: "text-muted-foreground border-border bg-muted/30",
};

export function MissingDocsPanel({ docs }: Props) {
  if (!docs || docs.length === 0) return null;

  return (
    <section>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
        <FileQuestion className="w-3.5 h-3.5" /> Wat we nog missen
      </h4>
      <ul className="space-y-2">
        {docs.map((d, i) => {
          const tone = sevTone[d.severity ?? "medium"] ?? sevTone.medium;
          return (
            <li
              key={i}
              className={`rounded-lg border p-3 ${tone}`}
            >
              <div className="text-sm font-medium text-foreground">{d.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{d.why}</div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
