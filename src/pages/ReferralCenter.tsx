import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Gift, Link as LinkIcon, Mail, Share2, Users, Copy, TrendingUp, Euro,
  CheckCircle, Clock, Sparkles, Zap, Loader2,
} from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";
import { toast } from "sonner";
import { useReferralCode, useReferralInvites } from "@/hooks/useReferrals";
import { MODULE_CATALOG } from "@/hooks/useEntitlements";

export default function ReferralCenter() {
  const { data: codeRow, isLoading: codeLoading } = useReferralCode();
  const { invites, isLoading: invitesLoading, create } = useReferralInvites();
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const referralCode = codeRow?.code ?? "";
  const referralLink = referralCode ? `${window.location.origin}/register?ref=${referralCode}` : "";

  const successful = invites.filter((i) => i.status === "converted" || i.status === "signed_up").length;
  const totalRevenue = (codeRow?.total_revenue_cents ?? 0) / 100;
  const conversionRate = invites.length ? Math.round((successful / invites.length) * 100) : 0;

  // Beloningen afgeleid van module-catalogus
  const referralRewards = MODULE_CATALOG
    .filter((m) => m.unlockMethod === "referral")
    .sort((a, b) => (a.requiredReferrals ?? 0) - (b.requiredReferrals ?? 0))
    .map((m) => ({
      threshold: m.requiredReferrals ?? 1,
      label: `${m.requiredReferrals} referral${(m.requiredReferrals ?? 1) > 1 ? "s" : ""}`,
      reward: m.name,
      unlocked: successful >= (m.requiredReferrals ?? 1),
    }));

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopyFeedback(true);
    toast.success("Link gekopieerd!");
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim() || !referralCode) return;
    create.mutate({ code: referralCode, email: inviteEmail.trim() });
    setInviteEmail("");
  };

  const handleWhatsApp = () => {
    if (!referralLink) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(`Probeer Cashmaatje voor je boekhouding! ${referralLink}`)}`, "_blank");
  };

  const handleEmail = () => {
    if (!referralLink) return;
    window.open(`mailto:?subject=${encodeURIComponent("Probeer Cashmaatje")}&body=${encodeURIComponent(`Ik gebruik Cashmaatje voor mijn boekhouding. Meld je aan via: ${referralLink}`)}`, "_blank");
  };

  if (codeLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Referral Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Nodig anderen uit en ontgrendel premium modules</p>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Uitnodigingen", value: invites.length, icon: Users },
          { label: "Geconverteerd", value: successful, icon: CheckCircle },
          { label: "Conversie", value: `${conversionRate}%`, icon: TrendingUp },
          { label: "Omzet", value: `€${(totalRevenue / 1000).toFixed(1)}k`, icon: Euro },
        ].map((s) => (
          <motion.div key={s.label} variants={cardVariant}>
            <Card className="arcory-glass">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <s.icon className="h-4 w-4 text-primary" />
                  <span className="text-xl font-bold text-foreground">{s.value}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={cardVariant} className="lg:col-span-2 space-y-4">
          <Card className="arcory-glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><LinkIcon className="h-4 w-4 text-primary" />Jouw referral link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="flex-1 font-mono text-xs bg-muted/20" />
                <Button variant={copyFeedback ? "default" : "outline"} size="sm" className="gap-1.5 min-w-[100px]" onClick={handleCopy}>
                  {copyFeedback ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copyFeedback ? "Gekopieerd!" : "Kopieer"}
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="E-mailadres uitnodiging..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                />
                <Button size="sm" className="gap-1.5" onClick={handleSendInvite} disabled={!inviteEmail.trim() || create.isPending}>
                  {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                  Verstuur
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={handleEmail}>
                  <Mail className="h-4 w-4" />Email
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={handleWhatsApp}>
                  <Share2 className="h-4 w-4" />WhatsApp
                </Button>
              </div>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">Referral code</span>
                </div>
                <code className="text-lg font-bold text-primary tracking-wider">{referralCode}</code>
              </div>
            </CardContent>
          </Card>

          <Card className="arcory-glass">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Verstuurde uitnodigingen</CardTitle></CardHeader>
            <CardContent>
              {invitesLoading ? (
                <div className="text-xs text-muted-foreground py-6 text-center">Laden...</div>
              ) : invites.length === 0 ? (
                <div className="text-xs text-muted-foreground py-6 text-center">Nog geen uitnodigingen verstuurd.</div>
              ) : (
                <div className="space-y-2">
                  {invites.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{r.invited_name ?? r.invited_email}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{r.invited_email}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px]">
                        {r.status === "converted" ? "Geconverteerd" : r.status === "signed_up" ? "Aangemeld" : "Uitgenodigd"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariant}>
          <Card className="arcory-glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Gift className="h-4 w-4 text-primary" />Module beloningen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Voortgang</span>
                  <span className="text-foreground font-medium">{successful} referrals</span>
                </div>
                <Progress value={Math.min(100, (successful / 3) * 100)} className="h-2" />
              </div>
              <div className="space-y-2">
                {referralRewards.map((r) => (
                  <div key={`${r.threshold}-${r.reward}`} className={`p-3 rounded-xl border transition-all ${r.unlocked ? "border-primary/30 bg-primary/5" : "border-border bg-muted/10"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {r.unlocked ? <CheckCircle className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                        <div>
                          <p className="text-xs font-medium text-foreground">{r.label}</p>
                          <p className="text-[10px] text-muted-foreground">{r.reward}</p>
                        </div>
                      </div>
                      {r.unlocked && <Zap className="h-4 w-4 text-primary" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
