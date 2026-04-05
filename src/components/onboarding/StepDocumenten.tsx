import { Card, CardContent } from "@/components/ui/card";
import { FileText, Mail, Settings } from "lucide-react";

export default function StepDocumenten() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Documenten instellen</h2>
        <p className="mt-1 text-muted-foreground">
          Configureer hoe facturen en bonnetjes worden verwerkt.
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">Bestaande documenten uploaden</p>
              <p className="text-sm text-muted-foreground">Upload facturen en bonnetjes die je al hebt.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Auto-forwarding email</p>
              <p className="text-sm text-muted-foreground">Stuur facturen automatisch door naar Arcory.</p>
            </div>
            <span className="text-xs text-muted-foreground">Binnenkort</span>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Settings className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Verwerkingsvoorkeuren</p>
              <p className="text-sm text-muted-foreground">Stel in hoe documenten automatisch worden verwerkt.</p>
            </div>
            <span className="text-xs text-muted-foreground">Binnenkort</span>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Je kunt documenten later uploaden via de Documenten-pagina.
      </p>
    </div>
  );
}
