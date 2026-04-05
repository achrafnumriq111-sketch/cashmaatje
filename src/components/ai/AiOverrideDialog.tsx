import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AiConfidenceBadge } from "./AiConfidenceBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface AiOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionId: string;
  currentSuggestion: {
    label: string;
    confidence: number;
    details?: string;
  };
  children?: React.ReactNode;
  onOverride: (reason: string) => void;
  onAccept: () => void;
}

export function AiOverrideDialog({
  open,
  onOpenChange,
  decisionId,
  currentSuggestion,
  children,
  onOverride,
  onAccept,
}: AiOverrideDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    setSaving(true);
    await supabase
      .from("ai_decisions")
      .update({ was_accepted: true })
      .eq("id", decisionId);
    onAccept();
    onOpenChange(false);
    setSaving(false);
    toast.success("AI-suggestie geaccepteerd");
  };

  const handleOverride = async () => {
    setSaving(true);
    await supabase
      .from("ai_decisions")
      .update({
        was_overridden: true,
        override_reason: reason || null,
        overridden_by: user?.id ?? null,
        overridden_at: new Date().toISOString(),
      })
      .eq("id", decisionId);
    onOverride(reason);
    onOpenChange(false);
    setSaving(false);
    setReason("");
    toast.success("Suggestie overschreven");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI-suggestie beoordelen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Huidige suggestie
            </p>
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">{currentSuggestion.label}</span>
              <AiConfidenceBadge confidence={currentSuggestion.confidence} />
            </div>
            {currentSuggestion.details && (
              <p className="mt-1 text-sm text-muted-foreground">{currentSuggestion.details}</p>
            )}
          </div>

          {children}

          <div>
            <Label className="text-sm">Reden voor overschrijving (optioneel)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Bijv. verkeerde categorie, dit is een privé-uitgave..."
              className="mt-1.5"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleOverride} disabled={saving}>
            Overschrijven
          </Button>
          <Button onClick={handleAccept} disabled={saving}>
            Accepteren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
