import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ScrollText } from "lucide-react";
import { toast } from "sonner";

interface Line {
  account_id: string;
  description: string;
  debit: string;
  credit: string;
}

const emptyLine = (): Line => ({ account_id: "", description: "", debit: "", credit: "" });

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemorialJournalDialog({ open, onOpenChange }: Props) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const qc = useQueryClient();

  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()]);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", orgId],
    enabled: !!orgId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, code, name_nl, name")
        .eq("organization_id", orgId!)
        .eq("is_active", true)
        .order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const totals = useMemo(() => {
    const debit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
    const credit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 && debit > 0 };
  }, [lines]);

  const reset = () => {
    setEntryDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setReference("");
    setLines([emptyLine(), emptyLine()]);
  };

  const saveMutation = useMutation({
    mutationFn: async (post: boolean) => {
      if (!orgId) throw new Error("Geen organisatie");
      if (!description.trim()) throw new Error("Omschrijving is verplicht");
      const validLines = lines.filter((l) => l.account_id && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0));
      if (validLines.length < 2) throw new Error("Minimaal 2 boekingsregels");
      if (post && !totals.balanced) throw new Error("Debet en credit moeten gelijk zijn");

      const { data: entry, error: e1 } = await supabase
        .from("memorial_journal_entries" as any)
        .insert({
          organization_id: orgId,
          entry_date: entryDate,
          description,
          reference: reference || null,
          total_debit: totals.debit,
          total_credit: totals.credit,
          status: "draft",
        })
        .select()
        .single();
      if (e1) throw e1;

      const lineRows = validLines.map((l, i) => ({
        memorial_entry_id: (entry as any).id,
        line_number: i + 1,
        account_id: l.account_id,
        description: l.description || null,
        debit_amount: parseFloat(l.debit) || 0,
        credit_amount: parseFloat(l.credit) || 0,
      }));
      const { error: e2 } = await supabase.from("memorial_journal_lines" as any).insert(lineRows);
      if (e2) throw e2;

      if (post) {
        const { error: e3 } = await supabase.rpc("post_memorial_journal" as any, {
          p_memorial_id: (entry as any).id,
        });
        if (e3) throw e3;
      }
    },
    onSuccess: (_, post) => {
      toast.success(post ? "Memoriaalboeking geboekt" : "Memoriaalboeking opgeslagen als concept");
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      reset();
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message ?? "Opslaan mislukt"),
  });

  const updateLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Nieuwe memoriaalboeking
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Datum</Label>
            <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Referentie (optioneel)</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="bijv. MEM-2026-001" />
          </div>
          <div className="col-span-3">
            <Label>Omschrijving</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bijv. Correctie afschrijving Q4" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
            <div className="col-span-4">Grootboekrekening</div>
            <div className="col-span-3">Omschrijving</div>
            <div className="col-span-2 text-right">Debet €</div>
            <div className="col-span-2 text-right">Credit €</div>
            <div className="col-span-1" />
          </div>
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <div className="col-span-4">
                <Select value={line.account_id} onValueChange={(v) => updateLine(i, { account_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Kies rekening..." /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {accounts.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.code} — {a.name_nl ?? a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input className="col-span-3" value={line.description} onChange={(e) => updateLine(i, { description: e.target.value })} />
              <Input className="col-span-2 text-right tabular-nums" type="number" step="0.01" value={line.debit}
                onChange={(e) => updateLine(i, { debit: e.target.value, credit: e.target.value ? "" : line.credit })} />
              <Input className="col-span-2 text-right tabular-nums" type="number" step="0.01" value={line.credit}
                onChange={(e) => updateLine(i, { credit: e.target.value, debit: e.target.value ? "" : line.debit })} />
              <Button variant="ghost" size="icon" className="col-span-1"
                onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}
                disabled={lines.length <= 2}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setLines((p) => [...p, emptyLine()])} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Regel toevoegen
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3 text-sm">
          <div className="flex gap-6 tabular-nums">
            <span>Totaal debet: <strong>€{totals.debit.toFixed(2)}</strong></span>
            <span>Totaal credit: <strong>€{totals.credit.toFixed(2)}</strong></span>
          </div>
          <span className={totals.balanced ? "text-emerald-400" : "text-amber-400"}>
            {totals.balanced ? "✓ In balans" : `Verschil: €${Math.abs(totals.debit - totals.credit).toFixed(2)}`}
          </span>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => saveMutation.mutate(false)} disabled={saveMutation.isPending}>
            Opslaan als concept
          </Button>
          <Button onClick={() => saveMutation.mutate(true)} disabled={!totals.balanced || saveMutation.isPending}>
            Boeken
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
