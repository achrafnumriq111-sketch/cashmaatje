import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, ImageIcon } from "lucide-react";
import type { OnboardingData } from "@/pages/Onboarding";

interface Props {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

function previewNumber(n: OnboardingData["numbering"]): string {
  const year = new Date().getFullYear();
  return n.format
    .replace("{prefix}", n.prefix)
    .replace("{year}", String(year))
    .replace(/\{seq:(\d+)\}/g, (_, w) => String(n.nextSeq).padStart(parseInt(w), "0"))
    .replace("{seq}", String(n.nextSeq));
}

export default function StepHuisstijl({ data, setData }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onPick = (f: File | null) => {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      alert("Logo mag max 2MB zijn");
      return;
    }
    setData((d) => ({ ...d, logoFile: f }));
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const removeLogo = () => {
    setData((d) => ({ ...d, logoFile: undefined }));
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const updateN = <K extends keyof OnboardingData["numbering"]>(k: K, v: OnboardingData["numbering"][K]) =>
    setData((d) => ({ ...d, numbering: { ...d.numbering, [k]: v } }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Huisstijl & factuurnummering</h2>
        <p className="mt-1 text-muted-foreground">Upload je logo en bepaal hoe je facturen genummerd worden.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Label>Bedrijfslogo</Label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
              {preview ? (
                <img src={preview} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> {preview ? "Vervangen" : "Logo uploaden"}
              </Button>
              {preview && (
                <Button type="button" variant="ghost" size="sm" onClick={removeLogo} className="text-muted-foreground">
                  <X className="h-4 w-4 mr-2" /> Verwijderen
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG of WebP. Max 2MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div>
            <Label className="text-base">Factuurnummering</Label>
            <p className="text-xs text-muted-foreground mt-1">
              De Belastingdienst eist een doorlopende reeks per boekjaar.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                maxLength={6}
                value={data.numbering.prefix}
                onChange={(e) => updateN("prefix", e.target.value)}
                placeholder="F"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Formaat</Label>
              <Input
                id="format"
                value={data.numbering.format}
                onChange={(e) => updateN("format", e.target.value)}
                placeholder="{prefix}{year}-{seq:4}"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Placeholders: <code>{"{prefix}"}</code>, <code>{"{year}"}</code>, <code>{"{seq:N}"}</code>
          </p>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">Jaarlijkse reset</p>
              <p className="text-xs text-muted-foreground">Teller springt op 1 januari terug naar 1 (aanbevolen).</p>
            </div>
            <Switch
              checked={data.numbering.yearlyReset}
              onCheckedChange={(v) => updateN("yearlyReset", v)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seq">Volgend nummer</Label>
              <Input
                id="seq"
                type="number"
                min={1}
                value={data.numbering.nextSeq}
                onChange={(e) => updateN("nextSeq", parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">Pas aan bij overstap van ander systeem.</p>
            </div>
            <div className="space-y-2">
              <Label>Voorbeeld</Label>
              <div className="h-10 flex items-center px-3 rounded-md border border-border bg-muted/30 font-mono text-sm">
                {previewNumber(data.numbering)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
