import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileWarning, Calendar, GitMerge, ScanLine } from "lucide-react";
import { cardVariant, staggerContainer } from "@/lib/animations";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Enums"]["user_role"] | undefined;

interface Props {
  unreconciledCount: number;
  missingDocsCount: number;
  pendingDocsCount: number;
  anomaliesCount: number;
  vatDeadline: { period_end: string; daysRemaining: number; period_number: number; year: number } | null | undefined;
  role: Role;
}

export function ActionItems({ unreconciledCount, missingDocsCount, pendingDocsCount, anomaliesCount, vatDeadline, role }: Props) {
  const navigate = useNavigate();

  const items = [
    ...(role !== "entrepreneur"
      ? [{
          icon: GitMerge,
          label: "Niet-afgeletterde transacties",
          count: unreconciledCount,
          color: "text-amber-400",
          bg: "bg-amber-400/10",
          onClick: () => navigate("/reconciliatie"),
        }]
      : []),
    {
      icon: ScanLine,
      label: "Bonnen in verwerking",
      count: pendingDocsCount,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      onClick: () => navigate("/bonnen"),
    },
    {
      icon: FileWarning,
      label: role === "entrepreneur" ? "Ontbrekende bonnetjes" : "Ontbrekende documenten",
      count: missingDocsCount,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      onClick: () => navigate("/documenten"),
    },
    ...(vatDeadline
      ? [{
          icon: Calendar,
          label: `BTW aangifte Q${vatDeadline.period_number} ${vatDeadline.year}`,
          count: vatDeadline.daysRemaining,
          suffix: vatDeadline.daysRemaining === 1 ? "dag" : "dagen",
          color: vatDeadline.daysRemaining <= 7 ? "text-red-400" : "text-blue-400",
          bg: vatDeadline.daysRemaining <= 7 ? "bg-red-400/10" : "bg-blue-400/10",
          onClick: () => navigate("/btw/aangifte"),
        }]
      : []),
    {
      icon: AlertTriangle,
      label: role === "entrepreneur" ? "Aandachtspunten" : "Anomalieën",
      count: anomaliesCount,
      color: "text-red-400",
      bg: "bg-red-400/10",
      onClick: () => navigate("/reconciliatie"),
    },
  ];

  return (
    <motion.div variants={cardVariant} className="arcory-glass rounded-2xl p-5 sm:p-6">
      <div className="mb-4">
        <span className="text-micro text-muted-foreground">Actiepunten</span>
      </div>
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-1">
        {items.map((item) => (
          <motion.button
            key={item.label}
            variants={cardVariant}
            onClick={item.onClick}
            className="flex items-center gap-3 w-full py-3 px-3 rounded-xl hover:bg-white/[0.03] transition-colors text-left group"
          >
            <div className={`p-2 rounded-xl ${item.bg}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] text-foreground/80 group-hover:text-foreground transition-colors">{item.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-semibold ${item.color}`}>{item.count}</span>
              {"suffix" in item && <span className="text-xs text-muted-foreground/50">{(item as any).suffix}</span>}
            </div>
          </motion.button>
        ))}
        {items.every((i) => i.count === 0) && (
          <p className="text-[13px] text-muted-foreground/50 text-center py-6">Alles is up-to-date 🎉</p>
        )}
      </motion.div>
    </motion.div>
  );
}
