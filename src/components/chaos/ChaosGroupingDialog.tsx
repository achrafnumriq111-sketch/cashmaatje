import { useState } from "react";
import { FileText, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type GroupMode = "merge" | "separate" | "smart";

interface Props {
  open: boolean;
  files: File[];
  onCancel: () => void;
  onConfirm: (mode: GroupMode) => void;
}

const options: Array<{
  value: GroupMode;
  title: string;
  desc: string;
  icon: typeof FileText;
}> = [
  {
    value: "merge",
    title: "1 brief van meerdere pagina's",
    desc: "Voeg samen tot één document — AI leest alle pagina's als één zaak.",
    icon: Layers,
  },
  {
    value: "separate",
    title: "Aparte documenten",
    desc: "Elke pagina is een losse zaak. AI analyseert ze afzonderlijk.",
    icon: FileText,
  },
  {
    value: "smart",
    title: "Slim splitsen (aanbevolen)",
    desc: "Upload los, AI bekijkt kenmerk en afzender en groepeert wat bij elkaar hoort.",
    icon: Sparkles,
  },
];

export function ChaosGroupingDialog({ open, files, onCancel, onConfirm }: Props) {
  const [mode, setMode] = useState<GroupMode>("smart");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {files.length} bestanden geselecteerd — horen ze bij elkaar?
          </DialogTitle>
          <DialogDescription>
            Belastingdienst- en deurwaarderbrieven zijn vaak meerdere pagina's.
            Voorkom dat één brief als losse acties in je dashboard komt.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-32 overflow-y-auto rounded-lg border bg-muted/20 p-2 text-xs space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-muted-foreground truncate">
              <span className="w-4 text-right tabular-nums">{i + 1}.</span>
              <span className="truncate text-foreground">{f.name}</span>
              <span className="ml-auto tabular-nums flex-shrink-0">
                {(f.size / 1024).toFixed(0)} KB
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-1">
          {options.map((o) => {
            const active = mode === o.value;
            const Icon = o.icon;
            return (
              <button
                key={o.value}
                onClick={() => setMode(o.value)}
                className={`w-full text-left rounded-xl border p-3 transition-all ${
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{o.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{o.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Annuleer
          </Button>
          <Button onClick={() => onConfirm(mode)}>Analyseer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
