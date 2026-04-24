import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Clock, AlertTriangle, XCircle, Receipt, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentStatus = "unpaid" | "scheduled" | "paid" | "refunded" | "overdue" | "partial";

interface SubmittedReturn {
  id: string;
  year: number;
  period_type: string;
  period_number: number;
  period_start: string;
  period_end: string;
  status: string;
  filed_at: string | null;
  filing_reference: string | null;
  box_5f_vat: number;
  payment_status: PaymentStatus;
  payment_due_date: string | null;
  paid_at: string | null;
  paid_amount: number | null;
  payment_reference: string | null;
  payment_method: string | null;
  payment_notes: string | null;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(v);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function periodLabel(r: SubmittedReturn) {
  if (r.period_type === "quarterly") return `Q${r.period_number} ${r.year}`;
  const month = new Date(2000, r.period_number - 1).toLocaleString("nl-NL", { month: "long" });
  return `${month} ${r.year}`;
}

function paymentBadge(status: PaymentStatus) {
  const map: Record<PaymentStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
    unpaid:    { label: "Onbetaald",     cls: "bg-muted text-muted-foreground border-border", Icon: Clock },
    scheduled: { label: "Ingepland",     cls: "bg-blue-500/10 text-blue-500 border-blue-500/30", Icon: Send },
    partial:   { label: "Deels betaald", cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", Icon: AlertTriangle },
    paid:      { label: "Betaald",       cls: "bg-primary/10 text-primary border-primary/30", Icon: CheckCircle2 },
    refunded:  { label: "Terugontvangen",cls: "bg-primary/10 text-primary border-primary/30", Icon: CheckCircle2 },
    overdue:   { label: "Te laat",       cls: "bg-destructive/10 text-destructive border-destructive/30", Icon: XCircle },
  };
  const m = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium", m.cls)}>
      <m.Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

function deriveDueDate(periodEnd: string): string {
  // NL VAT returns due by end of month after period end
  const d = new Date(periodEnd);
  d.setMonth(d.getMonth() + 2);
  d.setDate(0); // last day of (period_end month + 1)
  return d.toISOString().slice(0, 10);
}

function deriveStatusForRow(row: SubmittedReturn): PaymentStatus {
  if (row.payment_status === "paid" || row.payment_status === "refunded" || row.payment_status === "partial" || row.payment_status === "scheduled") {
    return row.payment_status;
  }
  const due = row.payment_due_date ?? deriveDueDate(row.period_end);
  if (due && new Date(due) < new Date() && row.payment_status === "unpaid") {
    return "overdue";
  }
  return row.payment_status;
}

export function SubmittedReturnsList() {
  const { membership } = useOrganization();
  const { toast } = useToast();
  const orgId = membership?.organizationId;

  const [rows, setRows] = useState<SubmittedReturn[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");
  const [editing, setEditing] = useState<SubmittedReturn | null>(null);
  const [form, setForm] = useState({
    payment_status: "unpaid" as PaymentStatus,
    payment_due_date: "",
    paid_at: "",
    paid_amount: "",
    payment_reference: "",
    payment_method: "",
    payment_notes: "",
  });
  const [savingPayment, setSavingPayment] = useState(false);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("vat_returns")
      .select("id, year, period_type, period_number, period_start, period_end, status, filed_at, filing_reference, box_5f_vat, payment_status, payment_due_date, paid_at, paid_amount, payment_reference, payment_method, payment_notes")
      .eq("organization_id", orgId)
      .in("status", ["filed", "reviewed"])
      .order("filed_at", { ascending: false, nullsFirst: false })
      .order("year", { ascending: false })
      .order("period_number", { ascending: false });
    if (error) {
      toast({ title: "Kon verstuurde aangiftes niet laden", variant: "destructive" });
    } else {
      setRows((data ?? []) as SubmittedReturn[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!orgId) return;
    const ch = supabase
      .channel(`vat-returns-list-${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "vat_returns", filter: `organization_id=eq.${orgId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const visibleRows = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "all") return true;
      return deriveStatusForRow(r) === filter;
    });
  }, [rows, filter]);

  const summary = useMemo(() => {
    const out = { total: 0, due: 0, paid: 0, overdue: 0, count: rows.length };
    rows.forEach((r) => {
      const amt = Number(r.box_5f_vat) || 0;
      out.total += amt;
      const st = deriveStatusForRow(r);
      if (st === "paid" || st === "refunded") out.paid += Number(r.paid_amount ?? amt);
      else out.due += amt;
      if (st === "overdue") out.overdue += amt;
    });
    return out;
  }, [rows]);

  const openEdit = (row: SubmittedReturn) => {
    setEditing(row);
    setForm({
      payment_status: row.payment_status ?? "unpaid",
      payment_due_date: row.payment_due_date ?? deriveDueDate(row.period_end),
      paid_at: row.paid_at ? row.paid_at.slice(0, 10) : "",
      paid_amount: row.paid_amount != null ? String(row.paid_amount) : String(row.box_5f_vat ?? ""),
      payment_reference: row.payment_reference ?? "",
      payment_method: row.payment_method ?? "",
      payment_notes: row.payment_notes ?? "",
    });
  };

  const savePayment = async () => {
    if (!editing) return;
    setSavingPayment(true);
    const payload: Record<string, unknown> = {
      payment_status: form.payment_status,
      payment_due_date: form.payment_due_date || null,
      paid_at: form.paid_at ? new Date(form.paid_at).toISOString() : null,
      paid_amount: form.paid_amount ? Number(form.paid_amount) : null,
      payment_reference: form.payment_reference || null,
      payment_method: form.payment_method || null,
      payment_notes: form.payment_notes || null,
    };
    if ((form.payment_status === "paid" || form.payment_status === "refunded") && !payload.paid_at) {
      payload.paid_at = new Date().toISOString();
    }
    const { error } = await supabase.from("vat_returns").update(payload).eq("id", editing.id);
    setSavingPayment(false);
    if (error) {
      toast({ title: "Opslaan mislukt", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Betaalstatus bijgewerkt" });
    setEditing(null);
    load();
  };

  const markAsPaid = async (row: SubmittedReturn) => {
    const { error } = await supabase
      .from("vat_returns")
      .update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        paid_amount: row.paid_amount ?? row.box_5f_vat,
      })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Markeren mislukt", variant: "destructive" });
    } else {
      toast({ title: "Gemarkeerd als betaald" });
      load();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Verstuurde aangiftes</CardTitle>
            <Badge variant="outline" className="text-[10px]">{rows.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="unpaid">Onbetaald</SelectItem>
                <SelectItem value="scheduled">Ingepland</SelectItem>
                <SelectItem value="partial">Deels betaald</SelectItem>
                <SelectItem value="paid">Betaald</SelectItem>
                <SelectItem value="overdue">Te laat</SelectItem>
                <SelectItem value="refunded">Terugontvangen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
          <div className="rounded-md border border-border p-2">
            <p className="text-[10px] text-muted-foreground uppercase">Aangiftes</p>
            <p className="text-sm font-semibold font-mono">{summary.count}</p>
          </div>
          <div className="rounded-md border border-border p-2">
            <p className="text-[10px] text-muted-foreground uppercase">Openstaand</p>
            <p className="text-sm font-semibold font-mono">{fmt(summary.due)}</p>
          </div>
          <div className="rounded-md border border-border p-2">
            <p className="text-[10px] text-muted-foreground uppercase">Betaald</p>
            <p className="text-sm font-semibold font-mono text-primary">{fmt(summary.paid)}</p>
          </div>
          <div className={cn("rounded-md border p-2", summary.overdue > 0 ? "border-destructive/40" : "border-border")}>
            <p className="text-[10px] text-muted-foreground uppercase">Te laat</p>
            <p className={cn("text-sm font-semibold font-mono", summary.overdue > 0 && "text-destructive")}>{fmt(summary.overdue)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : visibleRows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Geen verstuurde aangiftes voor deze filter.</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Periode</TableHead>
                  <TableHead className="text-xs">Ingediend</TableHead>
                  <TableHead className="text-xs">Vervalt</TableHead>
                  <TableHead className="text-xs text-right">Bedrag</TableHead>
                  <TableHead className="text-xs">Betaalstatus</TableHead>
                  <TableHead className="text-xs">Ref.</TableHead>
                  <TableHead className="text-xs text-right">Actie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((r) => {
                  const status = deriveStatusForRow(r);
                  const due = r.payment_due_date ?? deriveDueDate(r.period_end);
                  const amount = Number(r.box_5f_vat) || 0;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs py-2 font-medium">{periodLabel(r)}</TableCell>
                      <TableCell className="text-xs py-2 text-muted-foreground">{fmtDate(r.filed_at)}</TableCell>
                      <TableCell className="text-xs py-2 text-muted-foreground">{fmtDate(due)}</TableCell>
                      <TableCell className={cn(
                        "text-xs py-2 font-mono text-right",
                        amount > 0 ? "text-destructive" : amount < 0 ? "text-primary" : "",
                      )}>
                        {fmt(amount)}
                      </TableCell>
                      <TableCell className="text-xs py-2">{paymentBadge(status)}</TableCell>
                      <TableCell className="text-xs py-2 font-mono text-muted-foreground truncate max-w-[120px]">
                        {r.payment_reference || r.filing_reference || "—"}
                      </TableCell>
                      <TableCell className="text-xs py-2 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {status !== "paid" && status !== "refunded" && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => markAsPaid(r)}>
                              Markeer betaald
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => openEdit(r)}>
                            Beheren
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Betaling beheren</DialogTitle>
            <DialogDescription>
              {editing && `${periodLabel(editing)} · ${fmt(editing.box_5f_vat)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Betaalstatus</Label>
              <Select value={form.payment_status} onValueChange={(v) => setForm((f) => ({ ...f, payment_status: v as PaymentStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Onbetaald</SelectItem>
                  <SelectItem value="scheduled">Ingepland</SelectItem>
                  <SelectItem value="partial">Deels betaald</SelectItem>
                  <SelectItem value="paid">Betaald</SelectItem>
                  <SelectItem value="refunded">Terugontvangen</SelectItem>
                  <SelectItem value="overdue">Te laat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Vervaldatum</Label>
              <Input type="date" value={form.payment_due_date} onChange={(e) => setForm((f) => ({ ...f, payment_due_date: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Betaaldatum</Label>
              <Input type="date" value={form.paid_at} onChange={(e) => setForm((f) => ({ ...f, paid_at: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Betaald bedrag (€)</Label>
              <Input type="number" step="0.01" value={form.paid_amount} onChange={(e) => setForm((f) => ({ ...f, paid_amount: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Methode</Label>
              <Select value={form.payment_method || "none"} onValueChange={(v) => setForm((f) => ({ ...f, payment_method: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Kies..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="bank_transfer">Bankoverschrijving</SelectItem>
                  <SelectItem value="direct_debit">Automatische incasso</SelectItem>
                  <SelectItem value="ideal">iDEAL</SelectItem>
                  <SelectItem value="other">Anders</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Referentie / kenmerk</Label>
              <Input value={form.payment_reference} onChange={(e) => setForm((f) => ({ ...f, payment_reference: e.target.value }))} placeholder="Belastingdienst-kenmerk of betaalreferentie" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Notities</Label>
              <Textarea rows={3} value={form.payment_notes} onChange={(e) => setForm((f) => ({ ...f, payment_notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Annuleren</Button>
            <Button onClick={savePayment} disabled={savingPayment}>
              {savingPayment && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
