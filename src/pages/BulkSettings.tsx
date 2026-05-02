import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Layers, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { pageTransition, cardVariant } from "@/lib/animations";

interface OrgRow {
  id: string;
  name: string;
  vat_frequency: string;
  vat_scheme: string;
  org_type: string;
  fiscal_year_start_month?: number;
  kor_eligible?: boolean;
}

export default function BulkSettings() {
  const { memberships } = useOrganization();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [vatFreq, setVatFreq] = useState<string>("");
  const [vatScheme, setVatScheme] = useState<string>("");
  const [fiscalMonth, setFiscalMonth] = useState<string>("");
  const [korEligible, setKorEligible] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ids = memberships.map((m) => m.organizationId);
    if (!ids.length) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from("organizations")
      .select("id, name, vat_frequency, vat_scheme, org_type, fiscal_year_start_month, kor_eligible")
      .in("id", ids)
      .then(({ data, error }) => {
        if (error) toast.error("Kon entiteiten niet laden");
        else setOrgs((data as OrgRow[]) ?? []);
        setLoading(false);
      });
  }, [memberships]);

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === orgs.length) setSelected(new Set());
    else setSelected(new Set(orgs.map((o) => o.id)));
  };

  const handleApply = async () => {
    if (!selected.size) { toast.info("Selecteer minimaal 1 entiteit"); return; }
    if (!vatFreq && !vatScheme && !fiscalMonth && !korEligible) {
      toast.info("Kies minimaal 1 instelling om toe te passen"); return;
    }
    setSaving(true);
    const updates: Record<string, any> = {};
    if (vatFreq) updates.vat_frequency = vatFreq;
    if (vatScheme) updates.vat_scheme = vatScheme;
    if (fiscalMonth) updates.fiscal_year_start_month = Number(fiscalMonth);
    if (korEligible) updates.kor_eligible = korEligible === "true";
    const { error } = await supabase
      .from("organizations")
      .update(updates as never)
      .in("id", Array.from(selected));
    setSaving(false);
    if (error) { toast.error("Bulk-update mislukt: " + error.message); return; }
    toast.success(`Toegepast op ${selected.size} entiteiten`);
    // Refetch
    const ids = memberships.map((m) => m.organizationId);
    const { data } = await supabase.from("organizations").select("id, name, vat_frequency, vat_scheme, org_type, fiscal_year_start_month, kor_eligible").in("id", ids);
    setOrgs((data as OrgRow[]) ?? []);
    setSelected(new Set());
    setVatFreq(""); setVatScheme(""); setFiscalMonth(""); setKorEligible("");
  };

  const freqLabel = (f: string) => ({ monthly: "Maandelijks", quarterly: "Kwartaal", yearly: "Jaarlijks" }[f] ?? f);
  const schemeLabel = (s: string) => ({ standard: "Standaard", kor: "KOR" }[s] ?? s);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-4 max-w-5xl">
      <motion.div variants={cardVariant} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bulk instellingen</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Pas instellingen tegelijk toe op meerdere entiteiten — BTW, boekjaar en KOR.
          </p>
        </div>
        <Button onClick={handleApply} disabled={saving || !selected.size} size="sm">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          Toepassen op {selected.size}
        </Button>
      </motion.div>

      <motion.div variants={cardVariant}>
        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">Instellingen</TabsTrigger>
            <TabsTrigger value="overview">Overzicht</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">1. Selecteer entiteiten</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={toggleAll}
                      className="text-xs text-primary hover:underline mb-2"
                    >
                      {selected.size === orgs.length ? "Alles deselecteren" : "Alles selecteren"}
                    </button>
                    {orgs.map((o) => (
                      <label
                        key={o.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/40 cursor-pointer"
                      >
                        <Checkbox
                          checked={selected.has(o.id)}
                          onCheckedChange={() => toggle(o.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{o.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {o.org_type} · BTW {freqLabel(o.vat_frequency)} · {schemeLabel(o.vat_scheme)}
                            {o.fiscal_year_start_month && o.fiscal_year_start_month !== 1 ? ` · FY-start mnd ${o.fiscal_year_start_month}` : ""}
                            {o.kor_eligible ? " · KOR" : ""}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Kies instellingen om toe te passen</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">BTW-aangifte frequentie</Label>
                  <Select value={vatFreq} onValueChange={setVatFreq}>
                    <SelectTrigger><SelectValue placeholder="— niet wijzigen —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Maandelijks</SelectItem>
                      <SelectItem value="quarterly">Kwartaal</SelectItem>
                      <SelectItem value="yearly">Jaarlijks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">BTW regeling</Label>
                  <Select value={vatScheme} onValueChange={setVatScheme}>
                    <SelectTrigger><SelectValue placeholder="— niet wijzigen —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standaard</SelectItem>
                      <SelectItem value="kor">KOR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Boekjaar startmaand</Label>
                  <Select value={fiscalMonth} onValueChange={setFiscalMonth}>
                    <SelectTrigger><SelectValue placeholder="— niet wijzigen —" /></SelectTrigger>
                    <SelectContent>
                      {["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"].map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">KOR eligible</Label>
                  <Select value={korEligible} onValueChange={setKorEligible}>
                    <SelectTrigger><SelectValue placeholder="— niet wijzigen —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ja, in aanmerking</SelectItem>
                      <SelectItem value="false">Nee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              {selected.size} van {orgs.length} entiteiten geselecteerd — gebruik de <strong>Toepassen</strong>-knop bovenaan.
            </p>
          </TabsContent>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Alle entiteiten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orgs.map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-3 rounded-md border border-border">
                      <div>
                        <p className="text-sm font-medium">{o.name}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{o.org_type}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-[10px]">{freqLabel(o.vat_frequency)}</Badge>
                        <Badge variant="outline" className="text-[10px]">{schemeLabel(o.vat_scheme)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
