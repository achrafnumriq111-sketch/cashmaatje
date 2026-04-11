import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { InvoicesTable } from "@/components/invoices/InvoicesTable";
import { PurchaseUpload } from "@/components/invoices/PurchaseUpload";
import { useInvoices, type InvoiceFilters as IFilters } from "@/hooks/useInvoices";

export default function PurchaseInvoices() {
  const now = new Date();
  const [filters, setFilters] = useState<IFilters>({
    status: "all",
    dateFrom: `${now.getFullYear()}-01-01`,
    dateTo: now.toISOString().split("T")[0],
    search: "",
  });
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: invoices = [], isLoading } = useInvoices("purchase", filters);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold">Inkoopfacturen</h1>
        <Button onClick={() => setUploadOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
          <Upload className="h-4 w-4 mr-2" /> Factuur uploaden
        </Button>
      </div>

      <InvoiceFilters filters={filters} onChange={setFilters} />

      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <InvoicesTable invoices={invoices} isLoading={isLoading} />
      </div>

      <PurchaseUpload open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
