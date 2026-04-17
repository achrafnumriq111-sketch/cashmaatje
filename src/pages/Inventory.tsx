import { motion } from "framer-motion";
import { Boxes, Smartphone, Package, ScanLine, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pageTransition, cardVariant, staggerContainer } from "@/lib/animations";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export default function Inventory() {
  const features = [
    { icon: <Package className="h-5 w-5" />, title: "Productcatalogus", desc: "Beheer je producten met SKU, prijs en BTW-tarief." },
    { icon: <ScanLine className="h-5 w-5" />, title: "Voorraadtellingen", desc: "Periodieke tellingen met directe verschillenrapportage." },
    { icon: <Smartphone className="h-5 w-5" />, title: "Mobiel scannen", desc: "Scan barcodes met je telefoon — voorraad direct bijgewerkt." },
    { icon: <Sparkles className="h-5 w-5" />, title: "Realtime saldo", desc: "Voorraad altijd actueel, gekoppeld aan verkopen en inkopen." },
  ];

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-5xl">
      <motion.div variants={cardVariant} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Boxes className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Voorraad
            <InfoTooltip content="Module voor productbeheer, tellingen en mobiel barcode-scannen. Wordt gekoppeld aan verkoop- en inkoopfacturen voor realtime saldo." />
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Beheer je voorraad realtime met mobiel scannen.</p>
        </div>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((f, i) => (
          <motion.div key={i} variants={cardVariant}>
            <Card className="arcory-glass h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2.5">
                  <span className="text-primary">{f.icon}</span>
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={cardVariant}>
        <Card className="arcory-glass border-dashed">
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">Voorraadmodule wordt geactiveerd in Fase E</p>
            <p className="text-xs text-muted-foreground">Multi-entity, audit trail en debiteurenbeheer komen eerst.</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
