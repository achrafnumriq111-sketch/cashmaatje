import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight, AlertCircle } from "lucide-react";
import { cardVariant } from "@/lib/animations";

function fmt(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

interface Props {
  receivable: number;
  payable: number;
  overdueReceivable: number;
  overduePayable: number;
  isLoading: boolean;
}

export function OpenItems({ receivable, payable, overdueReceivable, overduePayable, isLoading }: Props) {
  return (
    <motion.div variants={cardVariant} className="arcory-glass rounded-2xl p-5 sm:p-6 h-full">
      <div className="mb-4">
        <span className="text-micro text-muted-foreground">Openstaande Posten</span>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-emerald-400/10">
                <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="text-micro uppercase tracking-wider text-muted-foreground">TE ONTVANGEN</span>
            </div>
            <div className="text-xl font-semibold text-emerald-400 tabular-nums">{fmt(receivable)}</div>
            {overdueReceivable > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 text-red-400" />
                <span className="text-xs text-red-400">{fmt(overdueReceivable)} verlopen</span>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-orange-400/10">
                <ArrowUpRight className="h-3.5 w-3.5 text-orange-400" />
              </div>
              <span className="text-micro uppercase tracking-wider text-muted-foreground">TE BETALEN</span>
            </div>
            <div className="text-xl font-semibold text-orange-400 tabular-nums">{fmt(payable)}</div>
            {overduePayable > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 text-red-400" />
                <span className="text-xs text-red-400">{fmt(overduePayable)} verlopen</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <span className="text-[13px] font-medium text-muted-foreground">Netto positie</span>
            <span className={`text-lg font-bold tabular-nums ${receivable - payable >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {fmt(receivable - payable)}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
