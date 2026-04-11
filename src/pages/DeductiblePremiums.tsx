import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Shield, Heart } from "lucide-react";
import { useDeductiblePremiums, type DeductiblePremium } from "@/hooks/useDeductiblePremiums";
import { toast } from "sonner";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const typeLabels: Record<string, string> = {
  aov: "AOV (Arbeidsongeschiktheid)",
  lijfrente: "Lijfrente / Pensioen",
};

const emptyPremium = (year: number): DeductiblePremium => ({
  year,
  premium_type: "aov",
  name: "",
  amount: 0,
  is_active: true,
  notes: null,
});

export default function DeductiblePremiumsPage() {
  const [year, setYear] = useState(currentYear);
  const { premiums, loading, saving, save, remove, annualTotal } = useDeductiblePremiums(year);
  const [editing, setEditing] = useState<DeductiblePremium | null>(null);

  const handleSave = async () => {
    if (!editing || !editing.name.trim()) {
      toast.error("Vul een naam in");
      return;
    }
    await save(editing);
    setEditing(null);
    toast.success("Premie opgeslagen");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Aftrekbare premies</h1>
          <p className="text-sm text-muted-foreground mt-1">Voer AOV- en lijfrentepremies in voor automatische verwerking.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setEditing(emptyPremium(year))}>
            <Plus className="mr-1.5 h-4 w-4" /> Toevoegen
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">AOV totaal</p>
                <p className="text-xl font-semibold tabular-nums">
                  {fmt(premiums.filter(p => p.is_active && p.premium_type === "aov").reduce((s, p) => s + p.amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lijfrente totaal</p>
                <p className="text-xl font-semibold tabular-nums">
                  {fmt(premiums.filter(p => p.is_active && p.premium_type === "lijfrente").reduce((s, p) => s + p.amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {editing && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editing.id ? "Bewerk premie" : "Nieuwe premie"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Naam</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="bijv. AOV bij Movir" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editing.premium_type} onValueChange={(v) => setEditing({ ...editing, premium_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aov">AOV</SelectItem>
                    <SelectItem value="lijfrente">Lijfrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jaarbedrag (€)</Label>
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
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Premies {year}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Laden...</p>
          ) : premiums.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen premies gevonden voor {year}.</p>
          ) : (
            <div className="space-y-2">
              {premiums.map((p) => (
                <div key={p.id} className={`flex items-center justify-between rounded-lg border p-3 ${p.is_active ? "" : "opacity-50"}`}>
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <Badge variant="outline" className="text-xs mt-0.5">{typeLabels[p.premium_type] || p.premium_type}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium tabular-nums">{fmt(p.amount)}/jr</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(p)}>
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => p.id && remove(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
