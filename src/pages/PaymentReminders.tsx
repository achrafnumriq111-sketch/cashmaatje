import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Plus, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { pageTransition, cardVariant } from "@/lib/animations";
import { usePaymentReminders, useUpsertReminder, useDeleteReminder, type PaymentReminder } from "@/hooks/usePaymentReminders";

const DEFAULT_BODY = `Beste {contact_name},

Onze administratie laat zien dat factuur {invoice_number} d.d. {invoice_date} ad € {amount} nog openstaat. De vervaldatum was {due_date}.

Wij verzoeken u vriendelijk het bedrag binnen 7 dagen over te maken naar IBAN {iban}.

Met vriendelijke groet,
{org_name}`;

export default function PaymentReminders() {
  const { data: reminders = [], isLoading } = usePaymentReminders();
  const upsert = useUpsertReminder();
  const remove = useDeleteReminder();
  const [editing, setEditing] = useState<Partial<PaymentReminder> | null>(null);

  const save = async () => {
    if (!editing?.name || !editing.subject) { toast.error("Naam en onderwerp zijn verplicht"); return; }
    try {
      await upsert.mutateAsync(editing);
      toast.success("Herinneringschema opgeslagen");
      setEditing(null);
    } catch { toast.error("Opslaan mislukt"); }
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" className="space-y-4">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Herinneringsschema's</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Automatische betalingsherinneringen na vervaldatum</p>
        </div>
        <Button onClick={() => setEditing({ days_after_due: 7, channel: "email", is_active: true, body_template: DEFAULT_BODY })}>
          <Plus className="h-4 w-4" /> Nieuw schema
        </Button>
      </motion.div>

      <motion.div variants={cardVariant}>
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : reminders.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <Mail className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Nog geen herinneringsschema's ingesteld.</p>
            <Button onClick={() => setEditing({ days_after_due: 7, channel: "email", is_active: true, body_template: DEFAULT_BODY })}>
              Eerste schema aanmaken
            </Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {reminders.map((r) => (
              <Card key={r.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setEditing(r)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{r.name}</CardTitle>
                    <div className="flex items-center gap-1.5">
                      {r.is_active ? <Badge variant="secondary" className="text-[10px] bg-primary/15 text-primary border-0">Actief</Badge>
                        : <Badge variant="outline" className="text-[10px]">Inactief</Badge>}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); if (confirm(`Verwijder "${r.name}"?`)) remove.mutate(r.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <p className="text-muted-foreground">{r.days_after_due} dag{r.days_after_due === 1 ? "" : "en"} na vervaldatum</p>
                  <p className="font-medium truncate">{r.subject}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Schema bewerken" : "Nieuw herinneringsschema"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Naam</Label>
                  <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="bv. Eerste herinnering" />
                </div>
                <div>
                  <Label className="text-xs">Dagen na vervaldatum</Label>
                  <Input type="number" min={1} value={editing.days_after_due ?? 7} onChange={(e) => setEditing({ ...editing, days_after_due: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Onderwerp</Label>
                <Input value={editing.subject ?? ""} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} placeholder="Vriendelijke herinnering factuur {invoice_number}" />
              </div>
              <div>
                <Label className="text-xs">Tekst (gebruik {`{contact_name}`}, {`{invoice_number}`}, {`{amount}`}, {`{due_date}`}, {`{iban}`}, {`{org_name}`})</Label>
                <Textarea rows={8} value={editing.body_template ?? ""} onChange={(e) => setEditing({ ...editing, body_template: e.target.value })} className="font-mono text-xs" />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Actief</p>
                  <p className="text-xs text-muted-foreground">Schema automatisch versturen</p>
                </div>
                <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuleren</Button>
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Opslaan..." : "Opslaan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
