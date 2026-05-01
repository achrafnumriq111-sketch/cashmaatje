import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cardVariant } from "@/lib/animations";
import { useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface SmartEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  whyItMatters?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  secondaryAction?: ReactNode;
  compact?: boolean;
}

/**
 * Smart empty state — never just "no data".
 * Always explains: what's missing, why it matters, and one clear action.
 */
export function SmartEmptyState({
  icon: Icon,
  title,
  description,
  whyItMatters,
  actionLabel,
  actionTo,
  onAction,
  secondaryAction,
  compact = false,
}: SmartEmptyStateProps) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) onAction();
    else if (actionTo) navigate(actionTo);
  };

  return (
    <motion.div
      variants={cardVariant}
      initial="initial"
      animate="animate"
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8 px-4" : "py-14 px-6"
      }`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary-soft))]">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] text-muted-foreground">{description}</p>
      {whyItMatters && (
        <p className="mt-3 max-w-md rounded-lg bg-secondary/40 px-3 py-2 text-[12px] text-muted-foreground/90">
          <span className="font-medium text-foreground/80">Waarom dit telt:</span> {whyItMatters}
        </p>
      )}
      {(actionLabel || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actionLabel && (
            <Button size="sm" onClick={handleAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
}
