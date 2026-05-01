import { motion } from "framer-motion";
import { pageTransition, cardVariant } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, TrendingUp, AlertTriangle, CheckCircle2, RefreshCcw } from "lucide-react";
import { useHealthScore } from "@/hooks/useHealthScore";
import { useQueryClient } from "@tanstack/react-query";

export default function FinancialHealth() {
  const { data, isLoading, refetch, isFetching } = useHealthScore();
  const qc = useQueryClient();

  const grade = data?.grade ?? "—";
  const score = data?.overall ?? 0;
  const scoreColor =
    score >= 70 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-destructive";

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Financiële gezondheidsscore</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Eén getal dat zegt hoe je bedrijf ervoor staat — gebaseerd op cash, BTW, betalingsdiscipline, categorisatie en marge.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { qc.invalidateQueries({ queryKey: ["health-score"] }); refetch(); }} disabled={isFetching}>
          <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} />Herbereken
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : data ? (
        <>
          <motion.div variants={cardVariant}>
            <Card className="overflow-hidden">
              <div className={`h-1 ${score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-destructive"}`} />
              <CardContent className="pt-6">
                <div className="flex items-center gap-6">
                  <div className="relative h-32 w-32 flex items-center justify-center">
                    <svg className="absolute inset-0" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="45" fill="none"
                        stroke={score >= 70 ? "hsl(160 84% 39%)" : score >= 50 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))"}
                        strokeWidth="8"
                        strokeDasharray={`${(score / 100) * 283} 283`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        style={{ transition: "stroke-dasharray 0.6s ease-out" }}
                      />
                    </svg>
                    <div className="text-center relative z-10">
                      <div className={`text-3xl font-bold tabular-nums ${scoreColor}`}>{score}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">van 100</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className={`h-5 w-5 ${scoreColor}`} />
                      <span className="text-2xl font-bold text-foreground">Grade {grade}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {score >= 85 && "Uitstekend. Je bedrijf draait gezond."}
                      {score >= 70 && score < 85 && "Goed. Een paar puntjes om aan te scherpen."}
                      {score >= 55 && score < 70 && "Redelijk. Pak de zwakste sub-score eerst aan."}
                      {score >= 40 && score < 55 && "Aandacht nodig. Bekijk de waarschuwingen hieronder."}
                      {score < 40 && "Risicovol. Plan urgent een check met je accountant."}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Berekend op {new Date(data.computedAt).toLocaleString("nl-NL")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariant}>
            <h2 className="text-sm font-semibold text-foreground mb-3">Sub-scores</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {data.metrics.map((m) => (
                <Card key={m.key}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{m.label}</CardTitle>
                      <Badge
                        variant={m.status === "good" ? "default" : m.status === "warn" ? "secondary" : "destructive"}
                        className="text-[10px]"
                      >
                        {m.score}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Progress value={m.score} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">{m.detail}</p>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      Weegt {Math.round(m.weight * 100)}% mee in totaalscore
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div variants={cardVariant}>
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />Verbetersuggesties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.metrics
                  .filter((m) => m.status !== "good")
                  .sort((a, b) => a.score - b.score)
                  .slice(0, 3)
                  .map((m) => (
                    <div key={m.key} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">{m.label}</span>
                        <span className="text-muted-foreground"> — {suggestionFor(m.key)}</span>
                      </div>
                    </div>
                  ))}
                {data.metrics.every((m) => m.status === "good") && (
                  <div className="flex items-center gap-2 text-sm text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" /> Geen verbeterpunten — alles op groen.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : null}
    </motion.div>
  );
}

function suggestionFor(key: string): string {
  switch (key) {
    case "runway":
      return "Bouw een buffer op: 3-6 maanden vaste lasten op spaarrekening.";
    case "vat":
      return "Reserveer BTW direct bij iedere binnenkomende betaling op een aparte rekening.";
    case "ontime":
      return "Stuur automatische herinneringen 7 en 14 dagen na vervaldatum.";
    case "categorization":
      return "Pak openstaande transacties op de Transacties-pagina; bulk-categorisatie versnelt dit.";
    case "margin":
      return "Bekijk je grootste kostenposten of verhoog je tarief — zelfs 5% maakt verschil.";
    default:
      return "Bekijk de details en pak het laagste sub-onderdeel eerst aan.";
  }
}
