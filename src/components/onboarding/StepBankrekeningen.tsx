import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Building2, Zap, FileUp, Hand, AlertCircle, CheckCircle2 } from "lucide-react";
import type { OnboardingData } from "@/pages/Onboarding";
import { validateIBAN, validateBIC, bankFromIBAN } from "@/lib/validators";
import { cn } from "@/lib/utils";

interface Props {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

const emptyAccount = { name: "", iban: "", bic: "", bankName: "", isPrimary: false };

const METHODS = [
  {
    id: "psd2" as const,
    icon: Zap,
    title: "PSD2 koppeling",
    desc: "Automatisch transacties ophalen via je bank (ING/Rabo/ABN/bunq…).",
    badge: "Aanbevolen",
  },
  {
    id: "csv" as const,
    icon: FileUp,
    title: "CSV / MT940 import",
    desc: "Upload zelf bankafschriften. Na onboarding kun je meteen testen.",
  },
  {
    id: "manual" as const,
    icon: Hand,
    title: "Handmatig",
    desc: "Voeg later transacties één voor één toe. Skip bankkoppeling nu.",
  },
];

export default function StepBankrekeningen({ data, setData }: Props) {
  const accounts = data.bankAccounts;
  const method = data.bankMethod ?? "psd2";

  const setMethod = (m: OnboardingData["bankMethod"]) =>
    setData((d) => ({ ...d, bankMethod: m }));

  const addAccount = () => {
    setData((d) => ({
      ...d,
      bankAccounts: [...d.bankAccounts, { ...emptyAccount, isPrimary: d.bankAccounts.length === 0 }],
    }));
  };

  const removeAccount = (i: number) => {
    setData((d) => {
      const updated = d.bankAccounts.filter((_, idx) => idx !== i);
      if (updated.length > 0 && !updated.some((a) => a.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return { ...d, bankAccounts: updated };
    });
  };

  const updateAccount = (i: number, field: string, value: any) => {
    setData((d) => {
      const updated = [...d.bankAccounts];
      updated[i] = { ...updated[i], [field]: value };

      // Auto-fill bankname from IBAN
      if (field === "iban" && !updated[i].bankName) {
        const detected = bankFromIBAN(value);
        if (detected) updated[i].bankName = detected;
      }

      if (field === "isPrimary" && value) {
        updated.forEach((a, idx) => { if (idx !== i) a.isPrimary = false; });
      }
      return { ...d, bankAccounts: updated };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Bankkoppeling</h2>
        <p className="mt-1 text-muted-foreground">Kies hoe je transacties wilt binnenhalen — je kunt dit later wijzigen.</p>
      </div>

      {/* Method picker */}
      <div className="grid gap-3 sm:grid-cols-3">
        {METHODS.map((m) => {
          const Icon = m.icon;
          const active = method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={cn(
                "text-left rounded-xl border p-4 transition-all hover:border-primary/60",
                active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border bg-card",
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{m.title}</span>
                {m.badge && (
                  <span className="ml-auto text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Per-method hint */}
      {method === "psd2" && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Voeg hieronder je IBAN(s) toe. Direct na onboarding sturen we je naar de PSD2-koppelpagina om de verbinding te autoriseren bij je bank.
        </div>
      )}
      {method === "csv" && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Voeg je IBAN(s) toe. Na onboarding open je direct de importpagina waar je een testbestand (CSV/MT940/CAMT) kunt uploaden.
        </div>
      )}

      {/* Account list (skip for manual) */}
      {method !== "manual" && (
        <>
          <div className="space-y-4">
            {accounts.map((acc, i) => {
              const ibanErr = validateIBAN(acc.iban, true).error;
              const bicErr = validateBIC(acc.bic).error;
              const ibanOk = !ibanErr && acc.iban.length > 0;
              return (
                <Card key={i} className="relative">
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Rekening {i + 1}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeAccount(i)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Naam</Label>
                          <Input value={acc.name} onChange={(e) => updateAccount(i, "name", e.target.value)} placeholder="Zakelijke rekening" />
                        </div>
                        <div className="space-y-2">
                          <Label>Bank</Label>
                          <Input value={acc.bankName} onChange={(e) => updateAccount(i, "bankName", e.target.value)} placeholder="ING, ABN AMRO, Rabobank…" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>IBAN *</Label>
                          <Input
                            value={acc.iban}
                            onChange={(e) => updateAccount(i, "iban", e.target.value.toUpperCase().replace(/\s+/g, ""))}
                            placeholder="NL00INGB0000000000"
                            aria-invalid={!!ibanErr}
                          />
                          {ibanErr && (
                            <p className="flex items-center gap-1.5 text-xs text-destructive">
                              <AlertCircle className="h-3 w-3" /> {ibanErr}
                            </p>
                          )}
                          {ibanOk && (
                            <p className="flex items-center gap-1.5 text-xs text-emerald-500">
                              <CheckCircle2 className="h-3 w-3" /> Geldig IBAN
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>BIC</Label>
                          <Input
                            value={acc.bic}
                            onChange={(e) => updateAccount(i, "bic", e.target.value.toUpperCase())}
                            placeholder="INGBNL2A"
                            aria-invalid={!!bicErr}
                          />
                          {bicErr && (
                            <p className="flex items-center gap-1.5 text-xs text-destructive">
                              <AlertCircle className="h-3 w-3" /> {bicErr}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={acc.isPrimary} onCheckedChange={(v) => updateAccount(i, "isPrimary", v)} />
                        <Label className="cursor-pointer text-sm">Hoofdrekening</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button variant="outline" onClick={addAccount} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Bankrekening toevoegen
          </Button>
        </>
      )}
    </div>
  );
}
