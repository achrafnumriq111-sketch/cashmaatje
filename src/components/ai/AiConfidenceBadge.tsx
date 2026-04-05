import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AiConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export function AiConfidenceBadge({ confidence, className }: AiConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);

  const config =
    confidence >= 0.9
      ? { label: "Zeker", variant: "default" as const, classes: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" }
      : confidence >= 0.7
        ? { label: "Waarschijnlijk", variant: "outline" as const, classes: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20" }
        : confidence >= 0.5
          ? { label: "Onzeker", variant: "outline" as const, classes: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20" }
          : { label: "Handmatig", variant: "outline" as const, classes: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20" };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className={`text-[11px] font-medium ${config.classes} ${className ?? ""}`}>
          {config.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{pct}% zekerheid</p>
      </TooltipContent>
    </Tooltip>
  );
}
