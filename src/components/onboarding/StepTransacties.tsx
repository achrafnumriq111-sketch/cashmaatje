import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ListChecks } from "lucide-react";

export default function StepTransacties() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Eerste transacties controleren</h2>
        <p className="mt-1 text-muted-foreground">
          Bekijk hoe AI je transacties categoriseert en pas aan waar nodig.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ListChecks className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">Nog geen transacties geïmporteerd</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Na het importeren van bankafschriften kun je hier de AI-suggesties controleren.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            Je kunt transacties altijd controleren via de Transacties-pagina.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
