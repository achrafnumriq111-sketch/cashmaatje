import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, Car, Fuel, Wrench } from "lucide-react";
import { useCompanyCar, type CompanyCar } from "@/hooks/useCompanyCar";
import { toast } from "sonner";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const emptyCar = (year: number): CompanyCar => ({
  year,
  car_name: "",
  catalog_value: 0,
  addition_percentage: 22,
  use_km_allowance: false,
  km_per_year: 0,
  km_rate: 0.23,
  fixed_costs: 0,
  maintenance_costs: 0,
  fuel_costs: 0,
  is_active: true,
  notes: null,
});

export default function CompanyCarPage() {
  const [year, setYear] = useState(currentYear);
  const { cars, loading, saving, save, remove, totalBijtelling, totalCarCosts } = useCompanyCar(year);
  const [editing, setEditing] = useState<CompanyCar | null>(null);

  const handleSave = async () => {
    if (!editing || !editing.car_name.trim()) {
      toast.error("Vul een autonaam in");
      return;
    }
    await save(editing);
    setEditing(null);
    toast.success("Auto opgeslagen");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Auto van de zaak</h1>
          <p className="text-sm text-muted-foreground mt-1">Bijtelling of kilometervergoeding — zie het netto-effect direct.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setEditing(emptyCar(year))}>
            <Plus className="mr-1.5 h-4 w-4" /> Toevoegen
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bijtelling/jr</p>
                <p className="text-xl font-semibold tabular-nums">{fmt(totalBijtelling)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <Fuel className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Autokosten/jr</p>
                <p className="text-xl font-semibold tabular-nums">{fmt(totalCarCosts)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Wrench className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aantal auto's</p>
                <p className="text-xl font-semibold tabular-nums">{cars.filter(c => c.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {editing && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editing.id ? "Bewerk auto" : "Nieuwe auto"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Autonaam</Label>
                <Input value={editing.car_name} onChange={(e) => setEditing({ ...editing, car_name: e.target.value })} placeholder="bijv. Tesla Model 3" />
              </div>
              <div className="space-y-2">
                <Label>Cataloguswaarde (€)</Label>
                <Input type="number" value={editing.catalog_value} onChange={(e) => setEditing({ ...editing, catalog_value: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>

            <Separator />
            <div className="flex items-center gap-3">
              <Switch checked={editing.use_km_allowance} onCheckedChange={(v) => setEditing({ ...editing, use_km_allowance: v })} />
              <Label className="text-sm">{editing.use_km_allowance ? "Kilometervergoeding" : "Bijtelling"}</Label>
            </div>

            {!editing.use_km_allowance ? (
              <div className="space-y-2">
                <Label>Bijtelpercentage (%)</Label>
                <Input type="number" step="1" value={editing.addition_percentage} onChange={(e) => setEditing({ ...editing, addition_percentage: parseFloat(e.target.value) || 0 })} />
                <p className="text-xs text-muted-foreground">Bijtelling: {fmt(editing.catalog_value * (editing.addition_percentage / 100))}/jaar</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Km per jaar</Label>
                  <Input type="number" value={editing.km_per_year} onChange={(e) => setEditing({ ...editing, km_per_year: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Tarief per km (€)</Label>
                  <Input type="number" step="0.01" value={editing.km_rate} onChange={(e) => setEditing({ ...editing, km_rate: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            )}

            <Separator />
            <p className="text-sm font-medium">Autokosten</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Vaste lasten/jr (€)</Label>
                <Input type="number" value={editing.fixed_costs} onChange={(e) => setEditing({ ...editing, fixed_costs: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Onderhoud/jr (€)</Label>
                <Input type="number" value={editing.maintenance_costs} onChange={(e) => setEditing({ ...editing, maintenance_costs: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Brandstof/laden/jr (€)</Label>
                <Input type="number" value={editing.fuel_costs} onChange={(e) => setEditing({ ...editing, fuel_costs: parseFloat(e.target.value) || 0 })} />
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
          <CardTitle className="text-base">Auto's {year}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Laden...</p>
          ) : cars.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen auto's gevonden voor {year}.</p>
          ) : (
            <div className="space-y-2">
              {cars.map((c) => (
                <div key={c.id} className={`flex items-center justify-between rounded-lg border p-3 ${c.is_active ? "" : "opacity-50"}`}>
                  <div>
                    <p className="text-sm font-medium">{c.car_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {c.use_km_allowance ? `${c.km_per_year} km` : `${c.addition_percentage}% bijtelling`}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{fmt(c.catalog_value)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(c)}>
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => c.id && remove(c.id)}>
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
