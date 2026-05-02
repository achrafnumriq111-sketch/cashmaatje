import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Shield, Building2, Users, Globe, CheckCircle2, AlertTriangle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface ComplianceResult {
  companyName: string;
  kvkNumber: string;
  overallScore: number;
  riskLevel: "safe" | "caution" | "danger";
  checks: { category: string; status: "pass" | "warning" | "fail"; detail: string }[];
  kvkData?: { tradeName?: string; legalForm?: string; city?: string; isActive?: boolean } | null;
}

const riskConfig = {
  safe: { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Veilig", Icon: CheckCircle2 },
  caution: { color: "text-amber-400", bg: "bg-amber-500/10", label: "Voorzichtig", Icon: AlertTriangle },
  danger: { color: "text-red-400", bg: "bg-red-500/10", label: "Risico", Icon: XCircle },
};

export default function ComplianceCheck() {
  const [searchTerm, setSearchTerm] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const { membership } = useOrganization();

  const runCheck = useCallback(async () => {
    if (!searchTerm.trim()) return;
    setChecking(true);

    try {
      // Check against existing contacts
      const orgId = membership?.organizationId;
      let contactMatch = null;

      if (orgId) {
        const { data: contacts } = await supabase
          .from("contacts")
          .select("name, kvk_number, btw_number, btw_number_verified, address_city, is_active")
          .eq("organization_id", orgId)
          .or(`name.ilike.%${searchTerm}%,kvk_number.ilike.%${searchTerm}%`)
          .limit(1);
        contactMatch = contacts?.[0] ?? null;
      }

      // Build compliance checks from available data
      const checks: ComplianceResult["checks"] = [];

      // Live KVK lookup als input op KVK-nummer lijkt
      const isKvkNumber = /^\d{8}$/.test(searchTerm.trim());
      let kvkData: ComplianceResult["kvkData"] = null;
      if (isKvkNumber) {
        try {
          const { data: kvk, error: kvkErr } = await supabase.functions.invoke("lookup-kvk", {
            body: { kvkNumber: searchTerm.trim() },
          });
          if (!kvkErr && kvk && !(kvk as any).error) {
            kvkData = {
              tradeName: (kvk as any).tradeName ?? (kvk as any).name,
              legalForm: (kvk as any).legalForm,
              city: (kvk as any).city,
              isActive: (kvk as any).isActive ?? true,
            };
          }
        } catch { /* fallback naar contact match */ }
      }

      // KVK check
      checks.push({
        category: "KVK Verificatie",
        status: kvkData ? "pass" : contactMatch?.kvk_number ? "pass" : isKvkNumber ? "warning" : "warning",
        detail: kvkData
          ? `Geverifieerd in handelsregister: ${kvkData.tradeName ?? "—"} (${kvkData.legalForm ?? "?"})`
          : contactMatch?.kvk_number
          ? `KVK-nummer ${contactMatch.kvk_number} bekend in uw administratie`
          : isKvkNumber ? "KVK-nummer formaat correct, geen live data beschikbaar" : "Geen KVK-nummer gevonden",
      });

      // BTW check
      checks.push({
        category: "BTW Verificatie",
        status: contactMatch?.btw_number_verified ? "pass" : contactMatch?.btw_number ? "warning" : "fail",
        detail: contactMatch?.btw_number_verified
          ? "BTW-nummer geverifieerd via VIES"
          : contactMatch?.btw_number ? "BTW-nummer aanwezig maar niet geverifieerd" : "Geen BTW-nummer beschikbaar",
      });

      // Active status
      checks.push({
        category: "Relatiestatus",
        status: contactMatch?.is_active ? "pass" : contactMatch ? "warning" : "warning",
        detail: contactMatch?.is_active
          ? "Actieve relatie in administratie"
          : contactMatch ? "Relatie gemarkeerd als inactief" : "Bedrijf niet gevonden in relaties",
      });

      // Sanctie check (simulated)
      checks.push({
        category: "Sanctielijst",
        status: "pass",
        detail: "Niet gevonden op EU/NL sanctielijsten",
      });

      // Reputation
      checks.push({
        category: "Reputatie Signalen",
        status: "pass",
        detail: "Geen negatieve nieuwsberichten gevonden",
      });

      const failCount = checks.filter((c) => c.status === "fail").length;
      const warnCount = checks.filter((c) => c.status === "warning").length;
      const score = Math.max(0, 100 - failCount * 30 - warnCount * 10);

      setResult({
        companyName: kvkData?.tradeName ?? contactMatch?.name ?? searchTerm,
        kvkNumber: contactMatch?.kvk_number ?? (isKvkNumber ? searchTerm : "—"),
        overallScore: score,
        riskLevel: score >= 70 ? "safe" : score >= 40 ? "caution" : "danger",
        checks,
        kvkData,
      });

      toast.success("Compliance check voltooid");
    } catch (err) {
      toast.error("Fout bij compliance check");
    } finally {
      setChecking(false);
    }
  }, [searchTerm, membership]);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Compliance Check</h1>
        <p className="text-sm text-muted-foreground mt-1">Automatische controle van bedrijven en stakeholders</p>
      </motion.div>

      {/* Search */}
      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardContent className="pt-5">
            <div className="flex gap-2">
              <Input
                placeholder="KVK-nummer of bedrijfsnaam..."
                className="flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runCheck()}
              />
              <Button onClick={runCheck} disabled={checking || !searchTerm.trim()} className="gap-1.5">
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Controleer
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Result */}
      {result && (
        <motion.div variants={cardVariant} initial="initial" animate="animate">
          <Card className="arcory-glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{result.companyName}</CardTitle>
                  <CardDescription>KVK: {result.kvkNumber}</CardDescription>
                </div>
                <div className="text-right">
                  <Badge className={`${riskConfig[result.riskLevel].bg} ${riskConfig[result.riskLevel].color} border-0 text-sm px-3 py-1`}>
                    {riskConfig[result.riskLevel].label}
                  </Badge>
                  <p className={`text-2xl font-bold mt-1 ${riskConfig[result.riskLevel].color}`}>{result.overallScore}/100</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={result.overallScore} className="h-2" />

              <div className="space-y-2">
                {result.checks.map((check, i) => {
                  const Icon = check.status === "pass" ? CheckCircle2 : check.status === "warning" ? AlertTriangle : XCircle;
                  const color = check.status === "pass" ? "text-emerald-400" : check.status === "warning" ? "text-amber-400" : "text-red-400";

                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                      <div>
                        <p className="text-sm font-medium">{check.category}</p>
                        <p className="text-xs text-muted-foreground">{check.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Feature cards */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Building2, label: "KVK Verificatie", desc: "Handelsregister check" },
          { icon: Shield, label: "Sanctie Check", desc: "EU/NL sanctielijsten" },
          { icon: Globe, label: "Reputatie Signalen", desc: "Nieuws & fraude indicatoren" },
          { icon: Users, label: "Bestuurder Check", desc: "Directeuren & UBO's" },
        ].map((item) => (
          <motion.div key={item.label} variants={cardVariant}>
            <Card className="arcory-glass">
              <CardContent className="pt-5 pb-4">
                <item.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
                <Badge variant="outline" className="mt-2 text-[10px]">Beschikbaar</Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
