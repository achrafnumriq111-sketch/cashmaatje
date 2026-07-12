import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Bell } from "lucide-react";
import { toast } from "sonner";

interface ReminderCfg {
  enabled: boolean;
  day: number;
  extra_recipients: string[];
  last_sent_at?: string;
}

const DEFAULT: ReminderCfg = { enabled: false, day: 3, extra_recipients: [] };

export function BankCsvReminderPanel({ canManage }: { canManage: boolean }) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [cfg, setCfg] = useState<ReminderCfg>(DEFAULT);
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      const { data } = await supabase.from("organizations").select("settings").eq("id", orgId).single();
      const stored = (data?.settings as any)?.bank_csv_reminder;
      const merged = { ...DEFAULT, ...(stored ?? {}) };
      setCfg(merged);
      setExtra((merged.extra_recipients || []).join(", "));
      setLoading(false);
    })();
  }, [orgId]);

  const save = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      const emails = extra.split(/[,;\s]+/).map((e) => e.trim()).filter((e) => /.+@.+\..+/.test(e));
      const { data: current } = await supabase.from("organizations").select("settings").eq("id", orgId).single();
      const next = { ...(current?.settings as any || {}), bank_csv_reminder: { ...cfg, extra_recipients: emails } };
      const { error } = await supabase.from("organizations").update({ settings: next }).eq("id", orgId);
      if (error) throw error;
      toast.success("Herinnering opgeslagen");
    } catch (e: any) { toast.error(e.message || "Opslaan mislukt"); }
    finally { setSaving(false); }
  };

  const sendTest = async () => {
    if (!orgId) return;
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-bank-csv-reminders", {
        body: { organization_id: orgId },
      });
      if (error) throw error;
      toast.success(`Test verzonden (${(data as any)?.results?.[0]?.sent ?? 0} e-mails)`);
    } catch (e: any) { toast.error(e.message || "Test mislukt"); }
    finally { setTesting(false); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Maandelijkse bank-CSV herinnering</CardTitle>
        <CardDescription>
          We sturen je elke maand een reminder om een CSV/MT940 export van je bank te uploaden.
          Zo blijft je administratie actueel — ook zonder directe bankkoppeling.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label className="text-sm">Reminder aan</Label>
            <p className="text-xs text-muted-foreground">Uit als je een directe bankkoppeling gebruikt of geen reminders wilt.</p>
          </div>
          <Switch disabled={!canManage} checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
        </div>

        <div className="grid gap-2 max-w-xs">
          <Label className="text-xs">Dag van de maand</Label>
          <Select value={String(cfg.day)} onValueChange={(v) => setCfg({ ...cfg, day: Number(v) })} disabled={!canManage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <SelectItem key={d} value={String(d)}>{d}e van de maand</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">We slaan de reminder over als je in de afgelopen 25 dagen al transacties hebt geïmporteerd.</p>
        </div>

        <div className="grid gap-2">
          <Label className="text-xs">Extra ontvangers (optioneel)</Label>
          <Input
            placeholder="boekhouder@example.com, partner@example.com"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            disabled={!canManage}
          />
          <p className="text-xs text-muted-foreground">Naast het hoofd-e-mailadres van je organisatie.</p>
        </div>

        {cfg.last_sent_at && (
          <p className="text-xs text-muted-foreground">Laatste verzending: {new Date(cfg.last_sent_at).toLocaleString("nl-NL")}</p>
        )}

        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={!canManage || saving}>
            {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />} Opslaan
          </Button>
          <Button size="sm" variant="outline" onClick={sendTest} disabled={!canManage || testing || !cfg.enabled}>
            {testing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />} Test verzenden
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
