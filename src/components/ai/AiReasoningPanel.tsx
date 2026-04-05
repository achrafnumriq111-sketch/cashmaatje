import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Sparkles } from "lucide-react";
import { AiConfidenceBadge } from "./AiConfidenceBadge";

interface Factor {
  name: string;
  weight: number;
  description: string;
}

interface Alternative {
  label: string;
  confidence: number;
  description?: string;
}

interface AiReasoningPanelProps {
  action: string;
  confidence: number;
  reasoning?: string;
  reasoningNl?: string;
  factors?: Factor[];
  alternatives?: Alternative[];
  className?: string;
}

export function AiReasoningPanel({
  action,
  confidence,
  reasoning,
  reasoningNl,
  factors,
  alternatives,
  className,
}: AiReasoningPanelProps) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(confidence * 100);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="flex-1 text-muted-foreground">
          AI heeft <span className="font-medium text-foreground">{action}</span> voorgesteld met{" "}
          <span className="font-medium text-foreground">{pct}%</span> zekerheid
        </span>
        <AiConfidenceBadge confidence={confidence} />
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4 text-sm">
        {(reasoningNl || reasoning) && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Toelichting</p>
            <p className="text-foreground leading-relaxed">{reasoningNl ?? reasoning}</p>
          </div>
        )}

        {factors && factors.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Factoren</p>
            <div className="space-y-2">
              {factors.map((f, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{f.name}</span>
                    <span className="text-muted-foreground">{f.description}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(f.weight * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {alternatives && alternatives.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Alternatieven</p>
            <div className="space-y-1.5">
              {alternatives.map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-background/50 px-3 py-2 text-xs">
                  <span>{a.label}</span>
                  <AiConfidenceBadge confidence={a.confidence} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
