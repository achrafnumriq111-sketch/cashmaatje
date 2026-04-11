import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Calculator, TrendingDown } from "lucide-react";
import { useDepreciations, getAnnualDepreciation, getDepreciationForYear, type Depreciation } from "@/hooks/useDepreciations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const emptyItem = (): Depreciation => ({
  name: "",
  purchase_date: new Date().toISOString().split("T")[0],
  purchase_amount: 0,
  residual_value: 0,
  useful_life_years: 5,
  depreciation_method: "linear",
  notes: null,
});

export default function DepreciationsPage() {
  const [year, setYear] = useState(currentYear);
  const { items, loading, saving, save, remove, totalForYear } = useDepreciations();
  const [editing, setEditing] = useState<Depreciation | null>(null);

  const handleSave = async () => {
    if (!editing || !editing.name.trim()) {
      toast.error("Vul een naam in");
      return;
    }
    await save(editing);
    setEditing(null);
    toast.success("Afschrijving opgeslagen");
  };

  const yearTotal = totalForYear(year);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Afschrijvingen</h1>
          <p className="text-sm text-muted-foreground mt-1">Voeg investeringen toe — afschrijving wordt automatisch verdeeld.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setEditing(emptyItem())}>
            <Plus className="mr-1.5 h-4 w-4" /> Toevoegen
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aantal activa</p>
                <p className="text-xl font-semibold tabular-nums">{items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Afschrijving {year}</p>
                <p className="text-xl font-semibold tabular-nums">{fmt(yearTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Calculator className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Totale investering</p>
                <p className="text-xl font-semibold tabular-nums">{fmt(items.reduce((s, d) => s + d.purchase_amount, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit form */}
      {editing && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editing.id ? "Bewerk investering" : "Nieuwe investering"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Naam</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="bijv. MacBook Pro" />
              </div>
              <div className="space-y-2">
                <Label>Aankoopdatum</Label>
                <Input type="date" value={editing.purchase_date} onChange={(e) => setEditing({ ...editing, purchase_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Aanschafbedrag (€)</Label>
                <Input type="number" value={editing.purchase_amount} onChange={(e) => setEditing({ ...editing, purchase_amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Restwaarde (€)</Label>
                <Input type="number" value={editing.residual_value} onChange={(e) => setEditing({ ...editing, residual_value: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Looptijd (jaren)</Label>
                <Input type="number" min={1} value={editing.useful_life_years} onChange={(e) => setEditing({ ...editing, useful_life_years: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            {editing.purchase_amount > 0 && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  Jaarlijkse afschrijving: <span className="font-medium text-foreground">{fmt(getAnnualDepreciation(editing))}</span>
                  <span className="ml-2">({editing.useful_life_years} jaar)</span>
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                <Save className="mr-1.5 h-4 w-4" /> Opslaan
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Annuleren</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Investeringen</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Laden...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen investeringen gevonden.</p>
          ) : (
            <div className="space-y-2">
              {items.map((d) => {
                const yearAmount = getDepreciationForYear(d, year);
                const startYear = new Date(d.purchase_date).getFullYear();
                const endYear = startYear + d.useful_life_years - 1;
                return (
                  <div key={d.id} className={`flex items-center justify-between rounded-lg border p-3 ${yearAmount > 0 ? "" : "opacity-50"}`}>
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{fmt(d.purchase_amount)}</span>
                        <Badge variant="outline" className="text-xs">{startYear}–{endYear}</Badge>
                        {yearAmount > 0 && <Badge variant="secondary" className="text-xs">Actief in {year}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">{fmt(yearAmount)}/jr</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(d)}>
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => d.id && remove(d.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
