import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, AlertTriangle, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

const flows = [
  {
    title: "Inkoopproces",
    steps: ["Bestelling", "Ontvangst", "Factuur", "Betaling", "Boeking"],
    risks: [{ text: "Zelfde persoon bestelt en keurt goed", severity: "high" }],
  },
  {
    title: "Verkoopproces",
    steps: ["Offerte", "Order", "Levering", "Facturatie", "Incasso"],
    risks: [{ text: "Facturen zonder onderbouwing", severity: "medium" }],
  },
  {
    title: "Kasstroom",
    steps: ["Ontvangst", "Bankmutatie", "Reconciliatie", "Boeking"],
    risks: [],
  },
];

export default function ProcessFlows() {
  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Process Flow & Controls</h1>
        <p className="text-sm text-muted-foreground mt-1">Automatisch gedetecteerde bedrijfsprocessen en risico's</p>
      </motion.div>

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
                {/* Flow visualization */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  {flow.steps.map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50 text-xs font-medium text-foreground">
                        {step}
                      </div>
                      {i < flow.steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/40" />}
                    </div>
                  ))}
                </div>
                {/* Risks */}
                {flow.risks.map((risk, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{risk.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
