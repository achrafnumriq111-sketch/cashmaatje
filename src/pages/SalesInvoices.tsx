import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, FileDown } from "lucide-react";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { InvoicesTable } from "@/components/invoices/InvoicesTable";
import { SalesInvoiceForm } from "@/components/invoices/SalesInvoiceForm";
import { InvoiceDropZone } from "@/components/invoices/InvoiceDropZone";
import { InvoiceBulkActions } from "@/components/invoices/InvoiceBulkActions";
import { QuickFilters, DATE_PRESETS, getDateRangeFromPreset, type DateRangePreset } from "@/components/ui/quick-filters";
import { useInvoices, type InvoiceFilters as IFilters } from "@/hooks/useInvoices";
import { exportInvoicesPDF } from "@/lib/pdfExport";
import { pageTransition, cardVariant } from "@/lib/animations";
import { toast } from "sonner";

const STATUS_TABS = [
  { value: "all" as const, label: "Alles" },
  { value: "draft" as const, label: "Concept" },
  { value: "sent" as const, label: "Verzonden" },
  { value: "paid" as const, label: "Betaald" },
  { value: "overdue" as const, label: "Verlopen" },
  { value: "archived" as const, label: "Archief" },
];

export default function SalesInvoices() {
  const [preset, setPreset] = useState<DateRangePreset>("year");
  const initialRange = getDateRangeFromPreset("year");
  const [tab, setTab] = useState<string>("all");
  const [filters, setFilters] = useState<IFilters>({
    status: "all",
    dateFrom: initialRange.from,
    dateTo: initialRange.to,
    search: "",
    showArchived: false,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: invoices = [], isLoading } = useInvoices("sales", filters);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: invoices.length };
    invoices.forEach((i) => {
      map[i.status] = (map[i.status] || 0) + 1;
    });
    return map;
  }, [invoices]);

  const onTabChange = (v: string) => {
    setTab(v);
    if (v === "archived") {
      setFilters((f) => ({ ...f, status: "all", showArchived: true }));
    } else {
      setFilters((f) => ({ ...f, status: v as IFilters["status"], showArchived: false }));
    }
  };

  const handlePreset = (p: DateRangePreset) => {
    const r = getDateRangeFromPreset(p);
    setPreset(p);
    setFilters((f) => ({ ...f, dateFrom: r.from, dateTo: r.to }));
  };

  const handleExport = () => {
    if (!invoices.length) {
      toast.info("Geen facturen om te exporteren");
      return;
    }
    exportInvoicesPDF({ type: "sales", invoices, dateFrom: filters.dateFrom, dateTo: filters.dateTo });
    toast.success("PDF gedownload");
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Verkoopfacturen</h1>
          <p className="mt-1 text-sm text-muted-foreground">{invoices.length} {invoices.length === 1 ? "factuur" : "facturen"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="rounded-xl">
            <FileDown className="h-4 w-4 mr-2" /> Export PDF
          </Button>
          <Button onClick={() => setFormOpen(true)} className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> Nieuwe factuur
          </Button>
        </div>
      </motion.div>

      <motion.div variants={cardVariant}>
        <InvoiceDropZone mode="sales" />
      </motion.div>

      <motion.div variants={cardVariant} className="flex flex-wrap items-center gap-3">
        <QuickFilters
          options={STATUS_TABS.map((t) => ({ ...t, count: counts[t.value] ?? 0 }))}
          value={tab}
          onChange={onTabChange}
        />
        <QuickFilters options={DATE_PRESETS} value={preset} onChange={handlePreset} />
      </motion.div>

      <motion.div variants={cardVariant}>
        <InvoiceFilters filters={filters} onChange={setFilters} />
      </motion.div>

      {selectedIds.size > 0 && (
        <InvoiceBulkActions
          selectedIds={Array.from(selectedIds)}
          invoices={invoices as any}
          type="sales"
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onClear={() => setSelectedIds(new Set())}
          showArchive={filters.showArchived ? "restore" : "archive"}
        />
      )}

      <motion.div variants={cardVariant}>
        <InvoicesTable
          invoices={invoices}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </motion.div>

      <SalesInvoiceForm open={formOpen} onClose={() => setFormOpen(false)} />
    </motion.div>
  );
}
