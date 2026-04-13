import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, BookOpen, Receipt, GitMerge, FileDown, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

const sections = [
  { id: "lead", title: "Lead Schedules", desc: "Overzicht per grootboekrekening met aansluiting", icon: BookOpen, status: "ready" },
  { id: "invoices", title: "Factuur Bewijs", desc: "Alle verkoop- en inkoopfacturen met bijlagen", icon: Receipt, status: "ready" },
  { id: "bank", title: "Bankaansluitingen", desc: "Reconciliatie bank vs. grootboek per maand", icon: GitMerge, status: "ready" },
  { id: "vat", title: "BTW Controle", desc: "Aansluiting BTW aangifte met grootboek", icon: Shield, status: "ready" },
  { id: "debtors", title: "Debiteuren Analyse", desc: "Ouderdomsanalyse en dubieuze debiteuren", icon: AlertTriangle, status: "ready" },
  { id: "creditors", title: "Crediteuren Analyse", desc: "Openstaande posten en betalingstermijnen", icon: FileCheck, status: "ready" },
];

export default function AuditDossier() {
  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Audit Dossier</h1>
          <p className="text-sm text-muted-foreground mt-1">Automatisch gegenereerd controledossier</p>
        </div>
        <Button size="sm" className="gap-1.5" disabled>
          <FileDown className="h-4 w-4" />Download Dossier
        </Button>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <motion.div key={s.id} variants={cardVariant}>
            <Card className="arcory-glass hover:border-primary/30 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <s.icon className="h-5 w-5 text-primary" />
                  <Badge variant="outline" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3 text-primary" />Gereed</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-sm mb-1">{s.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
