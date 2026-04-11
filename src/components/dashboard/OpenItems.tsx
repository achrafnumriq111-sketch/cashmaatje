import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight, AlertCircle } from "lucide-react";

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
    <Card className="border-border/50 bg-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Openstaande Posten</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Debiteuren */}
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-emerald-400/10">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Te ontvangen</span>
              </div>
              <div className="text-xl font-semibold text-emerald-400 tabular-nums">{fmt(receivable)}</div>
              {overdueReceivable > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-red-400" />
                  <span className="text-xs text-red-400">{fmt(overdueReceivable)} verlopen</span>
                </div>
              )}
            </div>

            {/* Crediteuren */}
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-orange-400/10">
                  <ArrowUpRight className="h-3.5 w-3.5 text-orange-400" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Te betalen</span>
              </div>
              <div className="text-xl font-semibold text-orange-400 tabular-nums">{fmt(payable)}</div>
              {overduePayable > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-red-400" />
                  <span className="text-xs text-red-400">{fmt(overduePayable)} verlopen</span>
                </div>
              )}
            </div>

            {/* Net position */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-sm font-medium text-muted-foreground">Netto positie</span>
              <span className={`text-lg font-bold tabular-nums ${receivable - payable >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {fmt(receivable - payable)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
