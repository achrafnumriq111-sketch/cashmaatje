import { useState } from "react";
import { Phone, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import type { ChaosItem } from "@/hooks/useChaosData";
import { useChaosData } from "@/hooks/useChaosData";

interface Props {
  item: ChaosItem;
}

export function CallModePanel({ item }: Props) {
  const { logAction } = useChaosData();
  const [notes, setNotes] = useState("");

  if (!item.phone_number && !item.phone_script) {
    return (
      <div className="rounded-xl border border-dashed bg-card/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Voor dit document is bellen niet de aangewezen route.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Bel deze
        </div>
        {item.phone_number ? (
          <a
            href={`tel:${item.phone_number.replace(/\s/g, "")}`}
            className="block mt-1 text-2xl font-semibold text-primary hover:underline"
          >
            {item.phone_number}
          </a>
        ) : (
          <div className="text-sm text-muted-foreground mt-1">
            Telefoonnummer staat op het originele document.
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Beste belmoment
            </div>
            <div className="text-foreground">Werkdagen 09:00 – 12:00</div>
          </div>
          {item.reference_number && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Kenmerk bij hand
              </div>
              <div className="font-mono text-foreground">{item.reference_number}</div>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Wat je zegt
          </div>
          {item.phone_script && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(item.phone_script!);
                toast({ title: "Script gekopieerd" });
              }}
            >
              <Copy className="w-3 h-3 mr-1.5" /> Kopieer
            </Button>
          )}
        </div>
        <blockquote className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground whitespace-pre-line">
          "{item.phone_script ?? "Geen script — beschrijf je situatie en vraag concreet om een betalingsregeling."}"
        </blockquote>
      </div>

      {item.required_documents && item.required_documents.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            Eerst pakken
          </div>
          <ul className="space-y-1.5">
            {item.required_documents.map((d, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-muted-foreground">•</span> {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
          Wat je daarna noteert
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Bv. 'Belastingdienst akkoord met regeling 6 termijnen, eerste op 15 mei...'"
          rows={4}
        />
        <Button
          size="sm"
          className="mt-2"
          disabled={!notes.trim() || logAction.isPending}
          onClick={() => {
            logAction.mutate(
              { itemId: item.id, type: "call", notes, status: "done" },
              { onSuccess: () => setNotes("") }
            );
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Bewaar als gebeld
        </Button>
      </div>
    </div>
  );
}
