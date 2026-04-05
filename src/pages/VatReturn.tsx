import { useVatReturn, VatBoxValues } from "@/hooks/useVatReturn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, FileText, Loader2, Lock, Send, Save } from "lucide-react";
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

export default function VatReturn() {
  const {
    year, setYear, periodNumber, setPeriodNumber, vatFrequency,
    boxes, updateBox, vatReturn, drillBox, drillLines, drillInto, setDrillBox,
    warnings, loading, saving, saveAsDraft, submitReview, submitFiling, isLocked,
  } = useVatReturn();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const periods = vatFrequency === "quarterly"
    ? [{ v: 1, l: "Q1 (jan-mrt)" }, { v: 2, l: "Q2 (apr-jun)" }, { v: 3, l: "Q3 (jul-sep)" }, { v: 4, l: "Q4 (okt-dec)" }]
    : Array.from({ length: 12 }, (_, i) => ({
        v: i + 1,
        l: new Date(2000, i).toLocaleString("nl-NL", { month: "long" }),
      }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">BTW-aangifte</h1>
          <p className="text-sm text-muted-foreground">Bereken en dien uw omzetbelasting aangifte in</p>
        </div>
        {vatReturn && statusBadge(vatReturn.status)}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-0">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Aangifte omzetbelasting</CardTitle>
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

                <RubriekSection title="Rubriek 1 — Leveringen/diensten binnenland" rows={rubriek1} boxes={boxes} isLocked={isLocked} onUpdate={updateBox} onDrill={drillInto} />
                <RubriekSection title="Rubriek 2 — Verleggingsregelingen binnenland" rows={rubriek2} boxes={boxes} isLocked={isLocked} onUpdate={updateBox} onDrill={drillInto} />
                <RubriekSection title="Rubriek 3 — Leveringen naar het buitenland" rows={rubriek3} boxes={boxes} isLocked={isLocked} onUpdate={updateBox} onDrill={drillInto} />
                <RubriekSection title="Rubriek 4 — Leveringen vanuit het buitenland" rows={rubriek4} boxes={boxes} isLocked={isLocked} onUpdate={updateBox} onDrill={drillInto} />
                <RubriekSection title="Rubriek 5 — Voorbelasting en totaal" rows={rubriek5} boxes={boxes} isLocked={isLocked} onUpdate={updateBox} onDrill={drillInto} />
              </CardContent>
            </Card>

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

          {/* Sidebar: drill-down + warnings */}
          <div className="space-y-4">
            {/* Warnings */}
            {warnings.length > 0 && (
              <Card className="border-destructive/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Waarschuwingen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {warnings.map((w, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
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
                    <CardTitle className="text-sm">
                      Detail rubriek <span className="font-mono">{drillBox}</span>
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setDrillBox(null)}>Sluiten</Button>
                  </div>
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
      )}
    </div>
  );
}
