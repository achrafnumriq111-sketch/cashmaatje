import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Package, TrendingDown } from "lucide-react";
import { useBusinessExpenses, CATEGORIES, FREQUENCIES, type BusinessExpense } from "@/hooks/useBusinessExpenses";
import { toast } from "sonner";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const categoryLabels: Record<string, string> = {
  software: "Software", marketing: "Marketing", kantoor: "Kantoor",
  huisvesting: "Huisvesting", verzekering: "Verzekering", overig: "Overig",
};

const frequencyLabels: Record<string, string> = {
  maandelijks: "Maandelijks", jaarlijks: "Jaarlijks", eenmalig: "Eenmalig",
};

const emptyExpense = (year: number): BusinessExpense => ({
  year, name: "", category: "overig", frequency: "maandelijks", amount: 0, is_active: true, notes: null,
});

export default function BusinessExpensesPage() {
  const [year, setYear] = useState(currentYear);
  const { expenses, loading, saving, save, remove, annualTotal } = useBusinessExpenses(year);
  const [editing, setEditing] = useState<BusinessExpense | null>(null);

  const handleSave = async () => {
    if (!editing || !editing.name.trim()) { toast.error("Vul een naam in"); return; }
    await save(editing);
    setEditing(null);
    toast.success("Kosten opgeslagen");
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bedrijfskosten</h1>
          <p className="text-sm text-muted-foreground mt-1">Beheer terugkerende en eenmalige zakelijke kosten.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" onClick={() => setEditing(emptyExpense(year))}>
            <Plus className="mr-1.5 h-4 w-4" /> Toevoegen
          </Button>
        </div>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: <Package className="h-5 w-5 text-primary" />, label: "Aantal posten", value: expenses.filter(e => e.is_active).length, bg: "bg-primary/10" },
          { icon: <TrendingDown className="h-5 w-5 text-destructive" />, label: "Jaarlijks totaal", value: fmt(annualTotal), bg: "bg-destructive/10" },
          { icon: <TrendingDown className="h-5 w-5 text-muted-foreground" />, label: "Gem. per maand", value: fmt(annualTotal / 12), bg: "bg-muted" },
        ].map((kpi, i) => (
          <motion.div key={i} variants={cardVariant}>
            <Card className="arcory-glass">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.bg}`}>{kpi.icon}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-xl font-semibold tabular-nums">{kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {editing && (
        <motion.div variants={cardVariant} initial="initial" animate="animate">
          <Card className="arcory-glass border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{editing.id ? "Bewerk kostenpost" : "Nieuwe kostenpost"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Naam</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="bijv. Adobe Creative Cloud" />
                </div>
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frequentie</Label>
                  <Select value={editing.frequency} onValueChange={(v) => setEditing({ ...editing, frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{frequencyLabels[f]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bedrag (€)</Label>
                  <Input type="number" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label className="text-sm">Actief</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} size="sm"><Save className="mr-1.5 h-4 w-4" /> Opslaan</Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Annuleren</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kostenposten {year}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Laden...</p>
            ) : expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen kosten gevonden voor {year}.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((e) => (
                  <div key={e.id} className={`flex items-center justify-between rounded-lg border border-border/50 p-3 ${e.is_active ? "" : "opacity-50"}`}>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium">{e.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">{categoryLabels[e.category] || e.category}</Badge>
                          <span className="text-xs text-muted-foreground">{frequencyLabels[e.frequency]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {fmt(e.amount)}{e.frequency === "maandelijks" ? "/mnd" : e.frequency === "jaarlijks" ? "/jr" : ""}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(e)}><Save className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => e.id && remove(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
