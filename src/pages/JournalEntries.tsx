import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { JournalFilters } from "@/components/journal/JournalFilters";
import { JournalTable } from "@/components/journal/JournalTable";
import { JournalDetail } from "@/components/journal/JournalDetail";
import { MemorialJournalDialog } from "@/components/journal/MemorialJournalDialog";
import { useJournalEntries, type JournalFilters as JFilters } from "@/hooks/useJournalEntries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollText, Plus } from "lucide-react";
import { toast } from "sonner";
import { pageTransition, cardVariant } from "@/lib/animations";
import { exportToExcel } from "@/lib/exportUtils";
import { useEntityAccess } from "@/hooks/useEntityAccess";

export default function JournalEntries() {
  const now = new Date();
  const [filters, setFilters] = useState<JFilters>({
    dateFrom: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0],
    dateTo: new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0],
    status: "all", search: "", sourceType: "all", vatBox: "", accountId: null,
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [memorialOpen, setMemorialOpen] = useState(false);
  const { canWrite } = useEntityAccess();
  const { data: entries = [], isLoading } = useJournalEntries(filters);
  const selectedEntry = useMemo(() => entries.find((e) => e.id === detailId) ?? null, [entries, detailId]);

  const stats = useMemo(() => {
    const posted = entries.filter((e) => e.status === "posted").length;
    const review = entries.filter((e) => e.ai_generated && (e.ai_confidence ?? 1) < 0.75).length;
    return { total: entries.length, posted, review };
  }, [entries]);

  const handleExport = () => {
    if (entries.length === 0) { toast.info("Geen data om te exporteren"); return; }
    const data = entries.map((e) => ({
      entry_number: e.entry_number,
      date: e.date,
      description: e.description ?? "",
      status: e.status,
      source_type: e.source_type ?? "system",
      ai_confidence: e.ai_confidence != null ? Math.round(e.ai_confidence * 100) + "%" : "",
    }));
    exportToExcel(
      data,
      [
        { header: "Nummer", key: "entry_number" },
        { header: "Datum", key: "date", format: "date" },
        { header: "Omschrijving", key: "description" },
        { header: "Status", key: "status" },
        { header: "Bron", key: "source_type" },
        { header: "AI", key: "ai_confidence" },
      ],
      `journaalposten_${filters.dateFrom}_${filters.dateTo}`,
      "Journaalposten"
    );
    toast.success("Excel-export gedownload");
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-4">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Journaalposten</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.total} posten
            {stats.review > 0 && <Badge variant="secondary" className="ml-2 bg-amber-500/15 text-amber-400 border-0 text-[10px]">{stats.review} review nodig</Badge>}
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setMemorialOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Memoriaalboeking
          </Button>
        )}
      </motion.div>

      <motion.div variants={cardVariant}><JournalFilters filters={filters} onChange={setFilters} onExport={handleExport} /></motion.div>
      <motion.div variants={cardVariant}><JournalTable entries={entries} isLoading={isLoading} onRowClick={(id) => setDetailId(id)} /></motion.div>
      <JournalDetail entry={selectedEntry} open={!!detailId} onClose={() => setDetailId(null)} />
      <MemorialJournalDialog open={memorialOpen} onOpenChange={setMemorialOpen} />
    </motion.div>
  );
}
