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
import { Plus, Clock, Trash2, Euro } from "lucide-react";
import { pageTransition, cardVariant } from "@/lib/animations";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useContacts } from "@/hooks/useContacts";
import { toast } from "sonner";

export default function TimeRegistration() {
  const { list, create, remove } = useTimeEntries();
  const { data: contacts = [] } = useContacts({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    hours: 1,
    description: "",
    contact_id: "",
    hourly_rate_eur: 75,
    is_billable: true,
  });

  const totalHours = (list.data ?? []).reduce((s, e) => s + Number(e.hours), 0);
  const billable = (list.data ?? []).filter((e) => e.is_billable);
  const totalRevenue = billable.reduce((s, e) => s + Number(e.hours) * Number(e.hourly_rate_eur ?? 0), 0);

  async function submit() {
    try {
      await create.mutateAsync({
        ...form,
        contact_id: form.contact_id || null,
      });
      toast.success("Uren opgeslagen");
      setOpen(false);
      setForm({ ...form, hours: 1, description: "" });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Urenregistratie</h1>
          <p className="text-sm text-muted-foreground mt-1">Houd gewerkte uren bij per klant</p>
        </div>
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
      </motion.div>

      <motion.div variants={cardVariant} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="arcory-glass"><CardContent className="p-5"><div className="text-micro text-muted-foreground uppercase">Totale uren</div><div className="text-2xl font-semibold mt-1 tabular-nums">{totalHours.toFixed(1)}h</div></CardContent></Card>
        <Card className="arcory-glass"><CardContent className="p-5"><div className="text-micro text-muted-foreground uppercase">Factureerbaar</div><div className="text-2xl font-semibold mt-1 tabular-nums">{billable.reduce((s, e) => s + Number(e.hours), 0).toFixed(1)}h</div></CardContent></Card>
        <Card className="arcory-glass"><CardContent className="p-5"><div className="text-micro text-muted-foreground uppercase">Te factureren</div><div className="text-2xl font-semibold mt-1 tabular-nums text-emerald-400">€{totalRevenue.toLocaleString("nl-NL", { maximumFractionDigits: 2 })}</div></CardContent></Card>
      </motion.div>

      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />Registraties</CardTitle></CardHeader>
          <CardContent>
            {(list.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nog geen uren geregistreerd</p>
            ) : (
              <div className="space-y-2">
                {list.data!.map((e) => {
                  const contact = contacts.find((c: any) => c.id === e.contact_id);
                  return (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{e.entry_date}</span>
                          <Badge variant="outline" className="text-xs">{Number(e.hours).toFixed(2)}h</Badge>
                          {contact && <span className="text-xs text-muted-foreground">· {contact.name}</span>}
                          {e.is_billable && <Badge className="text-[10px] bg-emerald-400/10 text-emerald-400 border-emerald-400/30"><Euro className="h-3 w-3 mr-0.5" />€{Number(e.hourly_rate_eur ?? 0)}</Badge>}
                        </div>
                        {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
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
