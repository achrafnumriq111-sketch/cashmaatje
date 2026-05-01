import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTaxReserve } from "@/hooks/useTaxReserve";
import { cardVariant } from "@/lib/animations";
import { Skeleton } from "@/components/ui/skeleton";

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export function TaxReserveCard() {
  const navigate = useNavigate();
  const { data, isLoading } = useTaxReserve();

  if (isLoading) {
    return (
      <motion.div variants={cardVariant} className="arcory-glass rounded-2xl p-5 sm:p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-9 w-44" />
        <Skeleton className="mt-2 h-3 w-24" />
      </motion.div>
    );
  }

  if (!data) return null;

  const statusColor = {
    ok: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", Icon: CheckCircle2, label: "Op koers" },
    low: { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", Icon: TrendingUp, label: "Reserveer wat extra" },
    critical: { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", Icon: AlertTriangle, label: "Te weinig gereserveerd" },
    "no-data": { text: "text-muted-foreground", bg: "bg-secondary/40", border: "border-border", Icon: Shield, label: "Nog geen data" },
  }[data.status];

  return (
    <motion.div
      variants={cardVariant}
      onClick={() => navigate("/belasting/reserve")}
      className="arcory-glass rounded-2xl p-5 sm:p-6 cursor-pointer group hover:bg-white/[0.02] transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${statusColor.bg}`}>
            <Shield className={`h-3.5 w-3.5 ${statusColor.text}`} />
          </div>
          <span className="text-micro text-muted-foreground">Belastingreserve · {data.periodLabel}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
      </div>

      <div className="mt-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Veilig te besteden</p>
        <p className="text-[28px] font-semibold tracking-tight text-foreground tabular-nums">{fmt(data.safeToSpend)}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">van {fmt(data.cashBalance)} cash</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5">
          <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground/60">BTW {data.periodLabel}</p>
          <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-foreground">{fmt(data.vatDuePeriod)}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5">
          <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground/60">IB-indicatie</p>
          <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-foreground">{fmt(data.incomeTaxEstimate)}</p>
        </div>
      </div>

      <div className={`mt-4 flex items-center gap-2 rounded-xl border ${statusColor.border} ${statusColor.bg} px-3 py-2`}>
        <statusColor.Icon className={`h-3.5 w-3.5 ${statusColor.text} flex-shrink-0`} />
        <p className={`text-[12px] ${statusColor.text}`}>
          {data.status === "no-data" && "Boek je eerste facturen om je reserve te zien."}
          {data.status === "ok" && `Goed bezig — reserve is op orde${data.daysToVatDeadline > 0 ? ` (deadline over ${data.daysToVatDeadline}d)` : ""}.`}
          {data.status === "low" && `Reserveer ${fmt(data.shortage)} extra om volledig gedekt te zijn.`}
          {data.status === "critical" && `Tekort van ${fmt(data.shortage)} — cash dekt de belasting niet.`}
        </p>
      </div>
    </motion.div>
  );
}
