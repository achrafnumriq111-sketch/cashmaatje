import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Gift, Link, Mail, Share2, Users, Copy, TrendingUp, Euro,
  CheckCircle, Clock, ExternalLink, Sparkles, Zap
} from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";
import { toast } from "sonner";

const referralCode = "ARCORY-" + Math.random().toString(36).substring(2, 8).toUpperCase();
const referralLink = `https://arcory.app/ref/${referralCode}`;

const mockReferrals = [
  { id: "1", name: "Jan de Vries", email: "jan@example.nl", status: "active", revenue: 2400, date: "2026-03-15" },
  { id: "2", name: "Sara Bakker", email: "sara@bedrijf.nl", status: "active", revenue: 1800, date: "2026-03-22" },
  { id: "3", name: "Mohammed El-Hassan", email: "m.hassan@corp.nl", status: "pending", revenue: 0, date: "2026-04-01" },
  { id: "4", name: "Lisa van Dijk", email: "lisa@startup.io", status: "pending", revenue: 0, date: "2026-04-05" },
  { id: "5", name: "Thomas Jansen", email: "thomas@bv.nl", status: "converted", revenue: 3600, date: "2026-02-10" },
];

const rewards = [
  { threshold: 1, label: "1 referral", reward: "1 maand gratis", unlocked: true },
  { threshold: 3, label: "3 referrals", reward: "Premium features", unlocked: true },
  { threshold: 5, label: "5 referrals", reward: "€100 tegoed", unlocked: false },
  { threshold: 10, label: "10 referrals", reward: "Partner status", unlocked: false },
];

export default function ReferralCenter() {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const activeRefs = mockReferrals.filter(r => r.status === "active").length;
  const totalRevenue = mockReferrals.reduce((s, r) => s + r.revenue, 0);
  const conversionRate = Math.round((mockReferrals.filter(r => r.status !== "pending").length / mockReferrals.length) * 100);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopyFeedback(true);
    toast.success("Link gekopieerd!");
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=Probeer Arcory voor je boekhouding! ${referralLink}`, "_blank");
  };

  const handleEmail = () => {
    window.open(`mailto:?subject=Probeer Arcory&body=Ik gebruik Arcory voor mijn boekhouding en het is geweldig! Meld je aan via: ${referralLink}`, "_blank");
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Referral Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Nodig anderen uit en verdien beloningen</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Uitnodigingen", value: mockReferrals.length, icon: Users, color: "text-blue-400" },
          { label: "Actieve klanten", value: activeRefs, icon: CheckCircle, color: "text-primary" },
          { label: "Conversie", value: `${conversionRate}%`, icon: TrendingUp, color: "text-amber-400" },
          { label: "Gegenereerde omzet", value: `€${(totalRevenue / 1000).toFixed(1)}k`, icon: Euro, color: "text-emerald-400" },
        ].map(s => (
          <motion.div key={s.label} variants={cardVariant}>
            <Card className="arcory-glass">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-xl font-bold text-foreground">{s.value}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Share section */}
        <motion.div variants={cardVariant} className="lg:col-span-2 space-y-4">
          <Card className="arcory-glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Link className="h-4 w-4 text-primary" />Jouw referral link</CardTitle>
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
                <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={handleEmail}>
                  <Mail className="h-4 w-4" />Email uitnodiging
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={handleWhatsApp}>
                  <Share2 className="h-4 w-4" />WhatsApp delen
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

          {/* Referral list */}
          <Card className="arcory-glass">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Jouw referrals</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockReferrals.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground">{r.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className={`text-[9px] ${r.status === "active" ? "text-primary border-primary/30" : r.status === "converted" ? "text-amber-400 border-amber-400/30" : "text-muted-foreground"}`}>
                        {r.status === "active" ? "Actief" : r.status === "converted" ? "Geconverteerd" : "Uitgenodigd"}
                      </Badge>
                      {r.revenue > 0 && <p className="text-[10px] text-primary mt-0.5">€{r.revenue}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rewards */}
        <motion.div variants={cardVariant}>
          <Card className="arcory-glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Gift className="h-4 w-4 text-amber-400" />Beloningen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Voortgang</span>
                  <span className="text-foreground font-medium">{activeRefs + 1} / 5 referrals</span>
                </div>
                <Progress value={((activeRefs + 1) / 5) * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                {rewards.map(r => (
                  <div key={r.threshold} className={`p-3 rounded-xl border transition-all ${r.unlocked ? "border-primary/30 bg-primary/5" : "border-border bg-muted/10"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {r.unlocked ? <CheckCircle className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                        <div>
                          <p className="text-xs font-medium text-foreground">{r.label}</p>
                          <p className="text-[10px] text-muted-foreground">{r.reward}</p>
                        </div>
                      </div>
                      {r.unlocked && <Zap className="h-4 w-4 text-amber-400" />}
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
