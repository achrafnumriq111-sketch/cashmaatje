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
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-4 sm:space-y-6">
      <motion.div variants={cardVariant} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold">Inkoopfacturen</h1>
        <Button onClick={() => setUploadOpen(true)} className="w-full sm:w-auto"><Upload className="h-4 w-4 mr-2" /> Factuur uploaden</Button>
      </motion.div>
      <motion.div variants={cardVariant}><InvoiceFilters filters={filters} onChange={setFilters} /></motion.div>
      <motion.div variants={cardVariant} className="bg-card border border-border rounded-lg overflow-x-auto"><InvoicesTable invoices={invoices} isLoading={isLoading} /></motion.div>
      <PurchaseUpload open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </motion.div>
  );
}
