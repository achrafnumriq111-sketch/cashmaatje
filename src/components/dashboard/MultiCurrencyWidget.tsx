import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function MultiCurrencyWidget() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["multi-currency-open", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("currency, total_amount, amount_paid")
        .eq("organization_id", orgId!)
        .eq("archived", false)
        .in("status", ["sent", "partial", "overdue"]);
      if (error) throw error;

      const map = new Map<string, { count: number; open: number }>();
      for (const inv of data ?? []) {
        const ccy = (inv as any).currency || "EUR";
        const open = Number(inv.total_amount) - Number(inv.amount_paid || 0);
        if (open <= 0.01) continue;
        const cur = map.get(ccy) || { count: 0, open: 0 };
        cur.count += 1;
        cur.open += open;
        map.set(ccy, cur);
      }
      return Array.from(map.entries()).map(([ccy, v]) => ({ ccy, ...v }));
    },
  });

  if (!data || data.length < 2) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Openstaand per valuta</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {data.map((row) => (
          <button
            key={row.ccy}
            onClick={() => navigate("/facturen/verkoop")}
            className="text-left rounded-xl border border-border/50 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
          >
            <div className="text-xs text-muted-foreground">{row.count} {row.count === 1 ? "factuur" : "facturen"}</div>
            <div className="text-lg font-semibold tabular-nums mt-1">
              {new Intl.NumberFormat("nl-NL", { style: "currency", currency: row.ccy }).format(row.open)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
