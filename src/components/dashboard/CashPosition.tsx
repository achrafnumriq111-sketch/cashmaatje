import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Building2 } from "lucide-react";

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
    <Card className="border-border/50 bg-card h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Bankrekeningen</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground/60" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Geen bankrekeningen gekoppeld</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{acc.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{acc.iban}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold tabular-nums ${(acc.current_balance ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmt(acc.current_balance ?? 0)}
                  </div>
                  {acc.bank_name && <div className="text-[10px] text-muted-foreground">{acc.bank_name}</div>}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-sm font-medium text-muted-foreground">Totaal</span>
              <span className={`text-lg font-bold tabular-nums ${total >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {fmt(total)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
