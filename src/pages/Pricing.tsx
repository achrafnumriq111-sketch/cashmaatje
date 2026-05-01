import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Loader2, PlayCircle, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
import { CASHMAATJE_PRICE_ID } from "@/lib/stripe";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { useOrganization } from "@/hooks/useOrganization";
import { useReferralProgram } from "@/hooks/useReferralProgram";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  "Onbeperkte verkoop- en inkoopfacturen",
  "Onbeperkte bankkoppelingen + AI-matching",
  "BTW-aangifte (kwartaal/maand) + ICP",
  "Volledige AI-boekhouding (24/7 autopilot)",
  "Jaarrekening, audit dossier en VPB",
  "Contract Intelligence & Compliance",
  "Stakeholder CRM + Corporate Structure",
  "Automation Center & Process Flows",
  "Boekhouder-toegang + API",
  "Prioriteit support",
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sub = useSubscription();
  const { membership, refetch: refetchOrg } = useOrganization();
  const { discount } = useReferralProgram();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const finalPrice = (discount?.final_price_cents ?? 2599) / 100;
  const activeRefs = discount?.active_referrals ?? 0;

  const handleSelect = () => {
    if (!user) {
      navigate("/login?redirect=/pricing");
      return;
    }
    if (sub.isActive) {
      openPortal();
      return;
    }
    setCheckoutOpen(true);
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: { environment: getStripeEnvironment(), returnUrl: window.location.href },
      });
      if (error || !data?.url) throw new Error(error?.message ?? "Portal mislukt");
      window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPortalLoading(false);
    }
  };

  const startDemo = async () => {
    if (!user) {
      navigate("/login?redirect=/pricing");
      return;
    }
    setDemoLoading(true);
    try {
      const { data: orgId, error } = await supabase.rpc("create_demo_organization", { p_name: "Demo BV" });
      if (error) throw error;
      await refetchOrg();
      localStorage.setItem("active_organization_id", orgId as string);
      toast.success("Demo organisatie aangemaakt — je kunt de app verkennen!");
      window.location.href = "/";
    } catch (e: any) {
      toast.error(e.message ?? "Demo aanmaken mislukt");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Badge variant="outline" className="mb-3 text-[10px] tracking-wider uppercase">
            Eén plan. Alles inbegrepen.
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            €25,99 per maand
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Alle modules, AI-boekhouding op autopilot, en €1 korting per actieve referral —
            tot een minimumprijs van €15,99 per maand.
          </p>
          {sub.isActive && (
            <div className="mt-4 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <Check className="h-3 w-3" />
              Abonnement actief
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="underline ml-2 hover:text-primary/80"
              >
                Beheer abonnement
              </button>
            </div>
          )}

          {user && !membership?.isDemo && (
            <div className="mt-4">
              <Button variant="ghost" size="sm" onClick={startDemo} disabled={demoLoading} className="text-muted-foreground hover:text-foreground">
                {demoLoading ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5 mr-2" />}
                Probeer eerst de app met een Demo BV
              </Button>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-primary/40 bg-card shadow-[0_0_40px_-8px_hsl(var(--primary)/0.3)]">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/15 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Cash Maatje</h3>
                  <p className="text-xs text-muted-foreground">AI-boekhouding zonder gedoe</p>
                </div>
              </div>

              <div className="mb-6 flex items-end gap-3">
                <span className="text-5xl font-bold text-foreground">€{finalPrice.toFixed(2).replace(".", ",")}</span>
                <span className="text-sm text-muted-foreground pb-2">per maand</span>
                {activeRefs > 0 && finalPrice < 25.99 && (
                  <Badge variant="outline" className="ml-auto gap-1 text-[10px]">
                    <Gift className="h-3 w-3" />
                    €{((2599 - (discount?.final_price_cents ?? 2599)) / 100).toFixed(2).replace(".", ",")} korting
                  </Badge>
                )}
              </div>

              <div className="rounded-xl bg-muted/30 border border-border/50 p-4 mb-6 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Basisprijs</span><span>€25,99 per maand</span></div>
                <div className="flex justify-between"><span>Korting per actieve referral</span><span>€1</span></div>
                <div className="flex justify-between"><span>Maximaal referrals</span><span>10</span></div>
                <div className="flex justify-between"><span>Minimale prijs</span><span>€15,99 per maand</span></div>
                <div className="flex justify-between text-[11px] pt-1 border-t border-border/40 mt-2">
                  <span>Referral telt pas na eerste succesvolle betaling</span>
                </div>
              </div>

              <Button
                onClick={handleSelect}
                className="w-full mb-6"
                size="lg"
                disabled={portalLoading}
              >
                {sub.isActive ? "Beheer abonnement" : "Start abonnement"}
              </Button>

              <ul className="space-y-2.5 text-sm">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-foreground">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-8 max-w-xl mx-auto">
          Maandelijks opzegbaar. Prijs excl. BTW. Referrals worden automatisch verrekend op je
          volgende factuur.
        </p>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle>Voltooi je abonnement</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <StripeEmbeddedCheckout
              priceId={CASHMAATJE_PRICE_ID}
              customerEmail={user?.email ?? undefined}
              userId={user?.id}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
