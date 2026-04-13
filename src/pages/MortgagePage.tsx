import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Home, Percent } from "lucide-react";
import { useMortgageDeduction, getMortgageNetDeduction } from "@/hooks/useMortgageDeduction";
import { toast } from "sonner";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const fmt = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function MortgagePage() {
  const [year, setYear] = useState(currentYear);
  const { mortgage, setMortgage, loading, saving, save, netDeduction } = useMortgageDeduction(year);

  const handleSave = async () => { await save(mortgage); toast.success("Hypotheekgegevens opgeslagen"); };
  const eigenwoningforfait = mortgage.woz_value * mortgage.eigenwoningforfait_percentage;

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Koopwoning</h1>
          <p className="text-sm text-muted-foreground mt-1">Hypotheekrenteaftrek en woonlasten automatisch verwerkt.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={saving} size="sm"><Save className="mr-1.5 h-4 w-4" /> {saving ? "Opslaan..." : "Opslaan"}</Button>
        </div>
      </motion.div>

      {loading ? <p className="text-sm text-muted-foreground">Laden...</p> : (
        <>
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: <Home className="h-5 w-5 text-primary" />, label: "Hypotheekrente", value: fmt(mortgage.mortgage_interest_annual), bg: "bg-primary/10" },
              { icon: <Percent className="h-5 w-5 text-muted-foreground" />, label: "Eigenwoningforfait", value: fmt(eigenwoningforfait), bg: "bg-muted" },
              { icon: <Home className="h-5 w-5 text-primary" />, label: "Netto aftrek", value: fmt(netDeduction), bg: "bg-primary/10", valueClass: "text-primary" },
            ].map((kpi, i) => (
              <motion.div key={i} variants={cardVariant}>
                <Card className="arcory-glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.bg}`}>{kpi.icon}</div>
                      <div>
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                        <p className={`text-xl font-semibold tabular-nums ${(kpi as any).valueClass ?? ""}`}>{kpi.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={cardVariant}>
            <Card className="arcory-glass">
              <CardHeader className="pb-3"><CardTitle className="text-base">Hypotheekgegevens {year}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Hypotheekrente per jaar (€)</Label><Input type="number" value={mortgage.mortgage_interest_annual} onChange={(e) => setMortgage({ ...mortgage, mortgage_interest_annual: parseFloat(e.target.value) || 0 })} /></div>
                  <div className="space-y-2"><Label>Financieringskosten (€)</Label><Input type="number" value={mortgage.financing_costs} onChange={(e) => setMortgage({ ...mortgage, financing_costs: parseFloat(e.target.value) || 0 })} /><p className="text-xs text-muted-foreground">Eenmalige kosten bij aankoop (notaris, taxatie)</p></div>
                  <div className="space-y-2"><Label>Erfpacht per jaar (€)</Label><Input type="number" value={mortgage.ground_lease_annual} onChange={(e) => setMortgage({ ...mortgage, ground_lease_annual: parseFloat(e.target.value) || 0 })} /></div>
                  <div className="space-y-2"><Label>WOZ-waarde (€)</Label><Input type="number" value={mortgage.woz_value} onChange={(e) => setMortgage({ ...mortgage, woz_value: parseFloat(e.target.value) || 0 })} /></div>
                  <div className="space-y-2"><Label>Eigenwoningforfait (%)</Label><Input type="number" step="0.0001" value={mortgage.eigenwoningforfait_percentage * 100} onChange={(e) => setMortgage({ ...mortgage, eigenwoningforfait_percentage: (parseFloat(e.target.value) || 0) / 100 })} /><p className="text-xs text-muted-foreground">Standaard 0,35% voor woningen €75.000–€1.200.000</p></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariant}>
            <Card className="arcory-glass">
              <CardHeader className="pb-3"><CardTitle className="text-base">Berekening</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Hypotheekrente</span><span className="tabular-nums">{fmt(mortgage.mortgage_interest_annual)}</span></div>
                  {mortgage.financing_costs > 0 && <div className="flex justify-between"><span className="text-muted-foreground">+ Financieringskosten</span><span className="tabular-nums">{fmt(mortgage.financing_costs)}</span></div>}
                  {mortgage.ground_lease_annual > 0 && <div className="flex justify-between"><span className="text-muted-foreground">+ Erfpacht</span><span className="tabular-nums">{fmt(mortgage.ground_lease_annual)}</span></div>}
                  <div className="flex justify-between text-destructive"><span>− Eigenwoningforfait ({(mortgage.eigenwoningforfait_percentage * 100).toFixed(2)}%)</span><span className="tabular-nums">{fmt(eigenwoningforfait)}</span></div>
                  <div className="border-t pt-2 flex justify-between font-semibold"><span>Netto aftrek woning</span><span className="tabular-nums text-primary">{fmt(netDeduction)}</span></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
