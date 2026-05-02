import { motion } from "framer-motion";
import { pageTransition, cardVariant } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Download, FileText, Receipt, BookOpen, ScrollText, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AccountantSharesCard } from "@/components/accountant/AccountantSharesCard";

/**
 * Accountant Portal — read-only werkdossier voor de boekhouder/accountant.
 * Bundelt links naar alle relevante rapporten, een snel overzicht van openstaande punten,
 * en directe export-acties. Niet gelimiteerd qua rol (iedereen mag het zien) — de naam
 * geeft aan dat dit het "scherm voor je accountant" is.
 */
export default function AccountantPortal() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  const { data: stats } = useQuery({
    queryKey: ["accountant-portal-stats", orgId],
    queryFn: async () => {
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
      const [draftJournals, uncatTx, openSales, missingDocs] = await Promise.all([
        supabase.from("journal_entries").select("id", { count: "exact", head: true })
          .eq("organization_id", orgId!).eq("status", "draft"),
        supabase.from("bank_transactions").select("id", { count: "exact", head: true })
          .eq("organization_id", orgId!).is("account_id", null).eq("status", "new"),
        supabase.from("invoices").select("id", { count: "exact", head: true })
          .eq("organization_id", orgId!).eq("invoice_type", "sales").neq("status", "paid").neq("status", "cancelled"),
        supabase.from("invoices").select("id", { count: "exact", head: true })
          .eq("organization_id", orgId!).is("document_id", null).gte("invoice_date", yearStart),
      ]);
      return {
        draftJournals: draftJournals.count ?? 0,
        uncatTx: uncatTx.count ?? 0,
        openSales: openSales.count ?? 0,
        missingDocs: missingDocs.count ?? 0,
      };
    },
    enabled: !!orgId,
  });

  const reports = [
    { title: "Winst & Verlies", desc: "Resultatenrekening per periode", icon: <FileText className="h-4 w-4" />, to: "/rapporten/winst-verlies" },
    { title: "Balans", desc: "Activa, passiva, eigen vermogen", icon: <FileText className="h-4 w-4" />, to: "/rapporten/balans" },
    { title: "Proefbalans", desc: "Saldi per grootboekrekening", icon: <FileText className="h-4 w-4" />, to: "/rapporten/proefbalans" },
    { title: "BTW-aangifte", desc: "Per periode met onderliggende rubrieken", icon: <Receipt className="h-4 w-4" />, to: "/btw/aangifte" },
    { title: "ICP-opgave", desc: "Intracommunautaire transacties", icon: <Receipt className="h-4 w-4" />, to: "/btw/icp" },
    { title: "Grootboek", desc: "Alle rekeningen met mutaties", icon: <BookOpen className="h-4 w-4" />, to: "/grootboek" },
    { title: "Journaalposten", desc: "Volledig journaal met audit trail", icon: <ScrollText className="h-4 w-4" />, to: "/journaalposten" },
    { title: "Audit log", desc: "Wie deed wat wanneer", icon: <ShieldCheck className="h-4 w-4" />, to: "/audit-log" },
  ];

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Accountant Portal</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Eén werkdossier voor je boekhouder of accountant. Alle rapporten, openstaande punten en exports op één plek.
          </p>
        </div>
        <Button asChild>
          <Link to="/exports"><Download className="h-4 w-4 mr-2" />Export Center</Link>
        </Button>
      </motion.div>

      {stats && (
        <motion.div variants={cardVariant} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Concept-journaalposten" value={stats.draftJournals} tone={stats.draftJournals > 0 ? "warn" : "ok"} hint="Nog niet geboekt" />
          <KpiCard label="Niet-gecategoriseerde transacties" value={stats.uncatTx} tone={stats.uncatTx > 5 ? "warn" : "ok"} hint="Vereisen aandacht" />
          <KpiCard label="Openstaande verkoopfacturen" value={stats.openSales} tone="info" hint="Debiteurensaldo" />
          <KpiCard label="Facturen zonder document" value={stats.missingDocs} tone={stats.missingDocs > 0 ? "warn" : "ok"} hint="Bewijsstuk ontbreekt" />
        </motion.div>
      )}

      <motion.div variants={cardVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rapporten & exports</CardTitle>
            <CardDescription>Snelle toegang tot alles wat je accountant nodig heeft.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {reports.map((r) => (
                <Link
                  key={r.to}
                  to={r.to}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 hover:border-primary/40 hover:bg-primary/5 transition group"
                >
                  <div className="rounded-md bg-secondary p-2 group-hover:bg-primary/10 group-hover:text-primary transition">
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={cardVariant}>
        <AccountantSharesCard />
      </motion.div>
    </motion.div>
  );
}

function KpiCard({ label, value, tone, hint }: { label: string; value: number; tone: "ok" | "warn" | "info"; hint: string }) {
  const toneClass =
    tone === "warn" ? "text-amber-500" : tone === "info" ? "text-primary" : "text-emerald-500";
  return (
    <Card>
      <CardContent className="pt-4">
        <div className={`text-2xl font-bold tabular-nums ${toneClass}`}>{value}</div>
        <div className="text-xs font-medium text-foreground mt-1">{label}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}
