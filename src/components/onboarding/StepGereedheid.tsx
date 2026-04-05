import { CheckCircle2, XCircle } from "lucide-react";
import type { OnboardingData } from "@/pages/Onboarding";

interface Props {
  data: OnboardingData;
}

interface Check {
  label: string;
  passed: boolean;
}

export default function StepGereedheid({ data }: Props) {
  const checks: Check[] = [
    { label: "Bedrijfsnaam ingevuld", passed: !!data.company.name },
    { label: "BTW-nummer ingesteld", passed: !!data.company.btwNumber },
    { label: "Bankrekening gekoppeld", passed: data.bankAccounts.length > 0 },
    { label: "Rekeningschema wordt geladen", passed: true },
    { label: "BTW-tarieven worden geconfigureerd", passed: true },
    { label: "Boekjaar periodes worden aangemaakt", passed: true },
    { label: "Eerste transacties verwerkt", passed: false },
  ];

  const passedCount = checks.filter((c) => c.passed).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">BTW-gereedheid check</h2>
        <p className="mt-1 text-muted-foreground">
          Controleer of alles klaar is om te beginnen met je administratie.
        </p>
      </div>

      <div className="text-center">
        <div className="text-4xl font-bold text-foreground">
          {passedCount}/{checks.length}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">checks geslaagd</p>
      </div>

      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-3 rounded-lg border border-border p-3">
            {check.passed ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 text-destructive" />
            )}
            <span className={`text-sm ${check.passed ? "text-foreground" : "text-muted-foreground"}`}>
              {check.label}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-primary/5 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Ontbrekende items worden automatisch aangemaakt bij het afronden. Je kunt altijd later aanvullen.
        </p>
      </div>
    </div>
  );
}
