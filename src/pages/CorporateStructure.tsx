import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, GitBranch, Plus, User } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

export default function CorporateStructure() {
  const { membership } = useOrganization();

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Corporate Structure</h1>
          <p className="text-sm text-muted-foreground mt-1">Organogram en holding structuur</p>
        </div>
        <Button className="gap-1.5" disabled><Plus className="h-4 w-4" />Entiteit toevoegen</Button>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex flex-col items-center gap-4">
        {/* Owner node */}
        <motion.div variants={cardVariant}>
          <Card className="arcory-glass w-64 text-center">
            <CardContent className="pt-5 pb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <User className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-foreground">Eigenaar</p>
              <p className="text-xs text-muted-foreground">Natuurlijk persoon</p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="w-px h-8 bg-border" />

        {/* Holding */}
        <motion.div variants={cardVariant}>
          <Card className="arcory-glass w-64 text-center border-primary/30">
            <CardContent className="pt-5 pb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-foreground">{membership?.organizationName ?? "Holding BV"}</p>
              <Badge variant="outline" className="mt-1 text-[10px]">100%</Badge>
            </CardContent>
          </Card>
        </motion.div>

        <div className="w-px h-8 bg-border" />

        {/* Subsidiaries */}
        <div className="flex gap-6 flex-wrap justify-center">
          {["Werkmaatschappij BV", "Retail BV", "Tech BV"].map((name) => (
            <motion.div key={name} variants={cardVariant}>
              <Card className="arcory-glass w-52 text-center hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="pt-4 pb-3">
                  <GitBranch className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">100%</Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
