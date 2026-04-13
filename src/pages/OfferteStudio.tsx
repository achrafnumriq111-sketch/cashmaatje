import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, FileText, Send, ArrowRight, Image, Type } from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

export default function OfferteStudio() {
  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Offerte & Branding Studio</h1>
          <p className="text-sm text-muted-foreground mt-1">Ontwerp professionele offertes en facturen</p>
        </div>
        <Button className="gap-1.5"><FileText className="h-4 w-4" />Nieuwe offerte</Button>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Palette, title: "Huisstijl Templates", desc: "Pas kleuren, logo en lettertype aan", action: "Aanpassen" },
          { icon: Image, title: "Logo & Branding", desc: "Upload logo en stel visuele identiteit in", action: "Upload" },
          { icon: Type, title: "Lettertype selectie", desc: "Kies uit professionele lettertypes", action: "Kiezen" },
          { icon: FileText, title: "Offerte maken", desc: "Maak een nieuwe offerte met productblokken", action: "Start" },
          { icon: Send, title: "Automatisch versturen", desc: "Plan automatische verzending van offertes", action: "Instellen" },
          { icon: ArrowRight, title: "Offerte → Factuur", desc: "Converteer geaccepteerde offertes direct", action: "Beheer" },
        ].map((item) => (
          <motion.div key={item.title} variants={cardVariant}>
            <Card className="arcory-glass hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="pt-5 pb-4">
                <item.icon className="h-5 w-5 text-primary mb-3" />
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                <Button variant="outline" size="sm" className="mt-3" disabled>{item.action}</Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
