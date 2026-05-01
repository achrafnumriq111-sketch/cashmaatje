import { motion } from "framer-motion";
import { Shield, Calendar, Wallet, Receipt, Calculator, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useTaxReserve } from "@/hooks/useTaxReserve";
import { upsertTaxReserve } from "@/lib/taxReserve";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { pageTransition, cardVariant, staggerContainer } from "@/lib/animations";
import { SmartEmptyState } from "@/components/ui/smart-empty-state";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
const fmtPct = (n: number) => new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 }).format(n);

export default function TaxReservePage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useTaxReserve();
  const { membership } = useOrganization();

  const handleConfirmReserve = async () => {
    if (!membership || !data) return;
    const year = new Date(data.periodEnd).getFullYear();
    const r1 = await upsertTaxReserve(membership.organizationId, "vat", year, data.vatDuePeriod, {
      period: data.periodLabel,
      calculatedAt: new Date().toISOString(),
    });
    const r2 = await upsertTaxReserve(membership.organizationId, "income_tax", year, data.incomeTaxEstimate, {
      ytdProfit: data.ytdProfit,
      indicativeRate: 0.3193,
      calculatedAt: new Date().toISOString(),
    });
    if (r1.error || r2.error) {
      toast({ title: "Opslaan mislukt", description: r1.error?.message || r2.error?.message, variant: "destructive" });
    } else {
      toast({ title: "Reserve bevestigd", description: "Je belastingreserve is bijgewerkt." });
      refetch();
    }
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-[1400px]">
      <motion.div variants={cardVariant}>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-foreground">Belastingreserve</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Realtime: hoeveel moet je opzij zetten en wat is veilig te besteden.
        </p>
      </motion.div>

      {isLoading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : data?.status === "no-data" ? (
        <Card className="arcory-glass">
          <CardContent>
            <SmartEmptyState
              icon={Shield}
              title="Nog geen belastingreserve berekend"
              description="Zodra je eerste facturen of transacties geboekt zijn, berekenen we automatisch wat je opzij moet zetten."
              whyItMatters="Geen verrassingen meer bij de aangifte. Je weet altijd wat van jou is en wat van de Belastingdienst."
              actionLabel="Maak eerste factuur"
              actionTo="/facturen/verkoop"
            />
          </CardContent>
        </Card>
      ) : data ? (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
          {/* Hero: Safe to spend */}
          <motion.div variants={cardVariant}>
            <Card className="arcory-glass overflow-hidden">
              <CardContent className="grid gap-6 p-6 md:grid-cols-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-micro text-muted-foreground">Cash positie</span>
                  </div>
                  <p className="mt-2 text-[26px] font-semibold tracking-tight tabular-nums text-foreground">{fmt(data.cashBalance)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-micro text-muted-foreground">Te reserveren</span>
                  </div>
                  <p className="mt-2 text-[26px] font-semibold tracking-tight tabular-nums text-amber-400">
                    {fmt(data.totalReserveRecommended)}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">BTW + IB-indicatie</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-micro text-muted-foreground">Veilig te besteden</span>
                  </div>
                  <p className="mt-2 text-[26px] font-semibold tracking-tight tabular-nums text-emerald-400">
                    {fmt(data.safeToSpend)}
                  </p>
                  <Progress
                    value={data.cashBalance > 0 ? Math.min(100, (data.safeToSpend / data.cashBalance) * 100) : 0}
                    className="mt-3 h-1.5"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status alert */}
          {data.status !== "ok" && (
            <motion.div variants={cardVariant}>
              <Card
                className={`arcory-glass border ${
                  data.status === "critical" ? "border-red-400/30" : "border-amber-400/30"
                }`}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <AlertTriangle
                    className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                      data.status === "critical" ? "text-red-400" : "text-amber-400"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-foreground">
                      {data.status === "critical"
                        ? `Tekort van ${fmt(data.shortage)} — je cash dekt de belastingverplichting niet`
                        : `Reserveer ${fmt(data.shortage)} extra om volledig gedekt te zijn`}
                    </p>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                      Je hebt nu {fmt(data.alreadyReserved)} gereserveerd. Aanbeveling: {fmt(data.totalReserveRecommended)}.
                    </p>
                  </div>
                  <Button size="sm" onClick={handleConfirmReserve}>
                    Reserve bevestigen
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Breakdown */}
          <div className="grid gap-4 lg:grid-cols-2">
            <motion.div variants={cardVariant}>
              <Card className="arcory-glass h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Receipt className="h-4 w-4 text-primary" /> BTW-reserve {data.periodLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px] text-muted-foreground">Geboekt af te dragen</span>
                    <span className="text-[18px] font-semibold tabular-nums">{fmt(data.vatDuePeriod)}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-[12px] text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      Deadline: {data.vatDeadline}{" "}
                      {data.daysToVatDeadline > 0
                        ? `(over ${data.daysToVatDeadline} dagen)`
                        : `(${Math.abs(data.daysToVatDeadline)} dagen verstreken)`}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/btw/aangifte")}>
                    Bekijk BTW-aangifte
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariant}>
              <Card className="arcory-glass h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Calculator className="h-4 w-4 text-primary" /> Inkomstenbelasting (indicatie)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px] text-muted-foreground">YTD winst</span>
                    <span className="text-[15px] font-semibold tabular-nums">{fmt(data.ytdProfit)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px] text-muted-foreground">Reserve indicatie ({fmtPct(31.93)}%)</span>
                    <span className="text-[18px] font-semibold tabular-nums text-foreground">
                      {fmt(data.incomeTaxEstimate)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-[12px] text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      Vereenvoudigde indicatie. Werkelijke IB hangt af van aftrekposten, schijven en ondernemingsvorm.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div variants={cardVariant}>
            <Card className="arcory-glass">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-[13px] text-muted-foreground">Reeds gereserveerd dit jaar</p>
                  <p className="text-[18px] font-semibold tabular-nums">{fmt(data.alreadyReserved)}</p>
                </div>
                <Button onClick={handleConfirmReserve} variant={data.status === "ok" ? "outline" : "default"}>
                  {data.status === "ok" ? "Bijwerken" : "Reserve nu vastleggen"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
