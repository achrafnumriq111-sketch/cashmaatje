import { motion } from "framer-motion";
import { Lock, Sparkles, Gift, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { MODULE_CATALOG, useEntitlements } from "@/hooks/useEntitlements";
import { useReferralInvites } from "@/hooks/useReferrals";

interface Props {
  moduleKey: string;
  children: React.ReactNode;
}

export function ModuleLockOverlay({ moduleKey, children }: Props) {
  const { isUnlocked, isLoading, grant } = useEntitlements();
  const { invites } = useReferralInvites();
  const navigate = useNavigate();
  const def = MODULE_CATALOG.find((m) => m.key === moduleKey);

  if (isLoading || !def || isUnlocked(moduleKey)) {
    return <>{children}</>;
  }

  const successfulRefs = invites.filter((i) => i.status === "converted" || i.status === "signed_up").length;
  const required = def.requiredReferrals ?? 0;
  const canUnlock = def.unlockMethod === "referral" && successfulRefs >= required;

  const Icon = def.unlockMethod === "subscription" ? Crown : Gift;

  return (
    <div className="relative min-h-[60vh]">
      <div className="pointer-events-none blur-sm opacity-30 select-none">{children}</div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute inset-0 flex items-center justify-center p-6"
      >
        <Card className="arcory-glass max-w-md w-full">
          <CardContent className="p-8 text-center space-y-5">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <div>
              <Badge variant="outline" className="mb-2 text-[10px] gap-1">
                <Icon className="h-3 w-3" />
                {def.unlockMethod === "subscription" ? "Premium" : "Referral unlock"}
              </Badge>
              <h2 className="text-xl font-semibold text-foreground">{def.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{def.description}</p>
            </div>

            {def.unlockMethod === "referral" && (
              <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Voortgang</span>
                  <span className="text-foreground font-medium">{successfulRefs} / {required} referrals</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (successfulRefs / Math.max(1, required)) * 100)}%` }} />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {def.unlockMethod === "referral" && (
                <>
                  <Button variant="outline" className="flex-1 gap-1.5" onClick={() => navigate("/platform/referral")}>
                    <Sparkles className="h-3.5 w-3.5" />Nodig uit
                  </Button>
                  {canUnlock && (
                    <Button className="flex-1 gap-1.5" onClick={() => grant.mutate({ moduleKey, source: "referral" })}>
                      <Gift className="h-3.5 w-3.5" />Activeer
                    </Button>
                  )}
                </>
              )}
              {def.unlockMethod === "subscription" && (
                <Button className="flex-1 gap-1.5" onClick={() => grant.mutate({ moduleKey, source: "trial" })}>
                  <Crown className="h-3.5 w-3.5" />Start 14d trial
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
