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
import { Plus, Calendar as CalIcon, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { pageTransition, cardVariant } from "@/lib/animations";
import { useAgendaEvents } from "@/hooks/useAgendaEvents";
import { useContacts } from "@/hooks/useContacts";
import { toast } from "sonner";

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function Agenda() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
  const { list, create, remove } = useAgendaEvents(weekStart.toISOString(), weekEnd.toISOString());
  const { data: contacts = [] } = useContacts({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_at: new Date().toISOString().slice(0, 16),
    end_at: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    contact_id: "",
    is_billable: false,
    hourly_rate_eur: 75,
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });

  async function submit() {
    if (!form.title.trim()) return toast.error("Titel verplicht");
    try {
      await create.mutateAsync({
        title: form.title,
        description: form.description,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        contact_id: form.contact_id || null,
        is_billable: form.is_billable,
        hourly_rate_eur: form.is_billable ? form.hourly_rate_eur : null,
      });
      toast.success("Afspraak toegevoegd");
      setOpen(false);
      setForm({ ...form, title: "", description: "" });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan afspraken en koppel aan klanten</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm tabular-nums">{weekStart.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} – {new Date(weekEnd.getTime() - 86400000).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</span>
          <Button variant="ghost" size="icon" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}><ChevronRight className="h-4 w-4" /></Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-1.5 ml-2"><Plus className="h-4 w-4" />Afspraak</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nieuwe afspraak</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Titel</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start</Label><Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} /></div>
                  <div><Label>Einde</Label><Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Klant</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })}>
                    <option value="">— Geen —</option>
                    {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><Label>Notitie</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="flex items-center justify-between"><Label>Factureerbaar</Label><Switch checked={form.is_billable} onCheckedChange={(v) => setForm({ ...form, is_billable: v })} /></div>
                {form.is_billable && <div><Label>Uurtarief (€)</Label><Input type="number" value={form.hourly_rate_eur} onChange={(e) => setForm({ ...form, hourly_rate_eur: parseFloat(e.target.value) || 0 })} /></div>}
              </div>
              <DialogFooter><Button onClick={submit} disabled={create.isPending}>Toevoegen</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <motion.div variants={cardVariant} className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {days.map((d) => {
          const dayEvents = (list.data ?? []).filter((e) => new Date(e.start_at).toDateString() === d.toDateString());
          const isToday = d.toDateString() === new Date().toDateString();
          return (
            <Card key={d.toISOString()} className={`arcory-glass ${isToday ? "ring-1 ring-primary/40" : ""}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 min-h-[120px]">
                {dayEvents.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/50">—</p>
                ) : dayEvents.map((e) => {
                  const contact = contacts.find((c: any) => c.id === e.contact_id);
                  return (
                    <div key={e.id} className="p-2 rounded-md bg-primary/10 border border-primary/20 text-xs group relative">
                      <div className="font-medium text-foreground truncate">{e.title}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(e.start_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {contact && <div className="text-[10px] text-muted-foreground truncate">{contact.name}</div>}
                      {e.is_billable && <Badge className="text-[9px] mt-1 bg-emerald-400/10 text-emerald-400 border-emerald-400/30">€{Number(e.hourly_rate_eur ?? 0)}/u</Badge>}
                      <button onClick={() => remove.mutate(e.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition"><Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-400" /></button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {(list.data ?? []).length === 0 && (
        <motion.div variants={cardVariant}>
          <Card className="arcory-glass"><CardContent className="p-8 text-center"><CalIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nog geen afspraken deze week</p></CardContent></Card>
        </motion.div>
      )}
    </motion.div>
  );
}
