import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSearch, Shield, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Check = {
  category: string;
  label: string;
  status: "ok" | "warning" | "risk";
  score: number;
  reasoning: string;
  findings: string[];
};
type Analysis = {
  overall_risk: "low" | "medium" | "high";
  summary: string;
  checks: Check[];
};

const STATUS_ICON = {
  ok: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  risk: <XCircle className="h-4 w-4 text-red-400" />,
};

const RISK_LABEL = { low: "Laag risico", medium: "Middel risico", high: "Hoog risico" };
const RISK_COLOR = {
  low: "bg-emerald-400/10 text-emerald-400 border-emerald-400/30",
  medium: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  high: "bg-red-400/10 text-red-400 border-red-400/30",
};

export default function ContractIntelligence() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);

  async function handleFile(file: File) {
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      setText(await file.text());
    } else {
      toast.error("Alleen .txt wordt momenteel ondersteund — plak PDF/DOCX tekst");
    }
  }

  async function analyze() {
    if (text.trim().length < 50) {
      toast.error("Plak een contract van minimaal 50 tekens");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-contract", { body: { text } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as Analysis);
      toast.success("Analyse voltooid");
    } catch (e: any) {
      toast.error(e.message ?? "Analyse mislukt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contract Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload of plak contracttekst voor Wet DBA en compliance check</p>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={cardVariant}>
          <Card className="arcory-glass">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4 text-primary" />Contract uploaden</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="block border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition">
                <input type="file" accept=".txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <FileSearch className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Klik om .txt te uploaden (PDF/DOCX: plak tekst hieronder)</p>
              </label>
              <div className="relative">
                <p className="text-xs text-muted-foreground mb-2">Of plak contracttekst:</p>
                <Textarea placeholder="Plak hier de contracttekst..." rows={8} value={text} onChange={(e) => setText(e.target.value)} />
                <p className="text-[10px] text-muted-foreground mt-1">{text.length} tekens</p>
              </div>
              <Button className="w-full gap-1.5" disabled={!text.trim() || loading} onClick={analyze}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                {loading ? "Analyseren..." : "Analyseer Contract"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariant}>
          <Card className="arcory-glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Controle resultaten</span>
                {result && (
                  <Badge variant="outline" className={`text-xs ${RISK_COLOR[result.overall_risk]}`}>
                    {RISK_LABEL[result.overall_risk]}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result?.summary && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-foreground">
                  {result.summary}
                </div>
              )}
              {(result?.checks ?? [
                { category: "wet_dba", label: "Wet DBA Compliance", status: "ok" as const, reasoning: "Schijnzelfstandigheid risico", score: 0, findings: [] },
                { category: "exclusiviteit", label: "Exclusiviteitsclausules", status: "ok" as const, reasoning: "Verdachte exclusiviteit", score: 0, findings: [] },
                { category: "fiscaal", label: "Fiscale risico's", status: "ok" as const, reasoning: "Belastingrisico clausules", score: 0, findings: [] },
                { category: "betaling", label: "Betalingsvoorwaarden", status: "ok" as const, reasoning: "Betalingstermijnen analyse", score: 0, findings: [] },
              ]).map((check) => (
                <div key={check.category} className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result ? STATUS_ICON[check.status] : <div className="h-4 w-4 rounded-full bg-muted" />}
                      <p className="text-sm font-medium text-foreground">{check.label}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{result ? `${check.score}/100` : "Wacht op input"}</Badge>
                  </div>
                  {result && (
                    <>
                      <p className="text-xs text-muted-foreground">{check.reasoning}</p>
                      {check.findings.length > 0 && (
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                          {check.findings.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
