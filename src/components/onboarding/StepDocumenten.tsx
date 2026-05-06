import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Settings, Copy, Check, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { OnboardingData } from "@/pages/Onboarding";

interface Props {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

export default function StepDocumenten({ data, setData }: Props) {
  const [copied, setCopied] = useState(false);
  // Generate a forwarding address preview based on the company name (until org id exists)
  const [previewAddress] = useState(() => {
    const slug = (data.company.name || "org").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12) || "nieuwe-org";
    return `inbox-${slug}@inbox.cashmaatje.com`;
  });

  const prefs = data.documents ?? { autoOcr: true, autoCategorize: true, duplicateCheck: true, autoAttachToTransaction: true, defaultExpenseAccount: "7600" };
  useEffect(() => {
    if (!data.documents) setData((d) => ({ ...d, documents: prefs }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upd = (patch: Partial<typeof prefs>) => setData((d) => ({ ...d, documents: { ...prefs, ...patch } }));

  const copyAddr = () => {
    navigator.clipboard.writeText(previewAddress);
    setCopied(true);
    toast.success("E-mailadres gekopieerd");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Documenten instellen</h2>
        <p className="mt-1 text-muted-foreground">Bepaal hoe inkomende facturen en bonnetjes verwerkt worden.</p>
      </div>

      <Card>
        <CardContent className="space-y-3 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Auto-forwarding e-mailadres</p>
              <p className="text-sm text-muted-foreground">Stuur leveranciersfacturen door naar dit adres. CashMaatje verwerkt ze automatisch.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input readOnly value={previewAddress} className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copyAddr}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Het definitieve adres verschijnt na afronden in <span className="font-medium">Instellingen → Documenten</span>.</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Verwerkingsvoorkeuren</p>
              <p className="text-sm text-muted-foreground">Bepaal hoe ver de AI mag gaan zonder jouw goedkeuring.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Toggle label="Automatische OCR (tekstherkenning)" description="Lees factuurdata zoals bedrag, datum en leverancier automatisch."
              checked={prefs.autoOcr} onChange={(v) => upd({ autoOcr: v })} />
            <Toggle label="Automatisch categoriseren" description="Wijs een grootboekrekening toe op basis van AI-suggestie."
              checked={prefs.autoCategorize} onChange={(v) => upd({ autoCategorize: v })} />
            <Toggle label="Duplicaat-controle" description="Waarschuw bij dubbele facturen of bonnetjes."
              checked={prefs.duplicateCheck} onChange={(v) => upd({ duplicateCheck: v })} />
            <Toggle label="Auto-koppelen aan banktransactie" description="Match documenten aan bestaande bankregels."
              checked={prefs.autoAttachToTransaction} onChange={(v) => upd({ autoAttachToTransaction: v })} />

            <div className="space-y-2">
              <Label className="text-sm">Standaard kostenrekening</Label>
              <Input value={prefs.defaultExpenseAccount} onChange={(e) => upd({ defaultExpenseAccount: e.target.value })}
                placeholder="bijv. 7600 (Algemene kosten)" />
              <p className="text-xs text-muted-foreground">Code uit het rekeningschema. Wordt gebruikt als de AI geen specifieke rekening kan voorstellen.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 py-4">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Bestaande documenten upload je later via <span className="font-medium">Documenten</span>.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
