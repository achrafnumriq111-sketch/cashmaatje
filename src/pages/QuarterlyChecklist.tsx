import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Calendar, FileCheck, Receipt, Calculator, FolderCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { pageTransition, cardVariant, staggerContainer } from "@/lib/animations";
import { Skeleton } from "@/components/ui/skeleton";

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  icon: any;
  isAuto: boolean;
  status: "done" | "todo" | "warning";
  detail?: string;
}

const QUARTERS = [1, 2, 3, 4];
const Q_MONTHS: Record<number, [number, number]> = { 1: [0, 2], 2: [3, 5], 3: [6, 8], 4: [9, 11] };

export default function QuarterlyChecklist() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(today.getMonth() / 3) + 1);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    (async () => {
      const [m1, m2] = Q_MONTHS[quarter];
      const start = new Date(year, m1, 1).toISOString().split("T")[0];
      const end = new Date(year, m2 + 1, 0).toISOString().split("T")[0];

      const [salesInv, purchaseInv, draftJournals, vatLines, manualRows] = await Promise.all([
        supabase.from("invoices").select("id,status,amount_due", { count: "exact" }).eq("organization_id", orgId).eq("invoice_type", "sales").gte("invoice_date", start).lte("invoice_date", end),
        supabase.from("invoices").select("id,status,document_id", { count: "exact" }).eq("organization_id", orgId).eq("invoice_type", "purchase").gte("invoice_date", start).lte("invoice_date", end),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "draft").gte("date", start).lte("date", end),
        supabase.from("journal_lines").select("vat_amount, journal_entries!inner(organization_id, date, status)").eq("journal_entries.organization_id", orgId).eq("journal_entries.status", "posted").gte("journal_entries.date", start).lte("journal_entries.date", end).not("vat_box", "is", null),
        supabase.from("quarterly_checklist_items").select("item_key,is_checked").eq("organization_id", orgId).eq("year", year).eq("quarter", quarter),
      ]);

      const manualMap: Record<string, boolean> = {};
      (manualRows.data ?? []).forEach((r: any) => { manualMap[r.item_key] = r.is_checked; });
      setManualChecks(manualMap);

      const openSales = (salesInv.data ?? []).filter((i: any) => ["draft"].includes(i.status)).length;
      const purchaseMissingDoc = (purchaseInv.data ?? []).filter((i: any) => !i.document_id).length;
      const draftCount = draftJournals.count ?? 0;
      const vatTotal = (vatLines.data ?? []).reduce((s: number, l: any) => s + Number(l.vat_amount ?? 0), 0);

      setItems([
        {
          key: "all_invoices_complete",
          label: "Alle facturen verzonden",
          description: "Geen concept-verkoopfacturen meer.",
          icon: FileCheck, isAuto: true,
          status: openSales === 0 ? "done" : "warning",
          detail: openSales === 0 ? "Klaar" : `${openSales} concept-factu${openSales === 1 ? "ur" : "ren"} open`,
        },
        {
          key: "all_receipts_attached",
          label: "Bonnen aan inkoopfacturen",
          description: "Elke inkoop heeft een document.",
          icon: Receipt, isAuto: true,
          status: purchaseMissingDoc === 0 ? "done" : "warning",
          detail: purchaseMissingDoc === 0 ? "Compleet" : `${purchaseMissingDoc} zonder bon`,
        },
        {
          key: "no_draft_journals",
          label: "Geen openstaande boekingen",
          description: "Alle journaalposten geboekt (posted).",
          icon: Calculator, isAuto: true,
          status: draftCount === 0 ? "done" : "warning",
          detail: draftCount === 0 ? "Boekhouding sluit aan" : `${draftCount} concept-boeking${draftCount === 1 ? "" : "en"}`,
        },
        {
          key: "vat_calculated",
          label: "BTW berekend",
          description: "Aangifte staat klaar voor verzending.",
          icon: Receipt, isAuto: true,
          status: Math.abs(vatTotal) > 0 ? "done" : "todo",
          detail: Math.abs(vatTotal) > 0 ? `€${vatTotal.toFixed(2)} BTW geboekt` : "Nog geen BTW geboekt",
        },
        { key: "vat_filed", label: "BTW-aangifte ingediend", description: "Bij Belastingdienst.", icon: FileCheck, isAuto: false, status: manualMap["vat_filed"] ? "done" : "todo" },
        { key: "export_for_accountant", label: "Export voor boekhouder", description: "Kwartaalpakket gegenereerd.", icon: FolderCheck, isAuto: false, status: manualMap["export_for_accountant"] ? "done" : "todo" },
        { key: "accountant_access", label: "Boekhouder toegang gecheckt", description: "Klopt de toegang nog?", icon: Users, isAuto: false, status: manualMap["accountant_access"] ? "done" : "todo" },
      ]);
      setLoading(false);
    })();
  }, [orgId, year, quarter]);

  const toggleManual = async (key: string) => {
    if (!orgId) return;
    const next = !manualChecks[key];
    setManualChecks({ ...manualChecks, [key]: next });
    await supabase.from("quarterly_checklist_items").upsert(
      { organization_id: orgId, year, quarter, item_key: key, is_checked: next, checked_at: next ? new Date().toISOString() : null },
      { onConflict: "organization_id,year,quarter,item_key" }
    );
    setItems((prev) => prev.map((i) => i.key === key ? { ...i, status: next ? "done" : "todo" } : i));
  };

  const completed = items.filter((i) => i.status === "done").length;
  const progress = items.length ? (completed / items.length) * 100 : 0;

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-[1100px]">
      <motion.div variants={cardVariant} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-foreground">Kwartaal-checklist</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Wat moet er nog voor de kwartaalafsluiting?</p>
        </div>
        <div className="flex gap-2">
          {QUARTERS.map((q) => (
            <Button key={q} variant={q === quarter ? "default" : "outline"} size="sm" onClick={() => setQuarter(q)}>Q{q}</Button>
          ))}
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border border-border bg-card px-2 text-[13px]">
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </motion.div>

      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardContent className="p-5">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-micro text-muted-foreground">Voortgang Q{quarter} {year}</p>
                <p className="text-[24px] font-semibold tabular-nums">{completed}/{items.length}</p>
              </div>
              <span className={`text-[12.5px] ${progress === 100 ? "text-emerald-400" : "text-muted-foreground"}`}>
                {progress === 100 ? "Klaar voor afsluiting 🎉" : `${Math.round(progress)}% compleet`}
              </span>
            </div>
            <Progress value={progress} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </motion.div>

      {loading ? <Skeleton className="h-96 w-full rounded-2xl" /> : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isDone = item.status === "done";
            return (
              <motion.button
                key={item.key} variants={cardVariant}
                onClick={() => !item.isAuto && toggleManual(item.key)}
                disabled={item.isAuto}
                className={`arcory-glass w-full rounded-2xl p-4 text-left transition-colors ${!item.isAuto ? "hover:bg-white/[0.02] cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDone ? "bg-emerald-400/10" : item.status === "warning" ? "bg-amber-400/10" : "bg-secondary/40"}`}>
                    {isDone ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[14px] font-medium text-foreground">{item.label}</p>
                      {item.isAuto && <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground/60">Auto</span>}
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">{item.description}</p>
                  </div>
                  {item.detail && (
                    <span className={`text-[12px] ${item.status === "done" ? "text-emerald-400" : item.status === "warning" ? "text-amber-400" : "text-muted-foreground"}`}>
                      {item.detail}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
