import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Users } from "lucide-react";

const IMPORT_OPTIONS = [
  {
    icon: FileSpreadsheet,
    title: "Openingsbalans",
    description: "Upload je openingsbalans als CSV of voer handmatig in.",
    future: false,
  },
  {
    icon: Upload,
    title: "Bankafschriften",
    description: "Importeer bankafschriften als CSV (MT940, CAMT.053).",
    future: false,
  },
  {
    icon: Users,
    title: "Contacten",
    description: "Importeer bestaande klanten en leveranciers als CSV.",
    future: false,
  },
];

export default function StepImport() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Historische data importeren</h2>
        <p className="mt-1 text-muted-foreground">
          Je kunt dit nu doen of later via Instellingen. Sla deze stap gerust over.
        </p>
      </div>

      <div className="grid gap-4">
        {IMPORT_OPTIONS.map((opt) => (
          <Card key={opt.title} className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <opt.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{opt.title}</p>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </div>
              <span className="text-xs text-muted-foreground">Binnenkort</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Import-functionaliteit wordt binnenkort beschikbaar. Je kunt deze stap overslaan.
      </p>
    </div>
  );
}
