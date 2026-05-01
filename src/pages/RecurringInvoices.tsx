import { useState } from "react";
import { motion } from "framer-motion";
import { Repeat, Plus, Play, Pause, Trash2, Calendar, Send, FileText } from "lucide-react";
import { useRecurringTemplates, type RecurringTemplate } from "@/hooks/useRecurringTemplates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartEmptyState } from "@/components/ui/smart-empty-state";
import { pageTransition, cardVariant, staggerContainer } from "@/lib/animations";
import { toast } from "@/components/ui/use-toast";

const fmtEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const FREQ_LABEL: Record<string, string> = { monthly: "Maandelijks", quarterly: "Per kwartaal", yearly: "Jaarlijks" };

export default function RecurringInvoices() {
  const { list, create, remove, toggle } = useRecurringTemplates();
  const [open, setOpen] = useState(false);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-[1400px]">
      <motion.div variants={cardVariant} className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-foreground">Terugkerende facturen</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Sjablonen die automatisch concepten of verzendklare facturen aanmaken.
          </p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button><Plus className="mr-1.5 h-4 w-4" />Nieuw sjabloon</Button>
          </SheetTrigger>
          <SheetContent className="w-[480px] sm:max-w-md">
            <SheetHeader><SheetTitle>Nieuw sjabloon</SheetTitle></SheetHeader>
            <NewTemplateForm
              onSubmit={async (vals) => {
                try {
                  await create.mutateAsync(vals);
                  toast({ title: "Sjabloon aangemaakt" });
                  setOpen(false);
                } catch (e: any) {
                  toast({ title: "Fout", description: e.message, variant: "destructive" });
                }
              }}
            />
          </SheetContent>
        </Sheet>
      </motion.div>

      {list.isLoading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : (list.data?.length ?? 0) === 0 ? (
        <Card className="arcory-glass">
          <CardContent>
            <SmartEmptyState
              icon={Repeat}
              title="Nog geen terugkerende facturen"
              description="Stel een sjabloon in voor klanten die je elke maand, kwartaal of jaar factureert."
              whyItMatters="Je vergeet nooit meer een factuur. Cashflow forecast gebruikt deze sjablonen om verwachte inkomsten te tonen."
              actionLabel="Eerste sjabloon"
              onAction={() => setOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-3">
          {list.data!.map((t) => (
            <motion.div key={t.id} variants={cardVariant}>
              <Card className="arcory-glass">
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary-soft))]">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-medium text-foreground">{t.name}</p>
                      <Badge variant="secondary" className="text-[10.5px]">{FREQ_LABEL[t.frequency]}</Badge>
                      {t.auto_send ? (
                        <Badge className="bg-emerald-400/15 text-emerald-400 border-emerald-400/20 text-[10.5px]">
                          <Send className="mr-1 h-2.5 w-2.5" />Auto-verzenden
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10.5px]">Concept</Badge>
                      )}
                      {!t.is_active && <Badge variant="outline" className="text-[10.5px]">Gepauzeerd</Badge>}
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                      {t.contact_name ?? "Geen klant"} · volgende: {t.next_run_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-semibold tabular-nums">{fmtEur(t.total_amount)}</p>
                    <p className="text-[11px] text-muted-foreground">{t.currency}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon" variant="ghost" title={t.is_active ? "Pauzeren" : "Activeren"}
                      onClick={() => toggle.mutate({ id: t.id, is_active: !t.is_active })}
                    >
                      {t.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon" variant="ghost" title="Verwijderen"
                      onClick={() => {
                        if (confirm(`"${t.name}" verwijderen?`)) remove.mutate(t.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function NewTemplateForm({ onSubmit }: { onSubmit: (vals: any) => Promise<void> }) {
  const today = new Date().toISOString().split("T")[0];
  const [vals, setVals] = useState({
    name: "", contact_name: "", invoice_type: "sales" as "sales" | "purchase",
    total_amount: 0, frequency: "monthly" as "monthly" | "quarterly" | "yearly",
    start_date: today, day_of_month: 1, auto_send: false,
  });
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={async (e) => { e.preventDefault(); await onSubmit({ ...vals, next_run_date: vals.start_date, subtotal: vals.total_amount }); }}
    >
      <div><Label>Naam</Label><Input required value={vals.name} onChange={(e) => setVals({ ...vals, name: e.target.value })} placeholder="Bv. Maandelijks abonnement Acme" /></div>
      <div><Label>Klant / leverancier</Label><Input value={vals.contact_name} onChange={(e) => setVals({ ...vals, contact_name: e.target.value })} placeholder="Naam" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Type</Label>
          <Select value={vals.invoice_type} onValueChange={(v: any) => setVals({ ...vals, invoice_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="sales">Verkoop</SelectItem><SelectItem value="purchase">Inkoop</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Frequentie</Label>
          <Select value={vals.frequency} onValueChange={(v: any) => setVals({ ...vals, frequency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Maandelijks</SelectItem>
              <SelectItem value="quarterly">Per kwartaal</SelectItem>
              <SelectItem value="yearly">Jaarlijks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Bedrag (incl. BTW)</Label><Input type="number" step="0.01" required value={vals.total_amount} onChange={(e) => setVals({ ...vals, total_amount: Number(e.target.value) })} /></div>
        <div><Label>Startdatum</Label><Input type="date" required value={vals.start_date} onChange={(e) => setVals({ ...vals, start_date: e.target.value })} /></div>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border p-3">
        <div>
          <p className="text-[13px] font-medium">Automatisch versturen</p>
          <p className="text-[11.5px] text-muted-foreground">Anders alleen concept aanmaken</p>
        </div>
        <Switch checked={vals.auto_send} onCheckedChange={(v) => setVals({ ...vals, auto_send: v })} />
      </div>
      <Button type="submit" className="w-full"><Calendar className="mr-2 h-4 w-4" />Sjabloon opslaan</Button>
    </form>
  );
}
