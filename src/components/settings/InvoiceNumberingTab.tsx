import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface NumberingSettings {
  invoice_prefix: string;
  invoice_number_format: string;
  invoice_yearly_reset: boolean;
  invoice_next_seq: number;
  invoice_last_year: number | null;
}

const DEFAULTS: NumberingSettings = {
  invoice_prefix: "F",
  invoice_number_format: "{prefix}{year}-{seq:4}",
  invoice_yearly_reset: true,
  invoice_next_seq: 1,
  invoice_last_year: null,
};

function previewNumber(s: NumberingSettings): string {
  const year = new Date().getFullYear();
  return s.invoice_number_format
    .replace("{prefix}", s.invoice_prefix)
    .replace("{year}", String(year))
    .replace(/\{seq:(\d+)\}/g, (_, w) => String(s.invoice_next_seq).padStart(parseInt(w), "0"))
    .replace("{seq}", String(s.invoice_next_seq));
}

export function InvoiceNumberingTab({ canManage }: { canManage: boolean }) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [settings, setSettings] = useState<NumberingSettings>(DEFAULTS);
  const [autoArchive, setAutoArchive] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      const { data } = await supabase.from("organizations").select("settings, auto_archive_months").eq("id", orgId).single();
      const s = (data?.settings as any) || {};
      setSettings({
        invoice_prefix: s.invoice_prefix ?? DEFAULTS.invoice_prefix,
        invoice_number_format: s.invoice_number_format ?? DEFAULTS.invoice_number_format,
        invoice_yearly_reset: s.invoice_yearly_reset ?? DEFAULTS.invoice_yearly_reset,
        invoice_next_seq: s.invoice_next_seq ?? DEFAULTS.invoice_next_seq,
        invoice_last_year: s.invoice_last_year ?? null,
      });
      setAutoArchive((data as any)?.auto_archive_months ?? null);
      setLoading(false);
    })();
  }, [orgId]);

  const save = async () => {
    if (!orgId) return;
    setSaving(true);
    const { data: existing } = await supabase.from("organizations").select("settings").eq("id", orgId).single();
    const merged = { ...(existing?.settings as any || {}), ...settings };
    const { error } = await supabase
      .from("organizations")
      .update({ settings: merged, auto_archive_months: autoArchive } as any)
      .eq("id", orgId);
    setSaving(false);
    if (error) toast.error("Opslaan mislukt");
    else toast.success("Factuurnummering opgeslagen");
  };

  if (loading) return <div className="text-sm text-muted-foreground">Laden…</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Factuurnummering</CardTitle>
        <CardDescription>
          Bepaal hoe nieuwe factuurnummers worden gegenereerd. De Belastingdienst eist een doorlopende reeks per boekjaar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="prefix">Prefix</Label>
            <Input
              id="prefix"
              value={settings.invoice_prefix}
              maxLength={6}
              disabled={!canManage}
              onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">Bv. <code>F</code>, <code>INV</code>, <code>FAC-</code></p>
          </div>
          <div>
            <Label htmlFor="format">Nummerformaat</Label>
            <Input
              id="format"
              value={settings.invoice_number_format}
              disabled={!canManage}
              onChange={(e) => setSettings({ ...settings, invoice_number_format: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Placeholders: <code>{"{prefix}"}</code>, <code>{"{year}"}</code>, <code>{"{seq:N}"}</code> (N = breedte)
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <p className="text-sm font-medium">Jaarlijkse reset</p>
            <p className="text-xs text-muted-foreground">Teller springt op 1 januari terug naar 1 (aanbevolen).</p>
          </div>
          <Switch
            checked={settings.invoice_yearly_reset}
            disabled={!canManage}
            onCheckedChange={(v) => setSettings({ ...settings, invoice_yearly_reset: v })}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="seq">Volgend nummer</Label>
            <Input
              id="seq"
              type="number"
              min={1}
              value={settings.invoice_next_seq}
              disabled={!canManage}
              onChange={(e) => setSettings({ ...settings, invoice_next_seq: parseInt(e.target.value) || 1 })}
            />
            <p className="text-xs text-muted-foreground mt-1">Alleen aanpassen bij overstap van een ander systeem.</p>
          </div>
          <div>
            <Label>Voorbeeld eerstvolgende factuur</Label>
            <div className="h-10 flex items-center px-3 rounded-md border border-border bg-muted/30 font-mono text-sm">
              {previewNumber(settings)}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div>
            <p className="text-sm font-medium">Automatisch archiveren</p>
            <p className="text-xs text-muted-foreground">Betaalde facturen ouder dan gekozen periode verhuizen naar het archief. Ze blijven vindbaar onder tabblad Archief.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { v: null as number | null, label: "Uit" },
              { v: 6, label: "Na 6 maanden" },
              { v: 12, label: "Na 1 jaar" },
              { v: 24, label: "Na 2 jaar" },
            ].map((opt) => (
              <button
                key={String(opt.v)}
                disabled={!canManage}
                onClick={() => setAutoArchive(opt.v)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  autoArchive === opt.v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={!canManage || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Opslaan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
