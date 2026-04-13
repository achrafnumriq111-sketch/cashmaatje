import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Link, Mail, Share2, Users, Copy } from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

export default function ReferralCenter() {
  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Referral Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Nodig anderen uit en verdien beloningen</p>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={cardVariant} className="lg:col-span-2">
          <Card className="arcory-glass">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link className="h-4 w-4 text-primary" />Jouw referral link</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value="https://arcory.app/ref/jouw-code" readOnly className="flex-1 font-mono text-xs" />
                <Button variant="outline" size="sm" className="gap-1"><Copy className="h-3.5 w-3.5" />Kopieer</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" disabled><Mail className="h-4 w-4" />Email</Button>
                <Button variant="outline" size="sm" className="gap-1.5" disabled><Share2 className="h-4 w-4" />WhatsApp</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariant}>
          <Card className="arcory-glass">
            <CardContent className="pt-5 space-y-4">
              {[
                { label: "Uitnodigingen", value: "0", icon: Users },
                { label: "Aangemeld", value: "0", icon: Gift },
                { label: "Beloningen", value: "€0", icon: Gift },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{stat.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
