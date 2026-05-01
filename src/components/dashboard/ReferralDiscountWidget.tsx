import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Gift, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useReferralProgram, formatEuro } from "@/hooks/useReferralProgram";
import { cardVariant } from "@/lib/animations";

export function ReferralDiscountWidget() {
  const { summary, isLoading } = useReferralProgram();

  const headline = summary.countedReferrals === 0
    ? `Breng je eerste klant aan en verlaag je prijs naar ${formatEuro(summary.nextReferralPriceCents)} per maand.`
    : summary.countedReferrals >= summary.maxReferrals
      ? `Maximale korting bereikt. Je betaalt ${formatEuro(summary.finalMonthlyPriceCents)} per maand.`
      : `Eén referral erbij = ${formatEuro(summary.nextReferralPriceCents)} per maand.`;

  return (
    <motion.div variants={cardVariant}>
      <Card className="arcory-glass overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        <CardContent className="relative p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Gift className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-foreground">Referral korting</p>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {summary.countedReferrals} / {summary.maxReferrals}
            </span>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Je betaalt nu</div>
            <div className="mt-0.5 text-2xl font-semibold text-foreground">
              {isLoading ? "—" : formatEuro(summary.finalMonthlyPriceCents)}
              <span className="text-sm font-normal text-muted-foreground"> / maand</span>
            </div>
            {summary.discountCents > 0 && (
              <div className="text-xs text-emerald-500 mt-0.5">
                −{formatEuro(summary.discountCents)} korting actief
              </div>
            )}
          </div>

          <Progress value={summary.progressPercentage} className="h-1.5" />

          <p className="text-xs text-muted-foreground">{headline}</p>

          <Button asChild size="sm" variant="outline" className="w-full gap-1.5">
            <Link to="/platform/referral">
              Deel je referral link
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
