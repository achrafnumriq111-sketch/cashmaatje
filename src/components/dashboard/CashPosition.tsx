import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Building2 } from "lucide-react";
import { cardVariant, staggerContainer } from "@/lib/animations";

interface BankAccount {
  id: string;
  name: string;
  iban: string;
  current_balance: number | null;
  bank_name: string | null;
  is_primary: boolean | null;
  last_sync_at: string | null;
}

function fmt(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

interface Props {
  accounts: BankAccount[];
  isLoading: boolean;
}

export function CashPosition({ accounts, isLoading }: Props) {
  const total = accounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0);

  return (
    <motion.div variants={cardVariant} className="arcory-glass rounded-2xl p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-micro text-muted-foreground">Bankrekeningen</span>
        <Wallet className="h-4 w-4 text-muted-foreground/40" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground/50 text-center py-6">Geen bankrekeningen gekoppeld</p>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2.5">
          {accounts.map((acc) => (
            <motion.div
              key={acc.id}
              variants={cardVariant}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-foreground truncate">{acc.name}</div>
                <div className="text-[11px] text-muted-foreground/50 font-mono">{acc.iban}</div>
              </div>
              <div className="text-right">
                <div className={`text-[13px] font-semibold tabular-nums ${(acc.current_balance ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {fmt(acc.current_balance ?? 0)}
                </div>
                {acc.bank_name && <div className="text-[10px] text-muted-foreground/40">{acc.bank_name}</div>}
              </div>
            </motion.div>
          ))}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <span className="text-[13px] font-medium text-muted-foreground">Totaal</span>
            <span className={`text-lg font-bold tabular-nums ${total >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {fmt(total)}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
