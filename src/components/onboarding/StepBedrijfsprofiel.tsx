import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import type { OnboardingData } from "@/pages/Onboarding";
import { validateKvK, validateBTW, validatePostcode, validateEmail } from "@/lib/validators";

const LEGAL_FORMS = [
  { value: "eenmanszaak", label: "Eenmanszaak" },
  { value: "vof", label: "VOF" },
  { value: "bv", label: "BV" },
  { value: "nv", label: "NV" },
  { value: "stichting", label: "Stichting" },
  { value: "maatschap", label: "Maatschap" },
  { value: "cv", label: "CV" },
];

const INDUSTRIES = [
  { value: "zzp_it", label: "ZZP — IT/Consultancy" },
  { value: "webshop", label: "Webshop / E-commerce" },
  { value: "horeca", label: "Horeca" },
  { value: "bouw", label: "Bouw / Installatie" },
  { value: "holding", label: "Holding / Investering" },
  { value: "retail", label: "Retail" },
  { value: "zorg", label: "Zorg" },
  { value: "creatief", label: "Creatief / Design" },
  { value: "overig", label: "Overig" },
];

interface Props {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}

export default function StepBedrijfsprofiel({ data, setData }: Props) {
  const update = (field: keyof OnboardingData["company"], value: string) => {
    setData((d) => ({ ...d, company: { ...d.company, [field]: value } }));
  };

  const formatBtw = (v: string) => {
    const cleaned = v.replace(/[^0-9bB]/g, "").toUpperCase();
    if (cleaned.length === 0) return "";
    return `NL${cleaned.slice(0, 12)}`;
  };

  const kvkError = validateKvK(data.company.kvkNumber).error;
  const btwError = validateBTW(data.company.btwNumber).error;
  const postcodeError = validatePostcode(data.company.addressPostalCode).error;
  const emailError = validateEmail(data.company.email).error;
  const nameError = !data.company.name?.trim() ? "Bedrijfsnaam is verplicht" : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Vertel ons over je bedrijf</h2>
        <p className="mt-1 text-muted-foreground">We gebruiken deze gegevens voor facturen en belastingaangiftes.</p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Bedrijfsnaam *</Label>
          <Input
            id="name"
            value={data.company.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Bijv. Jansen Consultancy"
            aria-invalid={!!nameError}
          />
          <FieldError message={nameError} />
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

        <div className="space-y-2">
          <Label>Branche / sector</Label>
          <Select value={data.company.industry} onValueChange={(v) => update("industry", v)}>
            <SelectTrigger><SelectValue placeholder="Kies je branche" /></SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">We stemmen rekeningschema, BTW-codes en dashboard-widgets hierop af.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kvk">KVK-nummer</Label>
            <Input
              id="kvk"
              value={data.company.kvkNumber}
              onChange={(e) => update("kvkNumber", e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="12345678"
              maxLength={8}
              aria-invalid={!!kvkError}
            />
            <FieldError message={kvkError} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="btw">BTW-nummer</Label>
            <Input
              id="btw"
              value={data.company.btwNumber}
              onChange={(e) => update("btwNumber", formatBtw(e.target.value))}
              placeholder="NL123456789B01"
              maxLength={14}
              aria-invalid={!!btwError}
            />
            <FieldError message={btwError} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">Adres</Label>
          <Input id="street" value={data.company.addressStreet} onChange={(e) => update("addressStreet", e.target.value)} placeholder="Straat en huisnummer" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postal">Postcode</Label>
            <Input
              id="postal"
              value={data.company.addressPostalCode}
              onChange={(e) => update("addressPostalCode", e.target.value.toUpperCase().slice(0, 7))}
              placeholder="1234 AB"
              aria-invalid={!!postcodeError}
            />
            <FieldError message={postcodeError} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Plaats</Label>
            <Input id="city" value={data.company.addressCity} onChange={(e) => update("addressCity", e.target.value)} placeholder="Amsterdam" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={data.company.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="info@bedrijf.nl"
              aria-invalid={!!emailError}
            />
            <FieldError message={emailError} />
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
