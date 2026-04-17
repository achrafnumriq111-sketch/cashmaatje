import { motion } from "framer-motion";
import { Plug, ShoppingBag, CreditCard, Building, Mail, Cloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pageTransition, cardVariant, staggerContainer } from "@/lib/animations";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const integrations = [
  { name: "Shopify", desc: "Synchroniseer webshop-orders en producten.", icon: <ShoppingBag className="h-5 w-5" />, category: "E-commerce" },
  { name: "Lightspeed", desc: "Kassasysteem-verkopen automatisch verwerkt.", icon: <CreditCard className="h-5 w-5" />, category: "Kassa" },
  { name: "Mollie", desc: "Online betalingen ophalen en koppelen.", icon: <CreditCard className="h-5 w-5" />, category: "Payments" },
  { name: "Stripe", desc: "Stripe-uitbetalingen en transactiekosten.", icon: <CreditCard className="h-5 w-5" />, category: "Payments" },
  { name: "Exact Online", desc: "Importeer bestaande boekhouding.", icon: <Building className="h-5 w-5" />, category: "Boekhouding" },
  { name: "Mailchimp", desc: "Stuur facturen en herinneringen.", icon: <Mail className="h-5 w-5" />, category: "E-mail" },
  { name: "Dropbox", desc: "Documenten automatisch importeren.", icon: <Cloud className="h-5 w-5" />, category: "Storage" },
  { name: "Google Drive", desc: "Bonnen en facturen synchroniseren.", icon: <Cloud className="h-5 w-5" />, category: "Storage" },
];

export default function Integrations() {
  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-6xl">
      <motion.div variants={cardVariant} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Plug className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Integraties
            <InfoTooltip content="Koppel externe tools zoals webshops, kassasystemen en betaalplatforms. Data wordt automatisch geïmporteerd." />
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Koppel je bestaande tools aan Cashmaatje.</p>
        </div>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((i) => (
          <motion.div key={i.name} variants={cardVariant}>
            <Card className="arcory-glass h-full hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-lg bg-secondary text-foreground flex items-center justify-center">
                      {i.icon}
                    </span>
                    <div>
                      <CardTitle className="text-base font-medium">{i.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1 text-[10px] font-normal">{i.category}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed min-h-[32px]">{i.desc}</p>
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Binnenkort
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
