import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Calendar, TrendingDown, TrendingUp } from "lucide-react";
import { useRecurringPatterns, useDetectRecurringPatterns } from "@/hooks/useRecurringPatterns";
import { toast } from "sonner";

function fmt(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

const freqLabels: Record<string, string> = {
  wekelijks: "Wekelijks",
  maandelijks: "Maandelijks",
  "per kwartaal": "Per kwartaal",
  jaarlijks: "Jaarlijks",
};

export function RecurringPatterns() {
  const { data: patterns = [], isLoading } = useRecurringPatterns();
  const detect = useDetectRecurringPatterns();

  const handleDetect = async () => {
    try {
      const result = await detect.mutateAsync();
      toast.success(`${result.patterns} terugkerende patronen gevonden`);
    } catch {
      toast.error("Fout bij detectie");
    }
  };

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Terugkerende Transacties</CardTitle>
          </div>
          <Button size="sm" variant="outline" className="h-8" onClick={handleDetect} disabled={detect.isPending}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${detect.isPending ? "animate-spin" : ""}`} />
            {detect.isPending ? "Analyseren..." : "Detecteer"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : patterns.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nog geen patronen gevonden. Klik op "Detecteer" om te analyseren.
          </p>
        ) : (
          <div className="space-y-2">
            {patterns.map((p: any) => {
              const isExpected = p.next_expected_date && new Date(p.next_expected_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              const isIncoming = (p.typical_amount ?? 0) > 0;

              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={`p-2 rounded-lg ${isIncoming ? "bg-emerald-400/10" : "bg-orange-400/10"}`}>
                    {isIncoming ? (
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-orange-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{p.counterparty_name}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {freqLabels[p.frequency] || p.frequency}
                      </Badge>
                      {isExpected && (
                        <Badge className="bg-blue-500/15 text-blue-400 border-0 text-[10px] shrink-0">
                          Binnenkort
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.accounts && (
                        <span className="text-xs text-muted-foreground">{p.accounts.code} - {p.accounts.name_nl}</span>
                      )}
                      <span className="text-xs text-muted-foreground/60">• {p.times_matched}× gezien</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-semibold tabular-nums ${isIncoming ? "text-emerald-400" : "text-foreground"}`}>
                      {fmt(p.typical_amount ?? 0)}
                    </div>
                    {p.next_expected_date && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(p.next_expected_date).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
