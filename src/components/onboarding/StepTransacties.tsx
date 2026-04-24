import { CheckCircle2, ListChecks, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { OnboardingData } from "@/pages/Onboarding";

interface Props {
  data: OnboardingData;
}

export default function StepTransacties({ data }: Props) {
  const bankCount = data.pendingBankRows?.length ?? 0;
  const contactCount = data.pendingContacts?.length ?? 0;
  const obCount = data.pendingOpeningBalance?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Eerste transacties controleren</h2>
        <p className="mt-1 text-muted-foreground">
          Een overzicht van wat klaar staat. Na afronden categoriseert de AI alle transacties automatisch en kun je ze controleren.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={ListChecks} label="Banktransacties" value={bankCount} />
        <StatCard icon={Sparkles} label="Contacten" value={contactCount} />
        <StatCard icon={CheckCircle2} label="Openingsregels" value={obCount} />
      </div>

      <Card>
        <CardContent className="space-y-2 py-5 text-sm">
          <p className="font-medium text-foreground">Wat gebeurt er na afronden?</p>
          <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
            <li>De AI categoriseert je banktransacties automatisch met confidence-scores.</li>
            <li>Voorgestelde matches met facturen verschijnen op de Reconciliatie-pagina.</li>
            <li>Je kunt alles altijd controleren en aanpassen via Transacties en Documenten.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof ListChecks; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 py-5 text-center">
        <Icon className="h-5 w-5 text-primary" />
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
