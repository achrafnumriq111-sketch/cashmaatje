import { motion } from "framer-motion";
import { ChaosItemCard } from "./ChaosItemCard";
import type { ChaosItem, UrgencyLane } from "@/hooks/useChaosData";

interface Props {
  lanes: { today: ChaosItem[]; this_week: ChaosItem[]; later: ChaosItem[] };
  onResolve: (id: string) => void;
  onDelete?: (item: ChaosItem) => void;
}

const laneMeta: Record<UrgencyLane, { title: string; sub: string; accent: string }> = {
  today: {
    title: "VANDAAG",
    sub: "Onmiddellijk handelen",
    accent: "border-l-red-500",
  },
  this_week: {
    title: "DEZE WEEK",
    sub: "Belangrijk, plan in",
    accent: "border-l-amber-500",
  },
  later: {
    title: "LATER",
    sub: "Volg op je gemak op",
    accent: "border-l-emerald-500",
  },
};

export function UrgencyLanes({ lanes, onResolve, onDelete }: Props) {
  const cols: { key: UrgencyLane; items: ChaosItem[] }[] = [
    { key: "today", items: lanes.today },
    { key: "this_week", items: lanes.this_week },
    { key: "later", items: lanes.later },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {cols.map(({ key, items }) => {
        const meta = laneMeta[key];
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border bg-card/40 border-l-4 ${meta.accent} p-4 flex flex-col`}
          >
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <div className="text-xs font-semibold tracking-wider text-foreground">
                  {meta.title}
                </div>
                <div className="text-[11px] text-muted-foreground">{meta.sub}</div>
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {items.length}
              </div>
            </div>

            <div className="space-y-2 flex-1">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-background/40 py-8 text-center">
                  <p className="text-xs text-muted-foreground">Niets in deze baan</p>
                </div>
              ) : (
                items.map((item) => (
                  <ChaosItemCard
                    key={item.id}
                    item={item}
                    onResolve={onResolve}
                    onDelete={onDelete ? () => onDelete(item) : undefined}
                  />
                ))
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
