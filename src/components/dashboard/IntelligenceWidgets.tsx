import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Euro, TrendingUp, Shield, BarChart3, Users, AlertTriangle
} from "lucide-react";
import { cardVariant, staggerContainer } from "@/lib/animations";

interface IntelligenceWidgetsProps {
  outstandingQuoteValue?: number;
  invoicesAwaitingPayment?: number;
  expectedCashInflow?: number;
  complianceAlerts?: number;
  auditReadiness?: number;
  stakeholderActivity?: number;
  isLoading?: boolean;
}

export function IntelligenceWidgets({
  outstandingQuoteValue = 12500,
  invoicesAwaitingPayment = 4,
  expectedCashInflow = 28400,
  complianceAlerts = 1,
  auditReadiness = 78,
  stakeholderActivity = 12,
  isLoading = false,
}: IntelligenceWidgetsProps) {
  const widgets = [
    {
      icon: FileText,
      label: "Openstaande offertes",
      value: `€${(outstandingQuoteValue / 1000).toFixed(1)}k`,
      trend: "3 actief",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Euro,
      label: "Facturen wachtend",
      value: String(invoicesAwaitingPayment),
      trend: "te betalen",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: TrendingUp,
      label: "Verwachte instroom",
      value: `€${(expectedCashInflow / 1000).toFixed(1)}k`,
      trend: "deze maand",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: AlertTriangle,
      label: "Compliance alerts",
      value: String(complianceAlerts),
      trend: complianceAlerts > 0 ? "actie vereist" : "geen issues",
      color: complianceAlerts > 0 ? "text-destructive" : "text-primary",
      bgColor: complianceAlerts > 0 ? "bg-destructive/10" : "bg-primary/10",
    },
    {
      icon: Shield,
      label: "Audit gereedheid",
      value: `${auditReadiness}%`,
      trend: auditReadiness >= 80 ? "goed" : "verbetering nodig",
      color: auditReadiness >= 80 ? "text-primary" : "text-amber-400",
      bgColor: auditReadiness >= 80 ? "bg-primary/10" : "bg-amber-500/10",
    },
    {
      icon: Users,
      label: "Stakeholder activiteit",
      value: String(stakeholderActivity),
      trend: "interacties deze week",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {widgets.map((w) => (
        <motion.div key={w.label} variants={cardVariant}>
          <Card className="arcory-glass hover:border-primary/20 transition-colors">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${w.bgColor} flex items-center justify-center shrink-0`}>
                  <w.icon className={`h-4 w-4 ${w.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">{w.label}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-foreground">{isLoading ? "—" : w.value}</span>
                    <span className="text-[10px] text-muted-foreground/60">{w.trend}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
