import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChaosItem } from "@/hooks/useChaosData";

interface Props {
  item: ChaosItem | null;
  onOpen?: (id: string) => void;
}

export function DailyAnchorCard({ item, onOpen }: Props) {
  if (!item) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/30 p-6 h-full flex flex-col justify-center">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Vandaag
        </div>
        <h3 className="mt-2 text-base font-medium text-foreground">
          Niets dat je vandaag móét doen.
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Goed bezig. Upload nieuwe brieven om vooruit te blijven.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 h-full flex flex-col"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary">
        <Sparkles className="w-3.5 h-3.5" />
        Doe dit vandaag
      </div>

      <h3 className="mt-3 text-lg font-semibold text-foreground leading-snug">
        {item.recommended_action}
      </h3>

      <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
        {item.sender_name ? `${item.sender_name} · ` : ""}
        {item.document_title}
      </div>

      <div className="mt-auto pt-4 flex items-center gap-2">
        {item.phone_number && (
          <a
            href={`tel:${item.phone_number.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Phone className="w-3.5 h-3.5" /> {item.phone_number}
          </a>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => onOpen?.(item.id)}
        >
          Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}
