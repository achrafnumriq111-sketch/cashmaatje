import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, Home, Baby, GraduationCap, ExternalLink, Save, Info, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBenefitsProfile, profileToInput } from "@/hooks/useBenefitsProfile";
import { useTaxDeductions } from "@/hooks/useTaxDeductions";
import { calcAllBenefits, type BenefitResult } from "@/lib/benefits/calculations";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const currentYear = new Date().getFullYear();

function StatusBadge({ result }: { result: BenefitResult }) {
  if (!result.eligible) {
    return (
      <Badge variant="outline" className="gap-1 border-muted-foreground/30 text-muted-foreground">
        <AlertCircle className="h-3 w-3" /> Geen recht
      </Badge>
    );
  }
  if (result.monthly < 50) {
    return (
      <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400">
        <Info className="h-3 w-3" /> Beperkt recht
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
      <CheckCircle2 className="h-3 w-3" /> Recht
    </Badge>
  );
}

function BenefitCard({
  title,
  description,
  icon,
  result,
  applyUrl,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  result: BenefitResult;
  applyUrl: string;
}) {
  return (
    <Card className="arcory-glass">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">{icon}</div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>
          <StatusBadge result={result} />
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold tabular-nums">{fmt(result.monthly)}</p>
          <span className="text-xs text-muted-foreground">/ mnd</span>
          <span className="text-xs text-muted-foreground ml-auto">{fmt(result.yearly)} / jr</span>
        </div>
        {result.reason && <p className="text-xs text-muted-foreground italic">{result.reason}</p>}
        {result.details && result.details.length > 0 && (
          <div className="space-y-1 text-xs text-muted-foreground border-l-2 border-border pl-3">
            {result.details.map((d, i) => (
              <p key={i}>{d}</p>
            ))}
          </div>
        )}
        <Button asChild variant="outline" size="sm" className="w-full">
          <a href={applyUrl} target="_blank" rel="noopener noreferrer">
            Aanvragen op toeslagen.nl <ExternalLink className="h-3 w-3 ml-1.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Benefits() {
  const { profile, setProfile, save, loading, saving } = useBenefitsProfile();
  const { taxableProfit } = useTaxDeductions(currentYear);
  const { toast } = useToast();

  const input = useMemo(
    () => profileToInput(profile, Math.max(0, taxableProfit), currentYear),
    [profile, taxableProfit]
  );
  const results = useMemo(() => calcAllBenefits(input), [input]);
  const totalMonthly =
    results.zorgtoeslag.monthly +
    results.huurtoeslag.monthly +
    results.kinderopvangtoeslag.monthly +
    results.kindgebondenBudget.monthly;

  const updateChildAge = (idx: number, age: number) => {
    const ages = [...profile.children_ages];
    ages[idx] = age;
    setProfile({ ...profile, children_ages: ages });
  };

  const setNumChildren = (n: number) => {
    const ages = [...profile.children_ages];
    while (ages.length < n) ages.push(5);
    ages.length = n;
    setProfile({ ...profile, num_children: n, children_ages: ages });
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Toeslagen-check</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bereken indicatief op welke toeslagen jij persoonlijk recht hebt — op basis van je winst en gezinssituatie.
          </p>
        </div>
        <Button onClick={() => save(profile)} disabled={saving}>
          <Save className="h-4 w-4 mr-1.5" /> {saving ? "Opslaan…" : "Opslaan"}
        </Button>
      </motion.div>

      <motion.div variants={cardVariant}>
        <Card className="arcory-glass border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Indicatief totaal aan toeslagen</p>
                <p className="text-3xl font-semibold tabular-nums text-primary">{fmt(totalMonthly)}<span className="text-base text-muted-foreground font-normal"> / mnd</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Toetsingsinkomen</p>
                <p className="text-lg font-medium tabular-nums">{fmt(input.income + (input.hasPartner ? input.partnerIncome : 0))}</p>
                <p className="text-xs text-muted-foreground">incl. partner</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="profile">Mijn gegevens</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 md:grid-cols-2">
            <motion.div variants={cardVariant}>
              <BenefitCard
                title="Zorgtoeslag"
                description="Tegemoetkoming in zorgverzekering"
                icon={<Heart className="h-5 w-5 text-primary" />}
                result={results.zorgtoeslag}
                applyUrl="https://www.belastingdienst.nl/wps/wcm/connect/nl/zorgtoeslag/zorgtoeslag"
              />
            </motion.div>
            <motion.div variants={cardVariant}>
              <BenefitCard
                title="Huurtoeslag"
                description="Sociale & vrije sector huur"
                icon={<Home className="h-5 w-5 text-primary" />}
                result={results.huurtoeslag}
                applyUrl="https://www.belastingdienst.nl/wps/wcm/connect/nl/huurtoeslag/huurtoeslag"
              />
            </motion.div>
            <motion.div variants={cardVariant}>
              <BenefitCard
                title="Kinderopvangtoeslag"
                description="Vergoeding kinderopvangkosten"
                icon={<Baby className="h-5 w-5 text-primary" />}
                result={results.kinderopvangtoeslag}
                applyUrl="https://www.belastingdienst.nl/wps/wcm/connect/nl/kinderopvangtoeslag/kinderopvangtoeslag"
              />
            </motion.div>
            <motion.div variants={cardVariant}>
              <BenefitCard
                title="Kindgebonden budget"
                description="Bijdrage aan opvoedkosten"
                icon={<GraduationCap className="h-5 w-5 text-primary" />}
                result={results.kindgebondenBudget}
                applyUrl="https://www.belastingdienst.nl/wps/wcm/connect/nl/kindgebonden-budget/kindgebonden-budget"
              />
            </motion.div>
          </motion.div>

          <Card className="arcory-glass">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Disclaimer:</strong> dit is een indicatieve berekening op basis van regels 2026.
                Definitieve toekenning loopt altijd via <a href="https://mijntoeslagen.nl" className="underline" target="_blank" rel="noopener noreferrer">mijntoeslagen.nl</a>.
                Toeslagen werken met je verzamelinkomen — niet alleen winst.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4 mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Laden…</p>
          ) : (
            <>
              <Card className="arcory-glass">
                <CardHeader className="pb-3"><CardTitle className="text-base">Inkomen & vermogen</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="flex items-center gap-1.5">
                        Mijn jaarinkomen
                        <TooltipProvider><Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent>Standaard wordt belastbare winst gebruikt ({fmt(Math.max(0, taxableProfit))}). Vul hier handmatig in om te overschrijven.</TooltipContent>
                        </Tooltip></TooltipProvider>
                      </Label>
                      <Input type="number" placeholder={fmt(Math.max(0, taxableProfit))} value={profile.income_override ?? ""} onChange={(e) => setProfile({ ...profile, income_override: e.target.value === "" ? null : Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Geboortejaar</Label>
                      <Input type="number" value={profile.birth_year ?? ""} onChange={(e) => setProfile({ ...profile, birth_year: Number(e.target.value) || null })} placeholder="1990" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Eigen vermogen (spaar + beleggingen)</Label>
                      <Input type="number" value={profile.total_assets} onChange={(e) => setProfile({ ...profile, total_assets: Number(e.target.value) })} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="arcory-glass">
                <CardHeader className="pb-3"><CardTitle className="text-base">Partner</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={profile.has_partner} onCheckedChange={(v) => setProfile({ ...profile, has_partner: v })} />
                    <Label className="font-normal">Ik heb een toeslagpartner</Label>
                  </div>
                  {profile.has_partner && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Geboortejaar partner</Label>
                        <Input type="number" value={profile.partner_birth_year ?? ""} onChange={(e) => setProfile({ ...profile, partner_birth_year: Number(e.target.value) || null })} />
                      </div>
                      <div>
                        <Label>Jaarinkomen partner</Label>
                        <Input type="number" value={profile.partner_yearly_income} onChange={(e) => setProfile({ ...profile, partner_yearly_income: Number(e.target.value) })} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="arcory-glass">
                <CardHeader className="pb-3"><CardTitle className="text-base">Wonen</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Type woonsituatie</Label>
                    <Select value={profile.rent_type} onValueChange={(v: any) => setProfile({ ...profile, rent_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Koophuis / geen huur</SelectItem>
                        <SelectItem value="social">Sociale huur</SelectItem>
                        <SelectItem value="private">Vrije sector huur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {profile.rent_type !== "none" && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Kale huur per maand</Label>
                        <Input type="number" value={profile.monthly_rent} onChange={(e) => setProfile({ ...profile, monthly_rent: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Servicekosten per maand</Label>
                        <Input type="number" value={profile.monthly_service_costs} onChange={(e) => setProfile({ ...profile, monthly_service_costs: Number(e.target.value) })} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="arcory-glass">
                <CardHeader className="pb-3"><CardTitle className="text-base">Kinderen</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Aantal kinderen</Label>
                    <Input type="number" min={0} max={10} value={profile.num_children} onChange={(e) => setNumChildren(Math.max(0, Math.min(10, Number(e.target.value))))} />
                  </div>
                  {profile.num_children > 0 && (
                    <div>
                      <Label className="mb-2 block">Leeftijden van kinderen</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Array.from({ length: profile.num_children }).map((_, i) => (
                          <div key={i}>
                            <Label className="text-xs text-muted-foreground">Kind {i + 1}</Label>
                            <Input type="number" min={0} max={25} value={profile.children_ages[i] ?? 5} onChange={(e) => updateChildAge(i, Number(e.target.value))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Switch checked={profile.has_childcare} onCheckedChange={(v) => setProfile({ ...profile, has_childcare: v })} />
                    <Label className="font-normal">Ik gebruik kinderopvang</Label>
                  </div>
                  {profile.has_childcare && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Uren opvang per maand</Label>
                        <Input type="number" value={profile.childcare_hours_per_month} onChange={(e) => setProfile({ ...profile, childcare_hours_per_month: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Uurtarief opvang</Label>
                        <Input type="number" step="0.01" value={profile.childcare_hourly_rate} onChange={(e) => setProfile({ ...profile, childcare_hourly_rate: Number(e.target.value) })} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={async () => { await save(profile); toast({ title: "Opgeslagen", description: "Berekeningen bijgewerkt." }); }} disabled={saving}>
                  <Save className="h-4 w-4 mr-1.5" /> Opslaan
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
