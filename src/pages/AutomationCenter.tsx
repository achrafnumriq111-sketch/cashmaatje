import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, Bell, FileText, Wallet, Users, Plus } from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

const workflows = [
  { icon: Mail, title: "Betalingsherinnering", desc: "Automatisch bij openstaande facturen na vervaldatum", trigger: "Factuur overdue", active: false },
  { icon: FileText, title: "Offerte follow-up", desc: "Herinnering 3 dagen na verzending offerte", trigger: "Offerte verstuurd", active: false },
  { icon: Wallet, title: "BTW herinnering", desc: "Notificatie 5 dagen voor BTW deadline", trigger: "Kalender", active: false },
  { icon: Clock, title: "Jaarafsluiting herinnering", desc: "Melding voor jaarrekening en deponering", trigger: "Kalender", active: false },
  { icon: Users, title: "Investeerder update", desc: "Periodieke financiële samenvatting per email", trigger: "Maandelijks", active: false },
  { icon: Bell, title: "Salarismelding", desc: "Notificatie voor loonrun en premieafdracht", trigger: "Maandelijks", active: false },
];

export default function AutomationCenter() {
  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Automation Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Event-based email workflows en notificaties</p>
        </div>
        <Button className="gap-1.5" disabled><Plus className="h-4 w-4" />Nieuwe workflow</Button>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workflows.map((w) => (
          <motion.div key={w.title} variants={cardVariant}>
            <Card className="arcory-glass">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <w.icon className="h-5 w-5 text-primary" />
                  <Badge variant={w.active ? "default" : "outline"} className="text-[10px]">{w.active ? "Actief" : "Inactief"}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{w.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{w.desc}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-2">Trigger: {w.trigger}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
