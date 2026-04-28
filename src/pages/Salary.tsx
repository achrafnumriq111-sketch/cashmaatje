import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Users, Calendar, Trash2, Pencil, PlayCircle, CheckCircle2 } from "lucide-react";
import {
  useEmployees, useUpsertEmployee, useDeleteEmployee,
  usePayrollRuns, usePayrollLines, useGeneratePayrollRun, useFinalizePayrollRun,
  type Employee, calcPayrollLine,
} from "@/hooks/usePayroll";
import { pageTransition, cardVariant, staggerContainer } from "@/lib/animations";

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
const months = ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"];

const empty: Partial<Employee> = {
  full_name: "", email: "", bsn: "", iban: "", position: "", contract_type: "fulltime",
  hours_per_week: 40, gross_monthly: 0, vacation_pct: 8, payroll_tax_table: "wit", active: true,
};

export default function Salary() {
  const [tab, setTab] = useState("runs");
  const { data: employees = [] } = useEmployees();
  const { data: runs = [] } = usePayrollRuns();
  const upsertEmp = useUpsertEmployee();
  const delEmp = useDeleteEmployee();
  const generate = useGeneratePayrollRun();
  const finalize = useFinalizePayrollRun();

  const now = new Date();
  const [genYear, setGenYear] = useState(now.getFullYear());
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);

  const [editing, setEditing] = useState<Partial<Employee> | null>(null);
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const { data: lines = [] } = usePayrollLines(openRunId);

  const totalGross = employees.filter(e => e.active).reduce((s, e) => s + Number(e.gross_monthly), 0);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight">Salarisadministratie</h1>
        <p className="text-sm text-muted-foreground mt-1">Medewerkers, salarisruns en loonheffing — overzichtelijk in één plek.</p>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: <Users className="h-5 w-5 text-primary" />, label: "Actieve medewerkers", value: String(employees.filter(e=>e.active).length) },
          { icon: <Calendar className="h-5 w-5 text-primary" />, label: "Bruto/maand totaal", value: fmt(totalGross) },
          { icon: <CheckCircle2 className="h-5 w-5 text-primary" />, label: "Salarisruns", value: String(runs.length) },
        ].map((kpi, i) => (
          <motion.div key={i} variants={cardVariant}>
            <Card className="arcory-glass">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">{kpi.icon}</div>
                  <div><p className="text-xs text-muted-foreground">{kpi.label}</p><p className="text-lg font-semibold tabular-nums">{kpi.value}</p></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="runs">Salarisruns</TabsTrigger>
          <TabsTrigger value="employees">Medewerkers</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="space-y-4 mt-4">
          <Card className="arcory-glass">
            <CardHeader><CardTitle className="text-base">Nieuwe run genereren</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div>
                <Label>Maand</Label>
                <Select value={String(genMonth)} onValueChange={(v) => setGenMonth(Number(v))}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jaar</Label>
                <Input type="number" className="w-[100px]" value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} />
              </div>
              <Button onClick={() => generate.mutate({ year: genYear, month: genMonth })} disabled={generate.isPending} className="gap-2">
                <PlayCircle className="h-4 w-4" /> Genereer salarisrun
              </Button>
            </CardContent>
          </Card>

          <Card className="arcory-glass">
            <CardHeader><CardTitle className="text-base">Historie</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">Bruto</TableHead>
                    <TableHead className="text-right">Loonheffing</TableHead>
                    <TableHead className="text-right">Sociaal</TableHead>
                    <TableHead className="text-right">Netto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nog geen runs.</TableCell></TableRow>
                  ) : runs.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpenRunId(r.id)}>
                      <TableCell className="font-medium">{months[r.period_month - 1]} {r.period_year}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(Number(r.total_gross))}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(Number(r.total_tax))}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(Number(r.total_social))}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{fmt(Number(r.total_net))}</TableCell>
                      <TableCell><Badge variant="outline">{r.status === "finalized" ? "Definitief" : r.status === "paid" ? "Betaald" : "Concept"}</Badge></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {r.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={() => finalize.mutate(r.id)}>Definitief maken</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setEditing({ ...empty })} className="gap-2">
              <Plus className="h-4 w-4" /> Nieuwe medewerker
            </Button>
          </div>
          <Card className="arcory-glass">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Functie</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Bruto/mnd</TableHead>
                    <TableHead className="text-right">Netto (indic.)</TableHead>
                    <TableHead>Actief</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nog geen medewerkers.</TableCell></TableRow>
                  ) : employees.map((e) => {
                    const c = calcPayrollLine(e);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{e.position ?? "—"}</TableCell>
                        <TableCell><Badge variant="outline">{e.contract_type}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(Number(e.gross_monthly))}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(c.net)}</TableCell>
                        <TableCell>{e.active ? "Ja" : "Nee"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => setEditing(e)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { if (confirm("Verwijderen?")) delEmp.mutate(e.id); }}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Employee dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Medewerker bewerken" : "Nieuwe medewerker"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Volledige naam *</Label><Input value={editing.full_name ?? ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              <div><Label>Functie</Label><Input value={editing.position ?? ""} onChange={(e) => setEditing({ ...editing, position: e.target.value })} /></div>
              <div><Label>BSN</Label><Input value={editing.bsn ?? ""} onChange={(e) => setEditing({ ...editing, bsn: e.target.value })} /></div>
              <div><Label>IBAN</Label><Input value={editing.iban ?? ""} onChange={(e) => setEditing({ ...editing, iban: e.target.value })} /></div>
              <div>
                <Label>Contracttype</Label>
                <Select value={editing.contract_type ?? "fulltime"} onValueChange={(v) => setEditing({ ...editing, contract_type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fulltime">Fulltime</SelectItem>
                    <SelectItem value="parttime">Parttime</SelectItem>
                    <SelectItem value="freelance">Freelance/ZZP</SelectItem>
                    <SelectItem value="dga">DGA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Loonheffingstabel</Label>
                <Select value={editing.payroll_tax_table ?? "wit"} onValueChange={(v) => setEditing({ ...editing, payroll_tax_table: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wit">Wit (regulier)</SelectItem>
                    <SelectItem value="groen">Groen (uitkering)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Uren per week</Label><Input type="number" value={editing.hours_per_week ?? 40} onChange={(e) => setEditing({ ...editing, hours_per_week: Number(e.target.value) })} /></div>
              <div><Label>Bruto per maand</Label><Input type="number" value={editing.gross_monthly ?? 0} onChange={(e) => setEditing({ ...editing, gross_monthly: Number(e.target.value) })} /></div>
              <div><Label>Vakantiegeld %</Label><Input type="number" value={editing.vacation_pct ?? 8} onChange={(e) => setEditing({ ...editing, vacation_pct: Number(e.target.value) })} /></div>
              <div><Label>Startdatum</Label><Input type="date" value={editing.start_date ?? ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} /></div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                <Label>Actief</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuleren</Button>
            <Button
              onClick={async () => {
                if (!editing?.full_name) return;
                await upsertEmp.mutateAsync(editing as any);
                setEditing(null);
              }}
              disabled={upsertEmp.isPending}
            >Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run details dialog */}
      <Dialog open={!!openRunId} onOpenChange={(o) => !o && setOpenRunId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Salarisrun details</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medewerker</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead className="text-right">Loonheffing</TableHead>
                <TableHead className="text-right">Sociaal</TableHead>
                <TableHead className="text-right">Netto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => {
                const emp = employees.find(e => e.id === l.employee_id);
                return (
                  <TableRow key={l.id}>
                    <TableCell>{emp?.full_name ?? l.employee_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(Number(l.gross))}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(Number(l.payroll_tax))}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(Number(l.social_premiums))}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmt(Number(l.net))}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
