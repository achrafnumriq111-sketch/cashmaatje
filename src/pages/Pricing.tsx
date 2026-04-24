import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Crown, Zap, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_PRICE_IDS, type PlanTier } from "@/lib/stripe";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Plan {
  tier: PlanTier;
  name: string;
  price: number;
  tagline: string;
  highlight?: boolean;
  icon: typeof Sparkles;
  features: string[];
}

const PLANS: Plan[] = [
  {
    tier: "start",
    name: "Start",
    price: 39,
    tagline: "Voor zzp'ers en kleine ondernemers",
    icon: Zap,
    features: [
      "1 gebruiker",
      "1 administratie",
      "50 verkoopfacturen",
      "1 bankkoppeling",
      "BTW-aangifte",
      "Basis AI-assistent",
      "Boekhouder toegang",
    ],
  },
  {
    tier: "smart",
    name: "Smart",
    price: 79,
    tagline: "Voor groeiende MKB die AI laat boekhouden",
    highlight: true,
    icon: Sparkles,
    features: [
      "3 gebruikers",
      "2 administraties",
      "Onbeperkte verkoopfacturen",
      "Onbeperkte bankkoppelingen",
      "BTW-aangifte + ICP",
      "Volledige AI-boekhouding",
      "AI bankmatching & factuurverwerking",
      "Debiteurenherinneringen",
      "Meeste integraties",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    price: 149,
    tagline: "Voor teams met geavanceerde controle",
    icon: Crown,
    features: [
      "10 gebruikers",
      "5 administraties",
      "Alles uit Smart",
      "Goedkeuringsworkflows",
      "Geavanceerde rapporten",
      "API-toegang",
      "Custom integraties",
      "Prioriteit support",
    ],
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sub = useSubscription();
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleSelect = (tier: PlanTier) => {
    if (!user) {
      navigate("/login?redirect=/pricing");
      return;
    }
    if (sub.isActive && sub.tier === tier) {
      toast.info("Je gebruikt dit plan al");
      return;
    }
    if (sub.isActive) {
      // Open portal voor wijzigingen
      openPortal();
      return;
    }
    setCheckoutPriceId(PLAN_PRICE_IDS[tier]);
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

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Badge variant="outline" className="mb-3 text-[10px] tracking-wider uppercase">
            Pricing
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Het simpele, AI-first alternatief voor Exact
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Drie duidelijke plannen, geen verborgen kosten. Slimme agents die je boekhouding
            automatiseren.
          </p>
          {sub.isActive && (
            <div className="mt-4 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <Check className="h-3 w-3" />
              Actief plan: <span className="font-semibold capitalize">{sub.tier}</span>
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="underline ml-2 hover:text-primary/80"
              >
                Beheer abonnement
              </button>
            </div>
          )}
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, idx) => {
            const Icon = plan.icon;
            const isCurrent = sub.isActive && sub.tier === plan.tier;
            return (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="relative"
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground shadow-lg">
                      Meest gekozen
                    </Badge>
                  </div>
                )}
                <Card
                  className={`h-full ${
                    plan.highlight
                      ? "border-primary/40 bg-card shadow-[0_0_40px_-8px_hsl(var(--primary)/0.3)]"
                      : "border-border"
                  }`}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          plan.highlight ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">{plan.tagline}</p>

                    <div className="mb-5">
                      <span className="text-4xl font-bold text-foreground">€{plan.price}</span>
                      <span className="text-sm text-muted-foreground ml-1">/maand</span>
                    </div>

                    <Button
                      onClick={() => handleSelect(plan.tier)}
                      variant={plan.highlight ? "default" : "outline"}
                      className="w-full mb-5"
                      disabled={isCurrent}
                    >
                      {isCurrent ? "Huidig plan" : sub.isActive ? "Wissel plan" : "Kies dit plan"}
                    </Button>

                    <ul className="space-y-2.5 text-sm">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-foreground">
                          <Check
                            className={`h-4 w-4 mt-0.5 shrink-0 ${
                              plan.highlight ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 max-w-2xl mx-auto">
          Alle plannen bevatten boekhouding, facturatie, BTW-aangifte, bankkoppeling, veilige
          cloud-opslag, accountant-toegang en support. Maandelijks opzegbaar. Prijzen excl. BTW.
        </p>
      </div>

      <Dialog open={!!checkoutPriceId} onOpenChange={(o) => !o && setCheckoutPriceId(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle>Voltooi je abonnement</DialogTitle>
          </DialogHeader>
          {checkoutPriceId && (
            <div className="p-2">
              <StripeEmbeddedCheckout
                priceId={checkoutPriceId}
                customerEmail={user?.email ?? undefined}
                userId={user?.id}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
