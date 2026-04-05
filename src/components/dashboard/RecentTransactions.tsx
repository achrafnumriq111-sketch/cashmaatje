import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";

type BankTx = Database["public"]["Tables"]["bank_transactions"]["Row"];
type Role = Database["public"]["Enums"]["user_role"] | undefined;

type Transaction = Pick<BankTx, "id" | "transaction_date" | "counterparty_name" | "amount" | "status" | "ai_category_suggestion" | "ai_confidence" | "description">;

function statusBadge(status: string) {
  switch (status) {
    case "matched": return <Badge variant="default" className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">Gematcht</Badge>;
    case "new": return <Badge variant="secondary" className="bg-blue-500/15 text-blue-400 border-0 text-[10px]">Nieuw</Badge>;
    default: return <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-[10px]">Open</Badge>;
  }
}

function confidenceBadge(confidence: number | null) {
  if (confidence == null) return null;
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400";
  return <span className={`text-[10px] font-medium ${color}`}>{pct}%</span>;
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
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">Recente Transacties</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Geen transacties gevonden</p>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-2.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                <div className="text-xs text-muted-foreground w-16 shrink-0">
                  {new Date(tx.transaction_date).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{tx.counterparty_name || tx.description || "Onbekend"}</div>
                  {role !== "entrepreneur" && tx.ai_category_suggestion && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">AI categorie</span>
                      {confidenceBadge(tx.ai_confidence)}
                    </div>
                  )}
                </div>
                <div className={`text-sm font-medium tabular-nums ${tx.amount >= 0 ? "text-emerald-400" : "text-foreground"}`}>
                  {fmtAmount(tx.amount)}
                </div>
                <div className="w-20 text-right">{statusBadge(tx.status)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
