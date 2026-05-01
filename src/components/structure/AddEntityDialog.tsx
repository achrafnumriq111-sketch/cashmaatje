import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  parentOrganizationId: string;
}

export function AddEntityDialog({ open, onOpenChange, parentOrganizationId }: Props) {
  const [step, setStep] = useState<"form" | "checkout">("form");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [kvk, setKvk] = useState("");
  const [btw, setBtw] = useState("");
  const [ownership, setOwnership] = useState("100");
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const reset = () => {
    setStep("form");
    setName(""); setLegalName(""); setKvk(""); setBtw(""); setOwnership("100");
    setClientSecret(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Naam is verplicht");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-entity-checkout", {
        body: {
          parentOrganizationId,
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/?entity_added=1&session_id={CHECKOUT_SESSION_ID}`,
          entityDraft: {
            name: name.trim(),
            legal_name: legalName.trim() || undefined,
            kvk_number: kvk.trim() || undefined,
            btw_number: btw.trim() || undefined,
            ownership_pct: Number(ownership) || 100,
          },
        },
      });
      if (error || !data?.clientSecret) throw new Error(error?.message ?? "Checkout mislukt");
      setClientSecret(data.clientSecret);
      setStep("checkout");
    } catch (e: any) {
      toast.error(e.message ?? "Kon checkout niet starten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b border-border">
          <DialogTitle>
            {step === "form" ? "Nieuwe entiteit toevoegen" : "Voltooi je betaling"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
              <Gift className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="text-xs text-foreground/90">
                <p className="font-medium">Add-on: €15,99 per maand per entiteit</p>
                <p className="text-muted-foreground mt-0.5">
                  Vaste prijs — referral-korting is hier niet van toepassing. Maandelijks opzegbaar.
                </p>
              </div>
              <Badge variant="outline" className="ml-auto text-[10px]">€15,99/mnd</Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ent-name">Naam *</Label>
              <Input id="ent-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Werkmaatschappij BV" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ent-legal">Juridische naam</Label>
                <Input id="ent-legal" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ent-own">Eigendom %</Label>
                <Input id="ent-own" type="number" min={0} max={100} value={ownership} onChange={(e) => setOwnership(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ent-kvk">KVK</Label>
                <Input id="ent-kvk" value={kvk} onChange={(e) => setKvk(e.target.value)} maxLength={8} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ent-btw">BTW</Label>
                <Input id="ent-btw" value={btw} onChange={(e) => setBtw(e.target.value)} maxLength={14} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => handleClose(false)}>Annuleren</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Doorgaan naar betaling
              </Button>
            </div>
          </div>
        )}

        {step === "checkout" && clientSecret && (
          <div className="p-2">
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
