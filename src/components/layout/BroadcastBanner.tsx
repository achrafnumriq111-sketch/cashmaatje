import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Megaphone } from "lucide-react";
import { useBroadcasts } from "@/hooks/useMessaging";
import { cn } from "@/lib/utils";

export function BroadcastBanner() {
  const { activeBanner, markRead } = useBroadcasts();

  return (
    <AnimatePresence>
      {activeBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={cn(
            "w-full overflow-hidden border-b",
            activeBanner.kind === "warning"
              ? "bg-yellow-500/10 border-yellow-500/30"
              : activeBanner.kind === "success"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-primary/10 border-primary/30"
          )}
        >
          <div className="px-6 py-2.5 flex items-center gap-3 text-sm">
            <Megaphone className="h-4 w-4 shrink-0 text-foreground" />
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{activeBanner.title}</span>
              <span className="text-muted-foreground hidden md:inline">— {activeBanner.body}</span>
              {activeBanner.cta_url && activeBanner.cta_label && (
                <a
                  href={activeBanner.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {activeBanner.cta_label} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <button
              onClick={() => markRead.mutate({ id: activeBanner.id, dismiss: true })}
              className="p-1 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Sluit aankondiging"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
