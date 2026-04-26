import { Briefcase, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChaosData } from "@/hooks/useChaosData";

export function BookkeeperHandoverButton() {
  const { generateHandoverPack, stats } = useChaosData();

  return (
    <div className="rounded-2xl border bg-card p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-5 h-5 text-foreground" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">
            Pakket voor je boekhouder
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            Eén document met situatie, openstaande zaken, deadlines en wat er nog ontbreekt.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        disabled={stats.total === 0 || generateHandoverPack.isPending}
        onClick={() => generateHandoverPack.mutate()}
      >
        {generateHandoverPack.isPending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Maken…
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Genereer pakket
          </>
        )}
      </Button>
    </div>
  );
}
