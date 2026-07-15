import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, FileDown, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { useInvoiceAging } from "@/hooks/useInvoiceAging";
import { pageTransition, cardVariant } from "@/lib/animations";
import { exportAgingCsv, exportAgingPdf } from "@/lib/agingExport";

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n || 0);

const HEADS: Array<{ key: keyof AgingRow; label: string; cls?: string }> = [
  { key: "not_due", label: "Niet vervallen", cls: "text-muted-foreground" },
  { key: "b0_30", label: "0-30 dgn", cls: "text-foreground" },
  { key: "b31_60", label: "31-60 dgn", cls: "text-amber-500" },
  { key: "b61_90", label: "61-90 dgn", cls: "text-orange-500" },
  { key: "b90_plus", label: "90+ dgn", cls: "text-destructive" },
];
type AgingRow = { not_due: number; b0_30: number; b31_60: number; b61_90: number; b90_plus: number; total: number };

export default function InvoiceAging() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { data, isLoading } = useInvoiceAging("sales");

  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const handleCsv = () => {
    if (!data?.groups.length) return toast.info("Geen openstaande facturen");
    exportAgingCsv(data.groups);
    toast.success("CSV gedownload");
  };
  const handlePdf = () => {
    if (!data?.groups.length) return toast.info("Geen openstaande facturen");
    exportAgingPdf(data.groups, data.grandTotals);
    toast.success("PDF gedownload");
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Aging Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Openstaande verkoopfacturen per klant en per ouderdomsbucket
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCsv} className="rounded-xl">
            <FileDown className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" onClick={handlePdf} className="rounded-xl">
            <FileDown className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>
      </motion.div>

      <motion.div variants={cardVariant} className="rounded-2xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Laden…</div>
        ) : !data || data.groups.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Geen openstaande facturen. Alles keurig betaald.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-8" />
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Klant</TableHead>
                {HEADS.map((h) => (
                  <TableHead key={h.key} className={cn("text-[11px] uppercase tracking-[0.08em] font-medium text-right", h.cls)}>
                    {h.label}
                  </TableHead>
                ))}
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium text-right">Totaal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.groups.map((g) => {
                const key = g.contact_id ?? `name:${g.contact_name}`;
                const open = expanded.has(key);
                return (
                  <>
                    <TableRow key={key} className="border-border/60 cursor-pointer hover:bg-muted/40" onClick={() => toggle(key)}>
                      <TableCell>
                        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{g.contact_name}</TableCell>
                      {HEADS.map((h) => (
                        <TableCell key={h.key} className={cn("text-right text-sm tabular-nums", g.totals[h.key] > 0 ? h.cls : "text-muted-foreground/40")}>
                          {g.totals[h.key] > 0 ? fmt(g.totals[h.key]) : "—"}
                        </TableCell>
                      ))}
                      <TableCell className="text-right text-sm font-semibold tabular-nums">{fmt(g.totals.total)}</TableCell>
                    </TableRow>
                    {open && g.invoices.map((inv) => (
                      <TableRow key={inv.id} className="border-border/60 bg-muted/20">
                        <TableCell />
                        <TableCell className="pl-8 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{inv.invoice_number}</span>
                            <span>·</span>
                            <span>{inv.due_date ? format(new Date(inv.due_date), "d MMM yyyy", { locale: nl }) : "—"}</span>
                            {inv.days_overdue > 0 && (
                              <span className="text-destructive">({inv.days_overdue}d te laat)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell colSpan={5} className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs" onClick={(e) => { e.stopPropagation(); toast.info("Herinnering wordt voorbereid"); }}>
                              <Mail className="h-3 w-3 mr-1" /> Herinner
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs" onClick={(e) => e.stopPropagation()}>
                              <Phone className="h-3 w-3 mr-1" /> Bel
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{fmt(inv.amount_open)}</TableCell>
                      </TableRow>
                    ))}
                  </>
                );
              })}
              {/* Grand total row */}
              <TableRow className="border-t-2 border-border bg-muted/40 hover:bg-muted/40">
                <TableCell />
                <TableCell className="text-sm font-semibold uppercase tracking-wider text-xs">Totaal</TableCell>
                {HEADS.map((h) => (
                  <TableCell key={h.key} className={cn("text-right text-sm font-semibold tabular-nums", h.cls)}>
                    {fmt(data.grandTotals[h.key])}
                  </TableCell>
                ))}
                <TableCell className="text-right text-base font-bold tabular-nums">{fmt(data.grandTotals.total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </motion.div>
    </motion.div>
  );
}
