import { useState } from "react";
import { Loader2, Check, X, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatAction {
  type: string;
  label: string;
  params: Record<string, unknown>;
}

interface Props {
  action: ChatAction;
  organizationId: string | null;
}

const ACTION_LABELS: Record<string, { verb: string; tone: "primary" | "destructive" }> = {
  mark_invoice_paid: { verb: "Markeer als betaald", tone: "primary" },
  send_payment_reminder: { verb: "Verstuur herinnering", tone: "primary" },
  categorize_transaction: { verb: "Categoriseer transactie", tone: "primary" },
  exclude_transaction: { verb: "Sluit uit", tone: "destructive" },
};

export function ActionConfirmCard({ action, organizationId }: Props) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error" | "cancelled">("idle");
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const meta = ACTION_LABELS[action.type] ?? { verb: "Voer uit", tone: "primary" as const };

  const execute = async () => {
    if (!organizationId) {
      toast.error("Geen actieve organisatie");
      return;
    }
    setStatus("running");
    try {
      const { data, error } = await supabase.functions.invoke("cash-maatje-action", {
        body: { action, organization_id: organizationId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setStatus("done");
      setResultMsg(data?.message ?? "Klaar");
      toast.success(data?.message ?? "Actie uitgevoerd");
    } catch (e) {
      setStatus("error");
      const msg = e instanceof Error ? e.message : "Actie mislukt";
      setResultMsg(msg);
      toast.error(msg);
    }
  };

  const cancel = () => setStatus("cancelled");

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-2 rounded-xl border border-primary/30 bg-primary/5 p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          Voorgestelde actie
        </span>
      </div>
      <p className="text-[13px] text-foreground mb-3 leading-snug">{action.label}</p>

      {status === "idle" && (
        <div className="flex gap-2">
          <button
            onClick={execute}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
              meta.tone === "destructive"
                ? "bg-destructive text-destructive-foreground hover:opacity-90"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            {meta.verb}
          </button>
          <button
            onClick={cancel}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          >
            Negeer
          </button>
        </div>
      )}

      {status === "running" && (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Bezig met uitvoeren…
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center gap-2 text-[12px] text-emerald-500">
          <Check className="w-3.5 h-3.5" />
          {resultMsg}
        </div>
      )}

      {status === "error" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[12px] text-destructive">
            <X className="w-3.5 h-3.5" />
            {resultMsg}
          </div>
          <button
            onClick={execute}
            className="text-[11px] text-primary hover:underline"
          >
            Opnieuw proberen
          </button>
        </div>
      )}

      {status === "cancelled" && (
        <div className="text-[12px] text-muted-foreground italic">Genegeerd.</div>
      )}
    </motion.div>
  );
}

/**
 * Parse `:::action {json}:::` blocks uit een AI message.
 * Returns { cleanText, actions } — cleanText heeft de blocks verwijderd zodat ReactMarkdown
 * het overige antwoord rendert.
 */
export function parseActions(content: string): { cleanText: string; actions: ChatAction[] } {
  const actions: ChatAction[] = [];
  const regex = /:::action\s*([\s\S]*?):::/g;
  const cleanText = content.replace(regex, (_match, jsonRaw) => {
    try {
      const parsed = JSON.parse(jsonRaw.trim());
      if (parsed && typeof parsed.type === "string" && typeof parsed.label === "string") {
        actions.push({
          type: parsed.type,
          label: parsed.label,
          params: parsed.params ?? {},
        });
      }
    } catch {
      // negeer malformed blocks tijdens streaming
    }
    return "";
  }).trim();
  return { cleanText, actions };
}
