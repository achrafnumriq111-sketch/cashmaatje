import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, Building2, Users, Globe } from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

export default function ComplianceCheck() {
  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Compliance Check</h1>
        <p className="text-sm text-muted-foreground mt-1">Automatische controle van bedrijven en stakeholders</p>
      </motion.div>

      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardContent className="pt-5">
            <div className="flex gap-2">
              <Input placeholder="KVK-nummer of bedrijfsnaam..." className="flex-1" />
              <Button className="gap-1.5"><Search className="h-4 w-4" />Controleer</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Building2, label: "KVK Verificatie", desc: "Handelsregister check" },
          { icon: Shield, label: "Sanctie Check", desc: "EU/NL sanctielijsten" },
          { icon: Globe, label: "Reputatie Signalen", desc: "Nieuws & fraude indicatoren" },
          { icon: Users, label: "Bestuurder Check", desc: "Directeuren & UBO's" },
        ].map((item) => (
          <motion.div key={item.label} variants={cardVariant}>
            <Card className="arcory-glass">
              <CardContent className="pt-5 pb-4">
                <item.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
                <Badge variant="outline" className="mt-2 text-[10px]">Beschikbaar</Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
