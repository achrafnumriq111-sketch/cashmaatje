import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Building2 } from "lucide-react";
import type { OnboardingData } from "@/pages/Onboarding";

interface Props {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

const emptyAccount = { name: "", iban: "", bic: "", bankName: "", isPrimary: false };

export default function StepBankrekeningen({ data, setData }: Props) {
  const accounts = data.bankAccounts;

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
      if (field === "isPrimary" && value) {
        updated.forEach((a, idx) => { if (idx !== i) a.isPrimary = false; });
      }
      return { ...d, bankAccounts: updated };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Bankrekeningen</h2>
        <p className="mt-1 text-muted-foreground">Voeg je zakelijke bankrekeningen toe.</p>
      </div>

      <div className="space-y-4">
        {accounts.map((acc, i) => (
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
                    <Input value={acc.iban} onChange={(e) => updateAccount(i, "iban", e.target.value.toUpperCase())} placeholder="NL00INGB0000000000" />
                  </div>
                  <div className="space-y-2">
                    <Label>BIC</Label>
                    <Input value={acc.bic} onChange={(e) => updateAccount(i, "bic", e.target.value.toUpperCase())} placeholder="INGBNL2A" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={acc.isPrimary} onCheckedChange={(v) => updateAccount(i, "isPrimary", v)} />
                  <Label className="cursor-pointer text-sm">Hoofdrekening</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addAccount} className="w-full gap-2">
        <Plus className="h-4 w-4" /> Bankrekening toevoegen
      </Button>
    </div>
  );
}
