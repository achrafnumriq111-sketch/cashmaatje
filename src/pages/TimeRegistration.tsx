import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Clock, Trash2, Euro, FileText } from "lucide-react";
import { pageTransition, cardVariant } from "@/lib/animations";
import { useTimeEntries, type TimeEntry } from "@/hooks/useTimeEntries";
import { useContacts } from "@/hooks/useContacts";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function TimeRegistration() {
  const { list, create, remove } = useTimeEntries();
  const { data: contacts = [] } = useContacts({ search: "", type: "customer", country: "all", riskStatus: "all" });
  const { membership } = useOrganization();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [invoicing, setInvoicing] = useState(false);
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    hours: 1,
    description: "",
    contact_id: "",
    hourly_rate_eur: 75,
    is_billable: true,
  });

  const entries = list.data ?? [];
  const totalHours = entries.reduce((s, e) => s + Number(e.hours), 0);
  const billable = entries.filter((e) => e.is_billable);
  const uninvoiced = billable.filter((e) => !e.is_invoiced && e.contact_id);
  const totalRevenue = billable.reduce((s, e) => s + Number(e.hours) * Number(e.hourly_rate_eur ?? 0), 0);

  function toggle(id: string) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  }

  async function submit() {
    try {
      await create.mutateAsync({ ...form, contact_id: form.contact_id || null });
      toast.success("Uren opgeslagen");
      setOpen(false);
      setForm({ ...form, hours: 1, description: "" });
    } catch (e: any) { toast.error(e.message); }
  }

  async function createInvoices() {
    if (!membership || !user) return;
    const orgId = membership.organizationId;
    const picked = entries.filter((e) => selected.has(e.id) && e.contact_id && !e.is_invoiced);
    if (picked.length === 0) return toast.error("Selecteer factureerbare uren met klant");

    // group per contact
    const groups = new Map<string, TimeEntry[]>();
    picked.forEach((e) => {
      const arr = groups.get(e.contact_id!) ?? [];
      arr.push(e); groups.set(e.contact_id!, arr);
    });

    setInvoicing(true);
    try {
      let count = 0;
      for (const [contactId, items] of groups) {
        const contact = contacts.find((c: any) => c.id === contactId);
        const subtotal = items.reduce((s, e) => s + Number(e.hours) * Number(e.hourly_rate_eur ?? 0), 0);
        const vat = subtotal * 0.21;
        const total = subtotal + vat;
        const today = new Date().toISOString().slice(0, 10);
        const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
        const number = `CONCEPT-${Date.now().toString().slice(-6)}-${count + 1}`;

        const { data: inv, error: invErr } = await supabase.from("invoices").insert({
          organization_id: orgId,
          invoice_type: "sales",
          invoice_number: number,
          contact_id: contactId,
          contact_name: contact?.name ?? "",
          invoice_date: today,
          due_date: due,
          subtotal,
          total_vat: vat,
          total_amount: total,
          amount_due: total,
          status: "draft",
          created_by: user.id,
        }).select("id").single();
        if (invErr) throw invErr;

        const lines = items.map((e, idx) => ({
          invoice_id: inv.id,
          line_number: idx + 1,
          description: `${e.entry_date} — ${e.description ?? "Uren"}`,
          quantity: Number(e.hours),
          unit_price: Number(e.hourly_rate_eur ?? 0),
          line_total: Number(e.hours) * Number(e.hourly_rate_eur ?? 0),
          vat_percentage: 21,
          vat_rate_type: "high" as const,
          vat_amount: Number(e.hours) * Number(e.hourly_rate_eur ?? 0) * 0.21,
        }));
        const { error: lineErr } = await supabase.from("invoice_lines").insert(lines);
        if (lineErr) throw lineErr;

        await supabase.from("time_entries").update({ is_invoiced: true, invoice_id: inv.id }).in("id", items.map((i) => i.id));
        count++;
      }
      toast.success(`${count} concept-factuur/facturen aangemaakt`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["time_entries"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setInvoicing(false);
    }
  }

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Urenregistratie</h1>
          <p className="text-sm text-muted-foreground mt-1">Houd gewerkte uren bij per klant</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button variant="secondary" onClick={createInvoices} disabled={invoicing} className="gap-1.5">
              <FileText className="h-4 w-4" />Factureer ({selected.size})
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5"><Plus className="h-4 w-4" />Nieuwe registratie</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Uren registreren</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Datum</Label><Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} /></div>
                  <div><Label>Uren</Label><Input type="number" step="0.25" min="0" value={form.hours} onChange={(e) => setForm({ ...form, hours: parseFloat(e.target.value) || 0 })} /></div>
                </div>
                <div>
                  <Label>Klant</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })}>
                    <option value="">— Geen —</option>
                    {contacts.filter((c: any) => c.is_customer).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><Label>Omschrijving</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="flex items-center justify-between">
                  <Label>Factureerbaar</Label>
                  <Switch checked={form.is_billable} onCheckedChange={(v) => setForm({ ...form, is_billable: v })} />
                </div>
                {form.is_billable && (
                  <div><Label>Uurtarief (€)</Label><Input type="number" value={form.hourly_rate_eur} onChange={(e) => setForm({ ...form, hourly_rate_eur: parseFloat(e.target.value) || 0 })} /></div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={submit} disabled={create.isPending}>Opslaan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <motion.div variants={cardVariant} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="arcory-glass"><CardContent className="p-5"><div className="text-micro text-muted-foreground uppercase">Totale uren</div><div className="text-2xl font-semibold mt-1 tabular-nums">{totalHours.toFixed(1)}h</div></CardContent></Card>
        <Card className="arcory-glass"><CardContent className="p-5"><div className="text-micro text-muted-foreground uppercase">Factureerbaar</div><div className="text-2xl font-semibold mt-1 tabular-nums">{billable.reduce((s, e) => s + Number(e.hours), 0).toFixed(1)}h</div></CardContent></Card>
        <Card className="arcory-glass"><CardContent className="p-5"><div className="text-micro text-muted-foreground uppercase">Nog niet gefactureerd</div><div className="text-2xl font-semibold mt-1 tabular-nums text-amber-400">{uninvoiced.length}</div></CardContent></Card>
        <Card className="arcory-glass"><CardContent className="p-5"><div className="text-micro text-muted-foreground uppercase">Te factureren</div><div className="text-2xl font-semibold mt-1 tabular-nums text-emerald-400">€{totalRevenue.toLocaleString("nl-NL", { maximumFractionDigits: 2 })}</div></CardContent></Card>
      </motion.div>

      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />Registraties</CardTitle></CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nog geen uren geregistreerd</p>
            ) : (
              <div className="space-y-2">
                {entries.map((e) => {
                  const contact = contacts.find((c: any) => c.id === e.contact_id);
                  const canSelect = e.is_billable && !e.is_invoiced && !!e.contact_id;
                  return (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                      <div className="flex items-center gap-3 flex-1">
                        {canSelect && (
                          <Checkbox checked={selected.has(e.id)} onCheckedChange={() => toggle(e.id)} />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{e.entry_date}</span>
                            <Badge variant="outline" className="text-xs">{Number(e.hours).toFixed(2)}h</Badge>
                            {contact && <span className="text-xs text-muted-foreground">· {contact.name}</span>}
                            {e.is_billable && <Badge className="text-[10px] bg-emerald-400/10 text-emerald-400 border-emerald-400/30"><Euro className="h-3 w-3 mr-0.5" />€{Number(e.hourly_rate_eur ?? 0)}</Badge>}
                            {e.is_invoiced && <Badge className="text-[10px] bg-blue-400/10 text-blue-400 border-blue-400/30">Gefactureerd</Badge>}
                          </div>
                          {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => remove.mutate(e.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
