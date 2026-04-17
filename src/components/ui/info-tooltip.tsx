import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  content: string;
  className?: string;
  size?: number;
}

/**
 * Small (i) icon with hover tooltip. Use to add inline help next to labels.
 * Example: <InfoTooltip content="Uitleg over deze stap" />
 */
export function InfoTooltip({ content, className, size = 14 }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Meer info"
          className={cn(
            "inline-flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors",
            className,
          )}
        >
          <Info size={size} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
