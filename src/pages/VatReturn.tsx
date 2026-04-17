import { useEffect, useState } from "react";
import { useVatReturn, VatBoxValues } from "@/hooks/useVatReturn";
import { useVatEngine } from "@/hooks/useVatEngine";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, CheckCircle2, FileText, Loader2, Lock, Send, Save,
  Download, Info, ShieldAlert, TrendingUp, Eye, ArrowDown, ArrowUp, Minus, Building,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(v);

const fmtPlain = (v: number) =>
  new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

type BoxKey = keyof VatBoxValues;

interface RowDef {
  code: string;
  label: string;
  baseKey?: BoxKey;
  vatKey?: BoxKey;
  autoCalc?: boolean;
  highlight?: boolean;
}

const rubriek1: RowDef[] = [
  { code: "1a", label: "Leveringen/diensten belast met hoog tarief", baseKey: "box_1a_base", vatKey: "box_1a_vat" },
  { code: "1b", label: "Leveringen/diensten belast met laag tarief", baseKey: "box_1b_base", vatKey: "box_1b_vat" },
  { code: "1c", label: "Leveringen/diensten belast met overige tarieven", baseKey: "box_1c_base", vatKey: "box_1c_vat" },
  { code: "1d", label: "Privégebruik", baseKey: "box_1d_base", vatKey: "box_1d_vat" },
  { code: "1e", label: "Leveringen/diensten belast met verlegd", baseKey: "box_1e_base", vatKey: "box_1e_vat" },
];

const rubriek2: RowDef[] = [
  { code: "2a", label: "Leveringen/diensten waarbij heffing verlegd", baseKey: "box_2a_base", vatKey: "box_2a_vat" },
];

const rubriek3: RowDef[] = [
  { code: "3a", label: "Leveringen naar landen buiten de EU", baseKey: "box_3a_base" },
  { code: "3b", label: "Leveringen/diensten naar EU-landen", baseKey: "box_3b_base" },
  { code: "3c", label: "Installatie/afstandsverkopen", baseKey: "box_3c_base" },
];

const rubriek4: RowDef[] = [
  { code: "4a", label: "Leveringen uit landen buiten de EU", baseKey: "box_4a_base", vatKey: "box_4a_vat" },
  { code: "4b", label: "Leveringen uit EU-landen", baseKey: "box_4b_base", vatKey: "box_4b_vat" },
];

const rubriek5: RowDef[] = [
  { code: "5a", label: "Verschuldigde omzetbelasting", vatKey: "box_5a_vat", autoCalc: true },
  { code: "5b", label: "Voorbelasting", vatKey: "box_5b_vat" },
  { code: "5c", label: "Subtotaal", vatKey: "box_5c_vat", autoCalc: true },
  { code: "5d", label: "Vermindering KOR", vatKey: "box_5d_vat" },
  { code: "5e", label: "Schatting vorige aangiften", vatKey: "box_5e_vat" },
  { code: "5f", label: "Totaal", vatKey: "box_5f_vat", autoCalc: true, highlight: true },
];

function BoxInput({ value, disabled, onChange }: { value: number; disabled: boolean; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      step="0.01"
      disabled={disabled}
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-28 rounded-md border border-input bg-background px-2 py-1 text-right text-sm font-mono disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

function RubriekSection({
  title, rows, boxes, isLocked, onUpdate, onDrill,
}: {
  title: string;
  rows: RowDef[];
  boxes: VatBoxValues;
  isLocked: boolean;
  onUpdate: (k: BoxKey, v: number) => void;
  onDrill: (box: string) => void;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-4 pb-1">{title}</h3>
      {rows.map((r) => {
        const is5f = r.highlight;
        const totalVal = r.vatKey ? boxes[r.vatKey] : 0;
        return (
          <div
            key={r.code}
            className={cn(
              "grid grid-cols-[3rem_1fr_8rem_8rem] items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted/30 cursor-pointer transition-colors",
              is5f && "bg-muted/50 border border-border mt-2"
            )}
            onClick={() => onDrill(r.code)}
          >
            <span className="text-xs font-mono font-semibold text-muted-foreground">{r.code}</span>
            <span className={cn("text-sm", is5f && "font-semibold")}>{r.label}</span>
            {r.baseKey ? (
              <BoxInput value={boxes[r.baseKey]} disabled={isLocked || !!r.autoCalc} onChange={(v) => onUpdate(r.baseKey!, v)} />
            ) : (
              <span />
            )}
            {r.vatKey ? (
              r.autoCalc || is5f ? (
                <span className={cn(
                  "text-right text-sm font-mono pr-2",
                  is5f && (totalVal >= 0 ? "text-destructive font-bold text-base" : "text-primary font-bold text-base")
                )}>
                  {is5f ? fmt(totalVal) : fmtPlain(totalVal)}
                </span>
              ) : (
                <BoxInput value={boxes[r.vatKey]} disabled={isLocked} onChange={(v) => onUpdate(r.vatKey!, v)} />
              )
            ) : (
              <span />
            )}
          </div>
        );
      })}
    </div>
  );
}

const statusBadge = (s: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    draft: { label: "Concept", variant: "secondary" },
    reviewed: { label: "Gecontroleerd", variant: "outline" },
    filed: { label: "Ingediend", variant: "default" },
  };
  const m = map[s] ?? { label: s, variant: "secondary" as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
};

function getPeriodLabel(year: number, periodNumber: number, vatFrequency: string) {
  if (vatFrequency === "quarterly") {
    const qLabels = ["jan – mrt", "apr – jun", "jul – sep", "okt – dec"];
    return `Q${periodNumber} ${year} (${qLabels[periodNumber - 1]})`;
  }
  const month = new Date(2000, periodNumber - 1).toLocaleString("nl-NL", { month: "long" });
  return `${month} ${year}`;
}

export default function VatReturn() {
  const {
    year, setYear, periodNumber, setPeriodNumber, vatFrequency,
    boxes, updateBox, vatReturn, drillBox, drillLines, drillInto, setDrillBox,
    warnings, loading, saving, saveAsDraft, submitReview, submitFiling, isLocked,
  } = useVatReturn();

  const vatEngine = useVatEngine();
  const { membership } = useOrganization();
  const [orgType, setOrgType] = useState<string>("");
  const [vpbEnabled, setVpbEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (!membership) return;
    supabase
      .from("organizations")
      .select("org_type, settings")
      .eq("id", membership.organizationId)
      .single()
      .then(({ data }) => {
        if (data) {
          setOrgType(data.org_type as string);
          const s = (data.settings as Record<string, unknown>) ?? {};
          setVpbEnabled(!!s.vpb_enabled || ["bv", "nv"].includes(data.org_type as string));
        }
      });
  }, [membership]);

  const toggleVpb = async () => {
    if (!membership) return;
    const next = !vpbEnabled;
    setVpbEnabled(next);
    const { data: row } = await supabase.from("organizations").select("settings").eq("id", membership.organizationId).single();
    const s = (row?.settings as Record<string, unknown>) ?? {};
    await supabase
      .from("organizations")
      .update({ settings: { ...s, vpb_enabled: next } as never })
      .eq("id", membership.organizationId);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const periods = vatFrequency === "quarterly"
    ? [{ v: 1, l: "Q1 (jan-mrt)" }, { v: 2, l: "Q2 (apr-jun)" }, { v: 3, l: "Q3 (jul-sep)" }, { v: 4, l: "Q4 (okt-dec)" }]
    : Array.from({ length: 12 }, (_, i) => ({
        v: i + 1,
        l: new Date(2000, i).toLocaleString("nl-NL", { month: "long" }),
      }));

  const periodLabel = getPeriodLabel(year, periodNumber, vatFrequency);

  // Export as JSON (Belastingdienst-ready structure)
  const handleExportJson = () => {
    const periodStart = vatFrequency === "quarterly"
      ? `${year}-${String((periodNumber - 1) * 3 + 1).padStart(2, "0")}-01`
      : `${year}-${String(periodNumber).padStart(2, "0")}-01`;

    const exportData = {
      vat_return: {
        year,
        period: vatFrequency === "quarterly" ? `Q${periodNumber}` : `M${periodNumber}`,
        period_type: vatFrequency,
        start_date: periodStart,
        status: vatReturn?.status ?? "draft",
        generated_at: new Date().toISOString(),
        boxes: {
          "1a": { revenue: boxes.box_1a_base, vat: boxes.box_1a_vat },
          "1b": { revenue: boxes.box_1b_base, vat: boxes.box_1b_vat },
          "1c": { revenue: boxes.box_1c_base, vat: boxes.box_1c_vat },
          "1d": { revenue: boxes.box_1d_base, vat: boxes.box_1d_vat },
          "1e": { revenue: boxes.box_1e_base, vat: boxes.box_1e_vat },
          "2a": { revenue: boxes.box_2a_base, vat: boxes.box_2a_vat },
          "3a": { revenue: boxes.box_3a_base },
          "3b": { revenue: boxes.box_3b_base },
          "3c": { revenue: boxes.box_3c_base },
          "4a": { revenue: boxes.box_4a_base, vat: boxes.box_4a_vat },
          "4b": { revenue: boxes.box_4b_base, vat: boxes.box_4b_vat },
          "5a": { vat: boxes.box_5a_vat },
          "5b": { vat: boxes.box_5b_vat },
          "5c": { vat: boxes.box_5c_vat },
          "5d": { vat: boxes.box_5d_vat },
          "5e": { vat: boxes.box_5e_vat },
          "5f": { vat: boxes.box_5f_vat },
        },
        totals: {
          total_output_vat: boxes.box_5a_vat,
          total_input_vat: boxes.box_5b_vat,
          net_vat_payable: boxes.box_5f_vat,
        },
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `btw-aangifte-${year}-${vatFrequency === "quarterly" ? `Q${periodNumber}` : `M${periodNumber}`}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Risk insights from VAT engine
  const riskData = vatEngine.data;
  const riskLevel = riskData?.riskLevel ?? "low";
  const riskColor = riskLevel === "high" ? "text-destructive" : riskLevel === "medium" ? "text-yellow-500" : "text-primary";
  const riskIcon = riskLevel === "high" ? ShieldAlert : riskLevel === "medium" ? AlertTriangle : CheckCircle2;
  const RiskIcon = riskIcon;

  // Summary bridge
  const outputVat = boxes.box_5a_vat;
  const inputVat = boxes.box_5b_vat;
  const netVat = boxes.box_5f_vat;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">BTW-aangifte</h1>
          <p className="text-sm text-muted-foreground">
            {periodLabel} · Omzetbelasting
          </p>
        </div>
        <div className="flex items-center gap-2">
          {vatReturn && statusBadge(vatReturn.status)}
          <Button variant="outline" size="sm" onClick={handleExportJson}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-3">
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(periodNumber)} onValueChange={(v) => setPeriodNumber(Number(v))}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {periods.map((p) => <SelectItem key={p.v} value={String(p.v)}>{p.l}</SelectItem>)}
          </SelectContent>
        </Select>
        {isLocked && (
          <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" /> Vergrendeld</Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Summary bridge cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Verschuldigde BTW</p>
                    <p className="text-xl font-bold font-mono mt-1">{fmt(outputVat)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <ArrowUp className="h-5 w-5 text-destructive" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Rubrieken 1 + 2 + 4</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Voorbelasting</p>
                    <p className="text-xl font-bold font-mono mt-1">{fmt(inputVat)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowDown className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Rubriek 5b</p>
              </CardContent>
            </Card>

            <Card className={cn(
              "border-2",
              netVat > 0 ? "border-destructive/30" : netVat < 0 ? "border-primary/30" : "border-border"
            )}>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {netVat >= 0 ? "Te betalen" : "Te ontvangen"}
                    </p>
                    <p className={cn(
                      "text-xl font-bold font-mono mt-1",
                      netVat > 0 ? "text-destructive" : netVat < 0 ? "text-primary" : ""
                    )}>
                      {fmt(Math.abs(netVat))}
                    </p>
                  </div>
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    netVat > 0 ? "bg-destructive/10" : "bg-primary/10"
                  )}>
                    <Minus className={cn("h-5 w-5", netVat > 0 ? "text-destructive" : "text-primary")} />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">5a − 5b − KOR − correcties</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 space-y-0">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">Aangifte omzetbelasting</CardTitle>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Klik op een rubriek om de onderliggende boekingen te zien</p>
                </CardHeader>
                <CardContent className="space-y-0 pb-4">
                  {/* Column headers */}
                  <div className="grid grid-cols-[3rem_1fr_8rem_8rem] gap-2 px-3 pb-1 border-b border-border mb-1">
                    <span />
                    <span className="text-xs text-muted-foreground">Omschrijving</span>
                    <span className="text-xs text-muted-foreground text-right">Grondslag €</span>
                    <span className="text-xs text-muted-foreground text-right">BTW €</span>
                  </div>

                  <RubriekSection title="Rubriek 1 — Prestaties binnenland" rows={rubriek1} boxes={boxes} isLocked={isLocked} onUpdate={updateBox} onDrill={drillInto} />
                  <RubriekSection title="Rubriek 2 — Verleggingsregelingen binnenland" rows={rubriek2} boxes={boxes} isLocked={isLocked} onUpdate={updateBox} onDrill={drillInto} />
                  <RubriekSection title="Rubriek 3 — Leveringen naar het buitenland" rows={rubriek3} boxes={boxes} isLocked={isLocked} onUpdate={updateBox} onDrill={drillInto} />
                  <RubriekSection title="Rubriek 4 — Leveringen vanuit het buitenland" rows={rubriek4} boxes={boxes} isLocked={isLocked} onUpdate={updateBox} onDrill={drillInto} />
                  <RubriekSection title="Rubriek 5 — Voorbelasting en totaal" rows={rubriek5} boxes={boxes} isLocked={isLocked} onUpdate={updateBox} onDrill={drillInto} />
                </CardContent>
              </Card>

              {/* Audit note */}
              <div className="flex items-start gap-2 mt-3 px-1">
                <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Deze aangifte is automatisch berekend op basis van geboekte journaalposten in de geselecteerde periode.
                  Alle bedragen zijn herleidbaar naar brondocumenten en banktransacties.
                  {vatReturn?.reviewed_at && (
                    <> · Gecontroleerd op {new Date(vatReturn.reviewed_at).toLocaleDateString("nl-NL")}.</>
                  )}
                  {vatReturn?.filed_at && (
                    <> · Ingediend op {new Date(vatReturn.filed_at).toLocaleDateString("nl-NL")}.</>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <Button variant="outline" onClick={saveAsDraft} disabled={saving || isLocked}>
                  <Save className="h-4 w-4 mr-1" />
                  Opslaan als concept
                </Button>
                <Button variant="secondary" onClick={submitReview} disabled={saving || vatReturn?.status === "filed"}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Controleren
                </Button>
                <Button onClick={submitFiling} disabled={saving || !vatReturn || vatReturn.status === "filed"}>
                  <Send className="h-4 w-4 mr-1" />
                  Indienen
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Risk insights */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <RiskIcon className={cn("h-4 w-4", riskColor)} />
                    BTW Risico-analyse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Risico</span>
                    <Badge variant={riskLevel === "high" ? "destructive" : riskLevel === "medium" ? "secondary" : "outline"}>
                      {riskLevel === "high" ? "Hoog" : riskLevel === "medium" ? "Gemiddeld" : "Laag"}
                    </Badge>
                  </div>

                  {riskData && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Documenten verwerkt</span>
                          <span className="font-mono">{riskData.documentsProcessed}/{riskData.totalDocuments}</span>
                        </div>
                        {riskData.documentsInbox > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">In wachtrij</span>
                            <span className="font-mono text-yellow-500">{riskData.documentsInbox}</span>
                          </div>
                        )}
                      </div>

                      {riskData.riskReasons.length > 0 && (
                        <>
                          <Separator />
                          <ul className="space-y-1.5">
                            {riskData.riskReasons.map((r, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {riskData.quarterEstimate !== 0 && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" /> Kwartaalschatting
                            </span>
                            <span className="font-mono font-medium">{fmt(riskData.quarterEstimate)}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Warnings */}
              {warnings.length > 0 && (
                <Card className="border-destructive/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Waarschuwingen ({warnings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {warnings.map((w, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Drill-down */}
              {drillBox && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        Detail rubriek <span className="font-mono">{drillBox}</span>
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setDrillBox(null)}>Sluiten</Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {drillLines.length} journaalpost{drillLines.length !== 1 ? "en" : ""} gevonden
                    </p>
                  </CardHeader>
                  <CardContent>
                    {drillLines.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Geen boekingen gevonden voor deze rubriek.</p>
                    ) : (
                      <div className="max-h-80 overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Omschrijving</TableHead>
                              <TableHead className="text-xs text-right">Grondslag</TableHead>
                              <TableHead className="text-xs text-right">BTW</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {drillLines.map((l) => (
                              <TableRow key={l.id}>
                                <TableCell className="text-xs py-1.5">{l.description || "—"}</TableCell>
                                <TableCell className="text-xs text-right py-1.5 font-mono">{fmtPlain(l.base_amount)}</TableCell>
                                <TableCell className="text-xs text-right py-1.5 font-mono">{fmtPlain(l.vat_amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
