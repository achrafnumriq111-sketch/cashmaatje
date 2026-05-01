import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";

type BankTx = Database["public"]["Tables"]["bank_transactions"]["Row"];
type Role = Database["public"]["Enums"]["user_role"] | undefined;
type Transaction = Pick<
  BankTx,
  "id" | "transaction_date" | "counterparty_name" | "amount" | "status" | "ai_category_suggestion" | "ai_confidence" | "description"
>;

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    matched: { label: "Gematcht", cls: "bg-[hsl(var(--primary-soft))] text-primary" },
    new: { label: "Nieuw", cls: "bg-secondary text-foreground" },
  };
  const s = map[status] ?? { label: "Open", cls: "bg-secondary text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium ${s.cls}`}>
      {s.label}
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
    <div className="rounded-2xl bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-muted-foreground">
          Recente transacties
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[13px] text-muted-foreground">Nog geen transacties</p>
          <p className="text-[12px] text-muted-foreground/70 mt-1">Je bent helemaal bij.</p>
        </div>
      ) : (
        <div className="-mx-2">
          {transactions.map((tx) => {
            const positive = tx.amount >= 0;
            const name = tx.counterparty_name || tx.description || "Onbekend";
            const initial = name.charAt(0).toUpperCase();
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-secondary/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-secondary grid place-items-center text-[12px] font-medium text-foreground shrink-0">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-foreground truncate">{name}</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {new Date(tx.transaction_date).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                    {role !== "entrepreneur" && tx.ai_category_suggestion && (
                      <>
                        <span className="mx-1.5 text-muted-foreground/40">·</span>
                        <span>{tx.ai_category_suggestion}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-[13.5px] font-medium tabular-nums ${
                      positive ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {fmtAmount(tx.amount)}
                  </p>
                </div>
                <div className="w-20 flex justify-end">{statusBadge(tx.status)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
