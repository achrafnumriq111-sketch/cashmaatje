import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Upload, Trash2, Palette } from "lucide-react";
import { toast } from "sonner";

interface OrgBranding {
  logo_url: string | null;
  brand_primary?: string | null;
  brand_secondary?: string | null;
}

function hexToHsl(hex: string): string | null {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function applyBrandColors(opts: { primary?: string | null; secondary?: string | null }) {
  const root = document.documentElement;
  if (opts.primary) {
    const hsl = hexToHsl(opts.primary);
    if (hsl) {
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--sidebar-primary", hsl);
    }
  }
  if (opts.secondary) {
    const hsl = hexToHsl(opts.secondary);
    if (hsl) {
      root.style.setProperty("--secondary", hsl);
      root.style.setProperty("--accent", hsl);
    }
  }
}

export default function BrandingPanel() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [branding, setBranding] = useState<OrgBranding>({ logo_url: null, brand_primary: "#10B981", brand_secondary: "#1f2937" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      const { data } = await supabase
        .from("organizations")
        .select("logo_url, settings")
        .eq("id", orgId)
        .single();
      if (data) {
        const settings = (data.settings as any) ?? {};
        const next = {
          logo_url: data.logo_url,
          brand_primary: settings.brand_primary ?? "#10B981",
          brand_secondary: settings.brand_secondary ?? "#1f2937",
        };
        setBranding(next);
        applyBrandColors({ primary: next.brand_primary, secondary: next.brand_secondary });
      }
    })();
  }, [orgId]);

  const handleUpload = async (file: File) => {
    if (!orgId) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo max 2MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${orgId}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: dbErr } = await supabase.from("organizations").update({ logo_url: url }).eq("id", orgId);
      if (dbErr) throw dbErr;
      setBranding({ ...branding, logo_url: url });
      toast.success("Logo geüpload");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload mislukt");
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!orgId) return;
    await supabase.from("organizations").update({ logo_url: null }).eq("id", orgId);
    setBranding({ ...branding, logo_url: null });
    toast.success("Logo verwijderd");
  };

  const saveColors = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      const { data: cur } = await supabase.from("organizations").select("settings").eq("id", orgId).single();
      const settings = ((cur?.settings as any) ?? {});
      settings.brand_primary = branding.brand_primary;
      settings.brand_secondary = branding.brand_secondary;
      const { error } = await supabase.from("organizations").update({ settings }).eq("id", orgId);
      if (error) throw error;
      applyBrandColors({ primary: branding.brand_primary, secondary: branding.brand_secondary });
      toast.success("Kleuren opgeslagen");
    } catch (e: any) {
      toast.error(e?.message ?? "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="arcory-glass">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4 text-primary" />Branding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Bedrijfslogo</Label>
          <div className="mt-2 flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border border-border bg-muted/20 flex items-center justify-center overflow-hidden">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="inline-flex">
                <Input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
                />
                <Button type="button" variant="outline" size="sm" disabled={uploading} className="gap-2"
                  onClick={(e) => (e.currentTarget.previousSibling as HTMLInputElement)?.click()}>
                  <Upload className="h-4 w-4" /> {uploading ? "Bezig..." : "Upload logo"}
                </Button>
              </label>
              {branding.logo_url && (
                <Button type="button" variant="ghost" size="sm" onClick={removeLogo} className="gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" /> Verwijderen
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG/JPG/SVG, max 2MB</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Primaire kleur</Label>
            <div className="flex gap-2 mt-1">
              <input type="color" value={branding.brand_primary ?? "#10B981"}
                onChange={(e) => setBranding({ ...branding, brand_primary: e.target.value })}
                className="w-12 h-10 rounded-lg cursor-pointer border border-border" />
              <Input value={branding.brand_primary ?? ""}
                onChange={(e) => setBranding({ ...branding, brand_primary: e.target.value })}
                className="font-mono text-xs" />
            </div>
          </div>
          <div>
            <Label>Secundaire kleur</Label>
            <div className="flex gap-2 mt-1">
              <input type="color" value={branding.brand_secondary ?? "#1f2937"}
                onChange={(e) => setBranding({ ...branding, brand_secondary: e.target.value })}
                className="w-12 h-10 rounded-lg cursor-pointer border border-border" />
              <Input value={branding.brand_secondary ?? ""}
                onChange={(e) => setBranding({ ...branding, brand_secondary: e.target.value })}
                className="font-mono text-xs" />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={saveColors} disabled={saving}>{saving ? "Opslaan..." : "Kleuren opslaan"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
