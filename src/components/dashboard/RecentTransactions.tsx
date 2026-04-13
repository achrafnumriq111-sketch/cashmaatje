import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cardVariant, staggerContainerFast, tableRowVariant } from "@/lib/animations";
import type { Database } from "@/integrations/supabase/types";

type BankTx = Database["public"]["Tables"]["bank_transactions"]["Row"];
type Role = Database["public"]["Enums"]["user_role"] | undefined;
type Transaction = Pick<BankTx, "id" | "transaction_date" | "counterparty_name" | "amount" | "status" | "ai_category_suggestion" | "ai_confidence" | "description">;

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    matched: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    new: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  };
  const labels: Record<string, string> = { matched: "Gematcht", new: "Nieuw" };
  const s = styles[status] ?? "bg-white/[0.06] text-amber-400 ring-amber-500/20";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium ring-1 ring-inset ${s}`}>
      {labels[status] ?? "Open"}
    </span>
  );
}

function fmtAmount(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

interface Props {
  transactions: Transaction[];
  isLoading: boolean;
  role: Role;
}

export function RecentTransactions({ transactions, isLoading, role }: Props) {
  return (
    <motion.div variants={cardVariant} className="arcory-glass rounded-2xl p-5 sm:p-6">
      <div className="mb-4">
        <span className="text-micro text-muted-foreground">Recente Transacties</span>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
      ) : transactions.length === 0 ? (
        <p className="text-[13px] text-muted-foreground/50 text-center py-8">Geen transacties gevonden</p>
      ) : (
        <motion.div variants={staggerContainerFast} initial="initial" animate="animate" className="space-y-0.5">
          {transactions.map((tx) => (
            <motion.div
              key={tx.id}
              variants={tableRowVariant}
              className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-white/[0.03] transition-colors"
            >
              <div className="text-[11px] text-muted-foreground/50 w-14 shrink-0">
                {new Date(tx.transaction_date).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-foreground/80 truncate">{tx.counterparty_name || tx.description || "Onbekend"}</div>
                {role !== "entrepreneur" && tx.ai_category_suggestion && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground/40">AI categorie</span>
                    {tx.ai_confidence != null && (
                      <span className={`text-[10px] font-medium ${Math.round(tx.ai_confidence * 100) >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                        {Math.round(tx.ai_confidence * 100)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className={`text-[13px] font-medium tabular-nums ${tx.amount >= 0 ? "text-emerald-400" : "text-foreground/70"}`}>
                {fmtAmount(tx.amount)}
              </div>
              <div className="w-20 text-right">{statusBadge(tx.status)}</div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
