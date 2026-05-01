import { Button } from "@/components/ui/button";
import { Check, X, Send, Ban, Trash2, FileDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportInvoicesPDF, type InvoicePdfRow } from "@/lib/pdfExport";

interface Props {
  selectedIds: string[];
  invoices: InvoicePdfRow[];
  type: "sales" | "purchase";
  dateFrom: string;
  dateTo: string;
  onClear: () => void;
}

export function InvoiceBulkActions({ selectedIds, invoices, type, dateFrom, dateTo, onClear }: Props) {
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: status as any })
        .in("id", selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoices").delete().in("id", selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const handle = async (action: "sent" | "paid" | "cancelled" | "delete") => {
    try {
      if (action === "delete") {
        if (!confirm(`${selectedIds.length} facturen verwijderen?`)) return;
        await remove.mutateAsync();
        toast.success(`${selectedIds.length} verwijderd`);
      } else {
        await updateStatus.mutateAsync(action);
        const labels: Record<string, string> = { sent: "verzonden", paid: "betaald", cancelled: "geannuleerd" };
        toast.success(`${selectedIds.length} ${labels[action]}`);
      }
      onClear();
    } catch (e: any) {
      toast.error(e?.message || "Bewerking mislukt");
    }
  };

  const handleExport = () => {
    const rows = invoices.filter((i: any) => selectedIds.includes(i.id));
    if (!rows.length) return;
    exportInvoicesPDF({ type, invoices: rows, dateFrom, dateTo });
    toast.success("PDF gedownload");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2">
      <span className="text-sm font-medium text-primary mr-2">{selectedIds.length} geselecteerd</span>

      <div className="flex flex-wrap items-center gap-1.5 ml-auto">
        <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => handle("sent")} disabled={updateStatus.isPending}>
          <Send className="h-3.5 w-3.5 mr-1.5" /> Markeer verzonden
        </Button>
        <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => handle("paid")} disabled={updateStatus.isPending}>
          <Check className="h-3.5 w-3.5 mr-1.5" /> Markeer betaald
        </Button>
        <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => handle("cancelled")} disabled={updateStatus.isPending}>
          <Ban className="h-3.5 w-3.5 mr-1.5" /> Annuleer
        </Button>
        <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={handleExport}>
          <FileDown className="h-3.5 w-3.5 mr-1.5" /> Export PDF
        </Button>
        <Button size="sm" variant="ghost" className="h-8 rounded-lg text-destructive hover:text-destructive" onClick={() => handle("delete")} disabled={remove.isPending}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Verwijder
        </Button>
        <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg p-0" onClick={onClear}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
