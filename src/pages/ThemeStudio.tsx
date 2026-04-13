import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Palette } from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

const themes = [
  { id: "dark", name: "Arcory Dark", desc: "Standaard donker thema", colors: ["#0a0a0a", "#171717", "#10B981", "#27272a"], active: true },
  { id: "emerald", name: "Emerald Glass", desc: "Premium glaseffect met emerald accent", colors: ["#0c1017", "#131a24", "#10B981", "#1a2332"], active: false },
  { id: "midnight", name: "Midnight Blue", desc: "Diepblauw met koele tinten", colors: ["#0a0f1a", "#111827", "#3B82F6", "#1e293b"], active: false },
  { id: "light", name: "Minimal Light", desc: "Schoon licht thema", colors: ["#ffffff", "#f4f4f5", "#10B981", "#e4e4e7"], active: false },
  { id: "sahara", name: "Sahara Gold", desc: "Warm goud en zandtinten", colors: ["#1a1408", "#2d2310", "#D97706", "#44381d"], active: false },
  { id: "forest", name: "Forest Mode", desc: "Diepgroen bos thema", colors: ["#0a120a", "#142014", "#22C55E", "#1a2e1a"], active: false },
];

export default function ThemeStudio() {
  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Theme Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">Kies een thema of maak je eigen stijl</p>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => (
          <motion.div key={theme.id} variants={cardVariant}>
            <Card className={`arcory-glass cursor-pointer transition-all ${theme.active ? "border-primary/50 ring-1 ring-primary/20" : "hover:border-primary/30"}`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Palette className="h-4 w-4 text-primary" />
                  {theme.active && <Badge className="text-[10px] gap-1"><Check className="h-3 w-3" />Actief</Badge>}
                </div>
                <div className="flex gap-1.5 mb-3">
                  {theme.colors.map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg border border-border/30" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="text-sm font-medium text-foreground">{theme.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{theme.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
