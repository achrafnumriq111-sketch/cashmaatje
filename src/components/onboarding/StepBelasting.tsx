import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { OnboardingData } from "@/pages/Onboarding";

interface Props {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

const MONTHS = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

export default function StepBelasting({ data, setData }: Props) {
  const update = (field: keyof OnboardingData["tax"], value: any) => {
    setData((d) => ({ ...d, tax: { ...d.tax, [field]: value } }));
  };

  const korEligible = data.tax.expectedRevenue > 0 && data.tax.expectedRevenue <= 20000;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Belastinginstellingen</h2>
        <p className="mt-1 text-muted-foreground">Stel je BTW-voorkeuren in voor correcte aangiftes.</p>
      </div>

      <div className="grid gap-6">
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <Label className="text-base">BTW-plichtig?</Label>
            <p className="text-sm text-muted-foreground">Is je bedrijf BTW-plichtig?</p>
          </div>
          <Switch checked={data.tax.btwPlichtig} onCheckedChange={(v) => update("btwPlichtig", v)} />
        </div>

        {data.tax.btwPlichtig && (
          <>
            <div className="space-y-3">
              <Label>BTW-schema</Label>
              <RadioGroup value={data.tax.vatScheme} onValueChange={(v) => update("vatScheme", v)} className="grid gap-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 has-[data-state=checked]:border-primary has-[data-state=checked]:bg-primary/5">
                  <RadioGroupItem value="standard" />
                  <div>
                    <p className="font-medium text-foreground">Standaard</p>
                    <p className="text-sm text-muted-foreground">Regulier BTW-schema</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 has-[data-state=checked]:border-primary has-[data-state=checked]:bg-primary/5">
                  <RadioGroupItem value="kor" />
                  <div>
                    <p className="font-medium text-foreground">KOR (Kleineondernemersregeling)</p>
                    <p className="text-sm text-muted-foreground">Vrijgesteld van BTW bij omzet ≤ €20.000</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Aangiftefrequentie</Label>
              <Select value={data.tax.vatFrequency} onValueChange={(v) => update("vatFrequency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Per maand</SelectItem>
                  <SelectItem value="quarterly">Per kwartaal</SelectItem>
                  <SelectItem value="yearly">Per jaar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Boekjaar start maand</Label>
          <Select value={String(data.tax.fiscalYearStartMonth)} onValueChange={(v) => update("fiscalYearStartMonth", parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {data.tax.vatScheme === "kor" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Verwachte jaaromzet (€)</Label>
              <Input type="number" value={data.tax.expectedRevenue || ""} onChange={(e) => update("expectedRevenue", parseFloat(e.target.value) || 0)} placeholder="15000" />
            </div>
            <div className="flex items-center gap-2">
              {korEligible ? (
                <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary">
                  <CheckCircle2 className="h-3 w-3" /> KOR komt in aanmerking
                </Badge>
              ) : data.tax.expectedRevenue > 20000 ? (
                <Badge variant="outline" className="gap-1 border-destructive/30 bg-destructive/10 text-destructive">
                  <AlertCircle className="h-3 w-3" /> Omzet te hoog voor KOR
                </Badge>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
