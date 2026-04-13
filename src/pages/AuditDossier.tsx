import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCheck, BookOpen, Receipt, GitMerge, FileDown, Shield, AlertTriangle, CheckCircle2, XCircle, Users, FileText, Loader2 } from "lucide-react";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";
import { useAuditDossier, AuditSection } from "@/hooks/useAuditDossier";
import { ExportButton } from "@/components/ExportButton";

const iconMap: Record<string, any> = {
  lead: BookOpen,
  invoices: Receipt,
  bank: GitMerge,
  vat: Shield,
  debtors: AlertTriangle,
  creditors: FileCheck,
  documents: FileText,
};

const statusConfig = {
  complete: { label: "Gereed", color: "text-emerald-400", bg: "bg-emerald-500/10", Icon: CheckCircle2 },
  warning: { label: "Aandacht", color: "text-amber-400", bg: "bg-amber-500/10", Icon: AlertTriangle },
  incomplete: { label: "Onvolledig", color: "text-red-400", bg: "bg-red-500/10", Icon: XCircle },
};

const fmt = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

export default function AuditDossier() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [sections, setSections] = useState<AuditSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { fetchAllSections } = useAuditDossier(year);

  useEffect(() => {
    setLoading(true);
    fetchAllSections().then((s) => {
      setSections(s);
      setLoading(false);
    });
  }, [fetchAllSections]);

  const completeness = sections.length > 0
    ? Math.round((sections.filter((s) => s.status === "complete").length / sections.length) * 100)
    : 0;

  const exportColumns = [
    { key: "title", header: "Sectie" },
    { key: "status", header: "Status" },
    { key: "itemCount", header: "Items" },
    { key: "totalAmount", header: "Bedrag" },
  ];

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Audit Dossier</h1>
          <p className="text-sm text-muted-foreground mt-1">Automatisch gegenereerd controledossier op basis van uw boekhouding</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportButton data={sections} columns={exportColumns} fileName={`audit-dossier-${year}`} />
          <Button size="sm" className="gap-1.5" disabled={loading}>
            <FileDown className="h-4 w-4" />Download Dossier
          </Button>
        </div>
      </motion.div>

      {/* Completeness overview */}
      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-foreground">Dossier Compleetheid</p>
                <p className="text-xs text-muted-foreground">{sections.filter((s) => s.status === "complete").length} van {sections.length} secties gereed</p>
              </div>
              <span className="text-2xl font-bold text-primary">{completeness}%</span>
            </div>
            <Progress value={completeness} className="h-2" />
            <div className="flex gap-4 mt-3">
              {Object.entries(statusConfig).map(([key, cfg]) => {
                const count = sections.filter((s) => s.status === key).length;
                return (
                  <div key={key} className="flex items-center gap-1.5 text-xs">
                    <cfg.Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    <span className="text-muted-foreground">{cfg.label}: {count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section cards */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <motion.div key={i} variants={cardVariant}>
                <Card className="arcory-glass">
                  <CardHeader className="pb-2"><Skeleton className="h-5 w-5" /></CardHeader>
                  <CardContent><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-3 w-24" /></CardContent>
                </Card>
              </motion.div>
            ))
          : sections.map((s) => {
              const Icon = iconMap[s.id] ?? FileText;
              const cfg = statusConfig[s.status];
              const isExpanded = expanded === s.id;

              return (
                <motion.div key={s.id} variants={cardVariant}>
                  <Card
                    className={`arcory-glass hover:border-primary/30 transition-colors cursor-pointer ${isExpanded ? "ring-1 ring-primary/30" : ""}`}
                    onClick={() => setExpanded(isExpanded ? null : s.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Icon className="h-5 w-5 text-primary" />
                        <Badge variant="outline" className={`text-[10px] gap-1 ${cfg.bg}`}>
                          <cfg.Icon className={`h-3 w-3 ${cfg.color}`} />
                          {cfg.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-sm mb-1">{s.title}</CardTitle>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{s.itemCount} items</span>
                        <span className="font-medium text-foreground">{fmt(s.totalAmount)}</span>
                      </div>

                      {isExpanded && s.details.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 pt-3 border-t border-border/50 space-y-1.5"
                        >
                          {s.details.slice(0, 8).map((d: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground truncate max-w-[60%]">
                                {d.label ?? d.name ?? d.invoice_number ?? d.code ?? `Item ${i + 1}`}
                              </span>
                              <span className="font-medium text-foreground">
                                {typeof d.value === "number"
                                  ? d.label?.includes("Percentage") ? `${d.value}%` : d.value < 1000 ? d.value : fmt(d.value)
                                  : d.balance != null ? fmt(d.balance)
                                  : d.total_amount != null ? fmt(Number(d.total_amount))
                                  : "—"}
                              </span>
                            </div>
                          ))}
                          {s.details.length > 8 && (
                            <p className="text-[10px] text-muted-foreground text-center pt-1">
                              +{s.details.length - 8} meer items
                            </p>
                          )}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
      </motion.div>
    </motion.div>
  );
}
