import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Palette, Monitor, Type, Layers, Image, Sparkles } from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";
import { toast } from "sonner";

interface ThemeConfig {
  id: string;
  name: string;
  desc: string;
  colors: string[];
  cssVars: Record<string, string>;
}

const themes: ThemeConfig[] = [
  { id: "dark", name: "Cash Maatje Dark", desc: "Standaard donker thema met emerald accent", colors: ["#0a0a0a", "#171717", "#10B981", "#27272a"], cssVars: { "--background": "0 0% 3.9%", "--primary": "160 84% 39%", "--card": "0 0% 7.8%" } },
  { id: "arctic", name: "Arctic Light", desc: "Helder licht thema, witte achtergrond", colors: ["#ffffff", "#f8fafc", "#0EA5E9", "#e2e8f0"], cssVars: { "--background": "0 0% 100%", "--foreground": "222 47% 11%", "--primary": "199 89% 48%", "--card": "0 0% 100%", "--card-foreground": "222 47% 11%", "--muted": "210 40% 96%", "--muted-foreground": "215 16% 47%", "--border": "214 32% 91%" } },
  { id: "midnight", name: "Midnight Blue", desc: "Diepblauw, koel en strak", colors: ["#0a0f1a", "#111827", "#3B82F6", "#1e293b"], cssVars: { "--background": "222 47% 5%", "--primary": "217 91% 60%", "--card": "222 47% 8%" } },
  { id: "sunset", name: "Sunset Glow", desc: "Warm oranje/roze accent op donker", colors: ["#1a0a14", "#2d1320", "#F97316", "#3d1f2a"], cssVars: { "--background": "340 35% 6%", "--primary": "20 95% 55%", "--card": "340 35% 10%" } },
  { id: "forest", name: "Forest Mode", desc: "Diepgroen bos met levendige accent", colors: ["#0a120a", "#142014", "#22C55E", "#1a2e1a"], cssVars: { "--background": "120 25% 5%", "--primary": "142 71% 45%", "--card": "120 25% 8%" } },
  { id: "mono", name: "Mono Pro", desc: "Pure grijstinten, professioneel", colors: ["#0a0a0a", "#1f1f1f", "#a3a3a3", "#2e2e2e"], cssVars: { "--background": "0 0% 4%", "--primary": "0 0% 75%", "--card": "0 0% 9%" } },
];

const typographyOptions = [
  { id: "inter", name: "Inter", preview: "Modern & Clean" },
  { id: "mono", name: "JetBrains Mono", preview: "Developer Mode" },
  { id: "sans", name: "DM Sans", preview: "Soft & Rounded" },
];

export default function ThemeStudio() {
  const [activeTheme, setActiveTheme] = useState("dark");
  const [accentColor, setAccentColor] = useState("#10B981");
  const [sidebarGlow, setSidebarGlow] = useState("#10B981");
  const [cardStyle, setCardStyle] = useState("glass");
  const [typography, setTypography] = useState("inter");

  const applyTheme = (themeId: string) => {
    setActiveTheme(themeId);
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      Object.entries(theme.cssVars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
      setAccentColor(theme.colors[2]);
      toast.success(`Thema "${theme.name}" toegepast`);
    }
  };

  const applyAccentColor = (color: string) => {
    setAccentColor(color);
    // Convert hex to HSL for CSS variable
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    const hsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    document.documentElement.style.setProperty("--primary", hsl);
    document.documentElement.style.setProperty("--ring", hsl);
    document.documentElement.style.setProperty("--sidebar-primary", hsl);
    document.documentElement.style.setProperty("--sidebar-accent", hsl);
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Theme Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">Personaliseer je Cash Maatje ervaring</p>
      </motion.div>

      <Tabs defaultValue="themes">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="themes">Thema's</TabsTrigger>
          <TabsTrigger value="customize">Aanpassen</TabsTrigger>
          <TabsTrigger value="preview">Live preview</TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="mt-4">
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => (
              <motion.div key={theme.id} variants={cardVariant}>
                <Card
                  className={`arcory-glass cursor-pointer transition-all ${activeTheme === theme.id ? "border-primary/50 ring-1 ring-primary/20" : "hover:border-primary/30"}`}
                  onClick={() => applyTheme(theme.id)}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <Palette className="h-4 w-4 text-primary" />
                      {activeTheme === theme.id && <Badge className="text-[10px] gap-1"><Check className="h-3 w-3" />Actief</Badge>}
                    </div>
                    <div className="flex gap-1.5 mb-3">
                      {theme.colors.map((c, i) => (
                        <div key={i} className="w-10 h-10 rounded-lg border border-border/30 shadow-inner" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-foreground">{theme.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{theme.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="customize" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Color customization */}
            <Card className="arcory-glass">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4 text-primary" />Kleuren</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Accent kleur</Label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={accentColor} onChange={e => applyAccentColor(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer border border-border" />
                    <Input value={accentColor} onChange={e => applyAccentColor(e.target.value)} className="font-mono text-xs" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899"].map(c => (
                      <button key={c} onClick={() => applyAccentColor(c)} className={`w-8 h-8 rounded-lg border-2 transition-all ${accentColor === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Sidebar glow kleur</Label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={sidebarGlow} onChange={e => setSidebarGlow(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer border border-border" />
                    <Input value={sidebarGlow} onChange={e => setSidebarGlow(e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Typography & style */}
            <Card className="arcory-glass">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Type className="h-4 w-4 text-primary" />Typografie & Stijl</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Lettertype</Label>
                  <div className="grid gap-2 mt-1">
                    {typographyOptions.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTypography(t.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${typography === t.id ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/20"}`}
                      >
                        <span className="text-xs font-medium text-foreground">{t.name}</span>
                        <span className="text-[10px] text-muted-foreground">{t.preview}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Kaart stijl</Label>
                  <Select value={cardStyle} onValueChange={setCardStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="glass">Glasmorfisme</SelectItem>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="minimal">Minimaal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Achtergrond</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Standaard" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Standaard</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="dots">Stippenpatroon</SelectItem>
                      <SelectItem value="grid">Rasterpatroon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card className="arcory-glass">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Monitor className="h-4 w-4 text-primary" />Live preview</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border overflow-hidden">
                {/* Mini preview */}
                <div className="bg-background p-4 space-y-3">
                  <div className="flex gap-3">
                    <Card className="arcory-glass flex-1">
                      <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-muted-foreground">Omzet</p>
                        <p className="text-lg font-bold text-foreground">€42.500</p>
                        <p className="text-[10px] text-primary">+12.5%</p>
                      </CardContent>
                    </Card>
                    <Card className="arcory-glass flex-1">
                      <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-muted-foreground">Kosten</p>
                        <p className="text-lg font-bold text-foreground">€18.200</p>
                        <p className="text-[10px] text-destructive">-3.2%</p>
                      </CardContent>
                    </Card>
                    <Card className="arcory-glass flex-1">
                      <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-muted-foreground">Winst</p>
                        <p className="text-lg font-bold text-primary">€24.300</p>
                        <p className="text-[10px] text-primary">+22.8%</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">Primaire actie</Button>
                    <Button variant="outline" size="sm">Secundaire actie</Button>
                    <Button variant="ghost" size="sm">Ghost</Button>
                  </div>
                  <div className="flex gap-2">
                    <Badge>Actief</Badge>
                    <Badge variant="outline">Concept</Badge>
                    <Badge variant="destructive">Overdue</Badge>
                    <Badge variant="secondary">Info</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
