import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users, Copy, Check, Share2, Sparkles, RefreshCcw, ShieldCheck, Receipt, Gift,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReferralProgram, formatEuro, type ReferralRow } from "@/hooks/useReferralProgram";
import { pageTransition, cardVariant, staggerContainer } from "@/lib/animations";
import { toast } from "sonner";

const STATUS_LABELS: Record<ReferralRow["status"], { label: string; tone: string }> = {
  pending: { label: "Wacht op eerste betaling", tone: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  first_payment_received: { label: "Activeren…", tone: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  active: { label: "Actief, telt mee", tone: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  inactive: { label: "Niet actief", tone: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30" },
  cancelled: { label: "Gestopt", tone: "bg-rose-500/10 text-rose-500 border-rose-500/30" },
  rejected: { label: "Afgekeurd", tone: "bg-rose-500/10 text-rose-500 border-rose-500/30" },
};

export default function ReferralCenter() {
  const { summary, referrals, isLoading, isReferralsLoading, recalc } = useReferralProgram();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!summary.referralUrl) return;
    await navigator.clipboard.writeText(summary.referralUrl);
    setCopied(true);
    toast.success("Referral-link gekopieerd");
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!summary.referralUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Probeer CashMaatje",
          text: `Bespaar tijd op je administratie. Gebruik mijn link om te starten met CashMaatje.`,
          url: summary.referralUrl,
        });
      } catch {/* cancelled */}
    } else {
      copyLink();
    }
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-[1200px]">
      {/* Hero */}
      <motion.div variants={cardVariant}>
        <Card className="arcory-glass overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/5 pointer-events-none" />
          <CardContent className="relative p-8 space-y-3">
            <Badge variant="outline" className="gap-1.5 border-emerald-500/30 text-emerald-500">
              <Gift className="h-3 w-3" /> Referral korting
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Verlaag je maandprijs met referrals
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Je betaalt standaard <strong className="text-foreground">€25,99 per maand</strong>. Voor elke actieve klant die jij aanbrengt, krijg je <strong className="text-foreground">€1 korting per maand</strong>. Maximaal 10 referrals — dan zit je op €15,99 per maand.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current price card */}
        <motion.div variants={cardVariant} className="lg:col-span-2">
          <Card className="arcory-glass h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Jouw huidige maandprijs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {isLoading ? (
                <Skeleton className="h-12 w-40" />
              ) : (
                <div className="flex items-end gap-3">
                  <div className="text-5xl font-semibold tracking-tight text-foreground">
                    {formatEuro(summary.finalMonthlyPriceCents)}
                  </div>
                  <div className="text-sm text-muted-foreground pb-2">/ maand</div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 text-xs">
                <Stat label="Basisprijs" value={formatEuro(summary.basePriceCents)} />
                <Stat label="Referral korting" value={`-${formatEuro(summary.discountCents)}`} tone="emerald" />
                <Stat label="Actieve referrals" value={`${summary.countedReferrals} / ${summary.maxReferrals}`} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">0 referrals</span>
                  <span className="text-foreground font-medium">{summary.maxReferrals} referrals = €15,99 p/m</span>
                </div>
                <Progress value={summary.progressPercentage} className="h-2" />
              </div>

              {summary.countedReferrals < summary.maxReferrals && (
                <p className="text-xs text-muted-foreground">
                  Eén referral erbij = je betaalt <strong className="text-foreground">{formatEuro(summary.nextReferralPriceCents)}</strong> per maand.
                </p>
              )}

              <Button variant="ghost" size="sm" onClick={() => recalc.mutate()} disabled={recalc.isPending} className="gap-1.5 text-xs">
                <RefreshCcw className={`h-3 w-3 ${recalc.isPending ? "animate-spin" : ""}`} />
                Korting opnieuw berekenen
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral link card */}
        <motion.div variants={cardVariant}>
          <Card className="arcory-glass h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Jouw referral-link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : summary.referralCode ? (
                <>
                  <div className="space-y-1.5">
                    <Input readOnly value={summary.referralUrl ?? ""} className="text-xs font-mono bg-muted/30" />
                    <p className="text-[11px] text-muted-foreground">
                      Code: <span className="font-mono text-foreground">{summary.referralCode}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyLink} className="flex-1 gap-1.5">
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      Kopieer
                    </Button>
                    <Button size="sm" onClick={share} className="flex-1 gap-1.5">
                      <Share2 className="h-3.5 w-3.5" />
                      Delen
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Referral-link wordt aangemaakt…</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Referral table */}
      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Jouw referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isReferralsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">Nog geen referrals</p>
                <p className="text-xs text-muted-foreground">
                  Deel je referral-link met andere ondernemers en verlaag je maandprijs.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Bedrijf</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Eerste betaling</TableHead>
                    <TableHead className="text-right">Telt mee?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((r) => {
                    const meta = STATUS_LABELS[r.status];
                    const counts = r.status === "active";
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("nl-NL")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.referred_org_name ?? <span className="text-muted-foreground">Onbekend</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${meta.tone}`}>
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.first_payment_at
                            ? new Date(r.first_payment_at).toLocaleDateString("nl-NL")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {counts ? (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                              Ja
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Nee</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Info footer */}
      <motion.div variants={cardVariant} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoBlock
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
          title="Eerlijke referrals"
          body="Referrals tellen pas mee na de eerste succesvolle betaling van de nieuwe klant. Zelfverwijzingen, dubbele accounts of verdachte aanmeldingen tellen niet mee."
        />
        <InfoBlock
          icon={<Receipt className="h-4 w-4 text-primary" />}
          title="Automatische facturering"
          body="Je korting wordt automatisch verwerkt op je maandelijkse factuur. Stopt een referral met betalen, dan vervalt die korting bij de eerstvolgende berekening."
        />
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "emerald" }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${tone === "emerald" ? "text-emerald-500" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function InfoBlock({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="arcory-glass">
      <CardContent className="p-4 flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{body}</p>
        </div>
      </CardContent>
    </Card>
  );
}
