import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OnboardingData } from "@/pages/Onboarding";

const LEGAL_FORMS = [
  { value: "eenmanszaak", label: "Eenmanszaak" },
  { value: "vof", label: "VOF" },
  { value: "bv", label: "BV" },
  { value: "nv", label: "NV" },
  { value: "stichting", label: "Stichting" },
  { value: "maatschap", label: "Maatschap" },
  { value: "cv", label: "CV" },
];

interface Props {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

export default function StepBedrijfsprofiel({ data, setData }: Props) {
  const update = (field: keyof OnboardingData["company"], value: string) => {
    setData((d) => ({ ...d, company: { ...d.company, [field]: value } }));
  };

  const formatBtw = (v: string) => {
    const digits = v.replace(/[^0-9bB]/g, "").toUpperCase();
    if (digits.length <= 2) return `NL${digits}`;
    return `NL${digits.slice(0, 12)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Vertel ons over je bedrijf</h2>
        <p className="mt-1 text-muted-foreground">We gebruiken deze gegevens voor facturen en belastingaangiftes.</p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Bedrijfsnaam *</Label>
          <Input id="name" value={data.company.name} onChange={(e) => update("name", e.target.value)} placeholder="Bijv. Jansen Consultancy" />
        </div>

        <div className="space-y-2">
          <Label>Rechtsvorm</Label>
          <Select value={data.company.legalForm} onValueChange={(v) => update("legalForm", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEGAL_FORMS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kvk">KVK-nummer</Label>
            <Input id="kvk" value={data.company.kvkNumber} onChange={(e) => update("kvkNumber", e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="12345678" maxLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="btw">BTW-nummer</Label>
            <Input id="btw" value={data.company.btwNumber} onChange={(e) => update("btwNumber", formatBtw(e.target.value))} placeholder="NL000000000B01" maxLength={16} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">Adres</Label>
          <Input id="street" value={data.company.addressStreet} onChange={(e) => update("addressStreet", e.target.value)} placeholder="Straat en huisnummer" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postal">Postcode</Label>
            <Input id="postal" value={data.company.addressPostalCode} onChange={(e) => update("addressPostalCode", e.target.value)} placeholder="1234 AB" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Plaats</Label>
            <Input id="city" value={data.company.addressCity} onChange={(e) => update("addressCity", e.target.value)} placeholder="Amsterdam" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={data.company.email} onChange={(e) => update("email", e.target.value)} placeholder="info@bedrijf.nl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefoon</Label>
            <Input id="phone" value={data.company.phone} onChange={(e) => update("phone", e.target.value)} placeholder="06-12345678" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={data.company.website} onChange={(e) => update("website", e.target.value)} placeholder="www.bedrijf.nl" />
          </div>
        </div>
      </div>
    </div>
  );
}
