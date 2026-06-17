import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, ImageIcon, AlertCircle, CheckCircle2, FileDown } from "lucide-react";
import type { OnboardingData } from "@/pages/Onboarding";
import { previewInvoiceNumbers } from "@/lib/validators";
import { generateSampleInvoicePdf } from "@/lib/invoicePdfPreview";

interface Props {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

const ACCEPTED = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

export default function StepHuisstijl({ data, setData }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoInfo, setLogoInfo] = useState<{ w: number; h: number } | null>(null);

  // Restore preview when navigating back
  useEffect(() => {
    if (data.logoFile && !preview) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(data.logoFile);
    }
  }, [data.logoFile, preview]);

  const onPick = (f: File | null) => {
    setLogoError(null);
    setLogoInfo(null);
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setLogoError("Alleen PNG, JPG, SVG of WebP toegestaan");
      return;
    }
    if (f.size > MAX_BYTES) {
      setLogoError(`Max 2MB (huidig: ${(f.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }
    setData((d) => ({ ...d, logoFile: f }));
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setPreview(url);
      // Dimensie check (skip SVG)
      if (f.type !== "image/svg+xml") {
        const img = new Image();
        img.onload = () => {
          setLogoInfo({ w: img.width, h: img.height });
          if (img.width < 100 || img.height < 100) {
            setLogoError("Logo is erg klein — minimaal 100×100px aanbevolen voor scherpte op facturen");
          }
        };
        img.src = url;
      }
    };
    reader.readAsDataURL(f);
  };

  const removeLogo = () => {
    setData((d) => ({ ...d, logoFile: undefined }));
    setPreview(null);
    setLogoError(null);
    setLogoInfo(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const updateN = <K extends keyof OnboardingData["numbering"]>(k: K, v: OnboardingData["numbering"][K]) =>
    setData((d) => ({ ...d, numbering: { ...d.numbering, [k]: v } }));

  const nextThree = previewInvoiceNumbers(data.numbering, 3);
  const nextYear = previewInvoiceNumbers(
    { ...data.numbering, nextSeq: data.numbering.yearlyReset ? 1 : data.numbering.nextSeq + 3 },
    1,
    new Date().getFullYear() + 1,
  )[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Huisstijl & factuurnummering</h2>
        <p className="mt-1 text-muted-foreground">Upload je logo en bepaal hoe je facturen genummerd worden.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Label>Bedrijfslogo</Label>
          <div className="flex items-start gap-4">
            <div className="h-24 w-24 shrink-0 rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
              {preview ? (
                <img src={preview} alt="Logo preview" className="h-full w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <ImageIcon className="h-7 w-7" />
                  <span className="text-[10px]">Standaard</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED.join(",")}
                className="hidden"
                onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" /> {preview ? "Vervangen" : "Logo uploaden"}
                </Button>
                {preview && (
                  <Button type="button" variant="ghost" size="sm" onClick={removeLogo} className="text-muted-foreground">
                    <X className="h-4 w-4 mr-2" /> Verwijderen
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG of WebP — max 2MB, vierkant werkt het best.</p>
              {logoInfo && !logoError && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-500">
                  <CheckCircle2 className="h-3 w-3" /> {logoInfo.w}×{logoInfo.h}px — geschikt voor facturen
                </p>
              )}
              {logoError && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" /> {logoError}
                </p>
              )}
              {!preview && (
                <p className="text-xs text-muted-foreground italic">
                  Geen logo? Facturen tonen automatisch je bedrijfsnaam als fallback.
                </p>
              )}
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

          {/* Live preview */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-medium text-foreground">Voorbeeld eerstvolgende facturen</p>
            <div className="flex flex-wrap gap-2">
              {nextThree.map((n, i) => (
                <span
                  key={i}
                  className={`font-mono text-sm px-2.5 py-1 rounded-md border ${
                    i === 0 ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {n}
                  {i === 0 && <span className="ml-1.5 text-[10px] uppercase text-primary">eerste</span>}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Eerste factuur volgend jaar: <code className="font-mono text-foreground">{nextYear}</code>
              {data.numbering.yearlyReset ? " (reset)" : " (doorlopend)"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
