import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Zap, GripVertical } from "lucide-react";
import { useBankRules, useCreateBankRule, useUpdateBankRule, useDeleteBankRule } from "@/hooks/useBankRules";
import { useAccounts } from "@/hooks/useTransactions";
import { toast } from "sonner";

const matchFieldLabels: Record<string, string> = {
  counterparty_name: "Tegenpartij",
  description: "Omschrijving",
  counterparty_iban: "IBAN",
  payment_reference: "Kenmerk",
};

const matchTypeLabels: Record<string, string> = {
  exact: "Is exact",
  contains: "Bevat",
  starts_with: "Begint met",
  regex: "Regex",
};

export function BankRulesManager() {
  const { data: rules = [], isLoading } = useBankRules();
  const { data: accounts = [] } = useAccounts();
  const createRule = useCreateBankRule();
  const updateRule = useUpdateBankRule();
  const deleteRule = useDeleteBankRule();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    match_field: "counterparty_name" as const,
    match_type: "contains" as const,
    match_value: "",
    account_id: "",
    priority: 100,
  });

  const handleCreate = async () => {
    if (!form.name || !form.match_value) {
      toast.error("Vul naam en matchwaarde in");
      return;
    }
    try {
      await createRule.mutateAsync({
        name: form.name,
        match_field: form.match_field,
        match_type: form.match_type,
        match_value: form.match_value,
        account_id: form.account_id || null,
        contact_id: null,
        is_active: true,
        priority: form.priority,
      });
      toast.success("Regel aangemaakt");
      setDialogOpen(false);
      setForm({ name: "", match_field: "counterparty_name", match_type: "contains", match_value: "", account_id: "", priority: 100 });
    } catch {
      toast.error("Fout bij aanmaken regel");
    }
  };

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Bankregels</CardTitle>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8">
                <Plus className="h-3.5 w-3.5 mr-1" /> Nieuwe regel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuwe bankregel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Naam</Label>
                  <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="bijv. Huur kantoor" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Veld</Label>
                    <Select value={form.match_field} onValueChange={(v: any) => setForm(f => ({ ...f, match_field: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(matchFieldLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={form.match_type} onValueChange={(v: any) => setForm(f => ({ ...f, match_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(matchTypeLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Matchwaarde</Label>
                  <Input value={form.match_value} onChange={(e) => setForm(f => ({ ...f, match_value: e.target.value }))} placeholder="bijv. Verhuurder BV" />
                </div>
                <div>
                  <Label>Grootboekrekening</Label>
                  <Select value={form.account_id} onValueChange={(v) => setForm(f => ({ ...f, account_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Kies rekening..." /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.code} - {a.name_nl || a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioriteit (lager = eerder)</Label>
                  <Input type="number" value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 100 }))} />
                </div>
                <Button onClick={handleCreate} disabled={createRule.isPending} className="w-full">
                  {createRule.isPending ? "Aanmaken..." : "Regel aanmaken"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nog geen regels. Maak een regel aan om transacties automatisch te categoriseren.
          </p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule: any) => (
              <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 group">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{rule.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {matchFieldLabels[rule.match_field]} {matchTypeLabels[rule.match_type]} "{rule.match_value}"
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {rule.accounts && (
                      <span className="text-xs text-muted-foreground">{rule.accounts.code} - {rule.accounts.name_nl}</span>
                    )}
                    <span className="text-xs text-muted-foreground/60">• {rule.times_applied}× toegepast</span>
                  </div>
                </div>
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={(checked) => updateRule.mutate({ id: rule.id, updates: { is_active: checked } })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteRule.mutate(rule.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
