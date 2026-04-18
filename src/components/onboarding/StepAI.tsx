import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain } from "lucide-react";
import type { OnboardingData } from "@/pages/Onboarding";

interface Props {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

export default function StepAI({ data, setData }: Props) {
  const update = (field: keyof OnboardingData["ai"], value: any) => {
    setData((d) => ({ ...d, ai: { ...d.ai, [field]: value } }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">AI-instellingen</h2>
        <p className="mt-1 text-muted-foreground">Bepaal hoe AI je boekhouding ondersteunt.</p>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-primary" />
          <p className="text-sm text-foreground">
            Cash Maatje gebruikt AI om transacties automatisch te categoriseren en facturen te verwerken. Je houdt altijd de controle.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <Label className="text-base">Auto-categorisatie</Label>
            <p className="text-sm text-muted-foreground">Categoriseer transacties automatisch</p>
          </div>
          <Switch checked={data.ai.autoCategorize} onCheckedChange={(v) => update("autoCategorize", v)} />
        </div>

        {data.ai.autoCategorize && (
          <>
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <Label>Auto-toepassen drempel</Label>
                <span className="text-sm font-medium text-primary">{data.ai.autoApplyThreshold}%</span>
              </div>
              <Slider
                value={[data.ai.autoApplyThreshold]}
                onValueChange={([v]) => update("autoApplyThreshold", v)}
                min={50}
                max={95}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Suggesties boven deze betrouwbaarheid worden automatisch toegepast.
              </p>
            </div>

            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <Label>Auto-accepteer drempel</Label>
                <span className="text-sm font-medium text-primary">{data.ai.autoAcceptThreshold}%</span>
              </div>
              <Slider
                value={[data.ai.autoAcceptThreshold]}
                onValueChange={([v]) => update("autoAcceptThreshold", v)}
                min={50}
                max={95}
                step={5}
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Taal</Label>
          <Select value={data.ai.language} onValueChange={(v) => update("language", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nl">Nederlands</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>AI-uitleg tonen</Label>
          <Select value={data.ai.showExplanations} onValueChange={(v) => update("showExplanations", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="always">Altijd</SelectItem>
              <SelectItem value="hover">Bij hover</SelectItem>
              <SelectItem value="never">Nooit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
