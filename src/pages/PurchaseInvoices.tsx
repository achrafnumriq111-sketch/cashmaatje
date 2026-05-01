import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { InvoicesTable } from "@/components/invoices/InvoicesTable";
import { PurchaseUpload } from "@/components/invoices/PurchaseUpload";
import { useInvoices, type InvoiceFilters as IFilters } from "@/hooks/useInvoices";
import { pageTransition, cardVariant } from "@/lib/animations";

export default function PurchaseInvoices() {
  const now = new Date();
  const [filters, setFilters] = useState<IFilters>({ status: "all", dateFrom: `${now.getFullYear()}-01-01`, dateTo: now.toISOString().split("T")[0], search: "" });
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data: invoices = [], isLoading } = useInvoices("purchase", filters);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Inkoopfacturen</h1>
          <p className="mt-1 text-sm text-muted-foreground">{invoices.length} {invoices.length === 1 ? "factuur" : "facturen"}</p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="rounded-xl"><Upload className="h-4 w-4 mr-2" /> Uploaden</Button>
      </motion.div>
      <motion.div variants={cardVariant}><InvoiceFilters filters={filters} onChange={setFilters} /></motion.div>
      <motion.div variants={cardVariant}><InvoicesTable invoices={invoices} isLoading={isLoading} /></motion.div>
      <PurchaseUpload open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </motion.div>
  );
}
