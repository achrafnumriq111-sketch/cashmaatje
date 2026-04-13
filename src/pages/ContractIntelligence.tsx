import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSearch, Shield, AlertTriangle } from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

export default function ContractIntelligence() {
  const [text, setText] = useState("");
  
  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contract Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload of plak contracttekst voor Wet DBA en compliance check</p>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={cardVariant}>
          <Card className="arcory-glass">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4 text-primary" />Contract uploaden</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center">
                <FileSearch className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sleep PDF/DOCX hier of klik om te uploaden</p>
              </div>
              <div className="relative">
                <p className="text-xs text-muted-foreground mb-2">Of plak contracttekst:</p>
                <Textarea placeholder="Plak hier de contracttekst..." rows={8} value={text} onChange={(e) => setText(e.target.value)} />
              </div>
              <Button className="w-full gap-1.5" disabled={!text.trim()}>
                <Shield className="h-4 w-4" />Analyseer Contract
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariant}>
          <Card className="arcory-glass">
            <CardHeader><CardTitle className="text-base">Controle resultaten</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Wet DBA Compliance", status: "pending", desc: "Schijnzelfstandigheid risico" },
                { label: "Exclusiviteitsclausules", status: "pending", desc: "Verdachte exclusiviteit" },
                { label: "Fiscale risico's", status: "pending", desc: "Belastingrisico clausules" },
                { label: "Betalingsvoorwaarden", status: "pending", desc: "Betalingstermijnen analyse" },
              ].map((check) => (
                <div key={check.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{check.label}</p>
                    <p className="text-xs text-muted-foreground">{check.desc}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Wacht op input</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
