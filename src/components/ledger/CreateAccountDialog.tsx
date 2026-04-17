import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

const ACCOUNT_TYPES = [
  { value: "asset", label: "Activa" },
  { value: "liability", label: "Passiva" },
  { value: "equity", label: "Eigen vermogen" },
  { value: "revenue", label: "Omzet" },
  { value: "expense", label: "Kosten" },
] as const;

const VAT_BOXES = ["", "1a", "1b", "1c", "1d", "1e", "2a", "3a", "3b", "3c", "4a", "4b", "5b"];

export function CreateAccountDialog() {
  const { membership } = useOrganization();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [nameNl, setNameNl] = useState("");
  const [type, setType] = useState<typeof ACCOUNT_TYPES[number]["value"]>("expense");
  const [vatBox, setVatBox] = useState("");
  const [vatPct, setVatPct] = useState<string>("");
  const [active, setActive] = useState(true);

  const create = useMutation({
    mutationFn: async () => {
      const orgId = membership?.organizationId;
      if (!orgId) throw new Error("No organization");
      if (!code.trim() || !name.trim()) throw new Error("Code en naam zijn verplicht");
      if (!/^\d{3,5}$/.test(code.trim())) throw new Error("Code moet 3-5 cijfers zijn");
      const normalBalance = ["asset", "expense"].includes(type) ? "debit" : "credit";
      const { error } = await supabase.from("accounts").insert({
        organization_id: orgId,
        code: code.trim(),
        name: name.trim(),
        name_nl: nameNl.trim() || name.trim(),
        account_type: type as any,
        normal_balance: normalBalance as any,
        vat_box_mapping: vatBox || null,
        default_vat_percentage: vatPct ? Number(vatPct) : null,
        is_active: active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["general-ledger"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Rekening aangemaakt");
      setOpen(false);
      setCode(""); setName(""); setNameNl(""); setVatBox(""); setVatPct(""); setType("expense");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" /> Nieuwe rekening
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nieuwe grootboekrekening</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Code *</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="7430" className="font-mono" />
              </div>
              <div>
                <Label className="text-xs">Type *</Label>
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Naam (NL) *</Label>
              <Input value={nameNl} onChange={(e) => setNameNl(e.target.value)} placeholder="Software en abonnementen" />
            </div>
            <div>
              <Label className="text-xs">Naam (EN)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Software & subscriptions" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">BTW box</Label>
                <Select value={vatBox || "none"} onValueChange={(v) => setVatBox(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geen</SelectItem>
                    {VAT_BOXES.filter(Boolean).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Standaard BTW %</Label>
                <Input type="number" value={vatPct} onChange={(e) => setVatPct(e.target.value)} placeholder="21" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label className="text-sm">Actief</Label>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? "Aanmaken..." : "Aanmaken"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
