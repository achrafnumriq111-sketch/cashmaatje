import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, AlertTriangle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface FlowStep {
  label: string;
  count: number | null;
}
interface FlowDef {
  title: string;
  steps: FlowStep[];
  risks: { text: string; severity: "high" | "medium" | "low" }[];
}

function useProcessFlowData() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  return useQuery({
    queryKey: ["process-flows", orgId],
    queryFn: async (): Promise<FlowDef[]> => {
      if (!orgId) return [];

      const [purchases, sales, txns, recon, matched] = await Promise.all([
        supabase.from("invoices").select("id,status,amount_due", { count: "exact", head: false }).eq("organization_id", orgId).eq("invoice_type", "purchase"),
        supabase.from("invoices").select("id,status,amount_due,sent_at", { count: "exact", head: false }).eq("organization_id", orgId).eq("invoice_type", "sales"),
        supabase.from("bank_transactions").select("id,status", { count: "exact", head: false }).eq("organization_id", orgId),
        supabase.from("bank_transactions").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "matched"),
        supabase.from("bank_transactions").select("id", { count: "exact", head: true }).eq("organization_id", orgId).neq("status", "new"),
      ]);

      const purchaseRows = purchases.data ?? [];
      const salesRows = sales.data ?? [];
      const txnRows = txns.data ?? [];

      const openPurchases = purchaseRows.filter((r: any) => r.amount_due > 0).length;
      const openSales = salesRows.filter((r: any) => r.amount_due > 0).length;
      const draftSales = salesRows.filter((r: any) => r.status === "draft").length;

      const flows: FlowDef[] = [
        {
          title: "Inkoopproces",
          steps: [
            { label: "Bestelling", count: null },
            { label: "Ontvangst", count: null },
            { label: `Factuur (${purchaseRows.length})`, count: purchaseRows.length },
            { label: `Betaling (${purchaseRows.length - openPurchases})`, count: purchaseRows.length - openPurchases },
            { label: "Boeking", count: null },
          ],
          risks: openPurchases > 5
            ? [{ text: `${openPurchases} openstaande inkoopfacturen — controleer betaalcyclus`, severity: "medium" }]
            : [],
        },
        {
          title: "Verkoopproces",
          steps: [
            { label: `Offerte`, count: null },
            { label: `Order (${salesRows.length})`, count: salesRows.length },
            { label: "Levering", count: null },
            { label: `Facturatie (${salesRows.length - draftSales})`, count: salesRows.length - draftSales },
            { label: `Incasso (${salesRows.length - openSales})`, count: salesRows.length - openSales },
          ],
          risks: [
            ...(openSales > 3 ? [{ text: `${openSales} openstaande verkoopfacturen — debiteurenrisico`, severity: "high" as const }] : []),
            ...(draftSales > 0 ? [{ text: `${draftSales} concept facturen niet verstuurd`, severity: "medium" as const }] : []),
          ],
        },
        {
          title: "Kasstroom",
          steps: [
            { label: `Ontvangst (${txnRows.filter((t: any) => t.status === "matched").length})`, count: null },
            { label: `Bankmutatie (${txnRows.length})`, count: txnRows.length },
            { label: `Reconciliatie (${recon.count ?? 0})`, count: recon.count ?? 0 },
            { label: "Boeking", count: null },
          ],
          risks: (() => {
            const unmatched = txnRows.filter((t: any) => t.status === "new").length;
            return unmatched > 10
              ? [{ text: `${unmatched} bankmutaties nog niet gereconcilieerd`, severity: "high" as const }]
              : [];
          })(),
        },
      ];

      return flows;
    },
    enabled: !!orgId,
  });
}

export default function ProcessFlows() {
  const { data: flows = [], isLoading } = useProcessFlowData();

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Process Flow & Controls</h1>
        <p className="text-sm text-muted-foreground mt-1">Automatisch gedetecteerde bedrijfsprocessen en risico's op basis van je live data</p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Processen analyseren...
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
          {flows.map((flow) => (
            <motion.div key={flow.title} variants={cardVariant}>
              <Card className="arcory-glass">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />{flow.title}
                    </CardTitle>
                    {flow.risks.length > 0 ? (
                      <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-400/30 gap-1">
                        <AlertTriangle className="h-3 w-3" />{flow.risks.length} risico's
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-primary gap-1">
                        <CheckCircle2 className="h-3 w-3" />Geen risico's
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    {flow.steps.map((step, i) => (
                      <div key={step.label} className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50 text-xs font-medium text-foreground">
                          {step.label}
                        </div>
                        {i < flow.steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/40" />}
                      </div>
                    ))}
                  </div>
                  {flow.risks.map((risk, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${risk.severity === "high" ? "bg-red-500/5 border border-red-500/10" : "bg-orange-500/5 border border-orange-500/10"}`}>
                      <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${risk.severity === "high" ? "text-red-400" : "text-orange-400"}`} />
                      <span className="text-xs text-muted-foreground">{risk.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
