import { useRef } from "react";
import { Upload, FileText, Phone, Mail, CreditCard, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChaosActions, useChaosActionProofs, useChaosData } from "@/hooks/useChaosData";
import type { ChaosItem, ActionType } from "@/hooks/useChaosData";

const actionIcon: Partial<Record<ActionType, React.ComponentType<{ className?: string }>>> = {
  call: Phone,
  email_sent: Mail,
  payment_arrangement: FileCheck2,
  payment_made: CreditCard,
  objection: FileText,
  delay_request: FileCheck2,
};

const actionLabel: Record<ActionType, string> = {
  call: "Gebeld",
  email_sent: "E-mail verzonden",
  payment_arrangement: "Betalingsregeling",
  delay_request: "Uitstel aangevraagd",
  objection: "Bezwaar ingediend",
  payment_made: "Betaling gedaan",
  prepare_handover: "Boekhouder pakket",
  other: "Overig",
};

interface Props {
  item: ChaosItem;
}

export function ProofVault({ item }: Props) {
  const actions = useChaosActions(item.id);
  const actionIds = (actions.data ?? []).map((a) => a.id);
  const proofs = useChaosActionProofs(actionIds);
  const { uploadProof } = useChaosData();
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  if (actions.isLoading) {
    return <div className="text-xs text-muted-foreground">Acties laden…</div>;
  }

  const list = actions.data ?? [];
  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Nog geen acties. Wat je doet komt hier terecht — met bewijs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((a) => {
        const Icon = actionIcon[a.action_type] ?? FileText;
        const myProofs = (proofs.data ?? []).filter((p) => p.action_id === a.id);
        return (
          <div key={a.id} className="rounded-xl border bg-card p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-foreground">
                    {actionLabel[a.action_type]}
                  </div>
                  <div className="text-[10px] text-muted-foreground tabular-nums">
                    {a.performed_at
                      ? new Date(a.performed_at).toLocaleDateString("nl-NL")
                      : new Date(a.created_at).toLocaleDateString("nl-NL")}
                  </div>
                </div>
                {a.notes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                    {a.notes}
                  </p>
                )}

                {myProofs.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {myProofs.map((p) => (
                      <li
                        key={p.id}
                        className="text-[11px] text-muted-foreground flex items-center gap-1.5"
                      >
                        <FileText className="w-3 h-3" />
                        {p.file_name}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-2">
                  <input
                    type="file"
                    ref={(el) => (fileInputs.current[a.id] = el)}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadProof.mutate({ actionId: a.id, file: f });
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => fileInputs.current[a.id]?.click()}
                  >
                    <Upload className="w-3 h-3 mr-1.5" /> Bewijs toevoegen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
