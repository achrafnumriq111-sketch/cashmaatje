import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { FileText, Receipt, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cardVariant, staggerContainerFast, tableRowVariant } from "@/lib/animations";

interface Doc {
  id: string;
  file_name: string;
  document_type: string;
  extracted_supplier_name: string | null;
  extracted_amount: number | null;
  extracted_date: string | null;
  ocr_status: string | null;
  processing_status: string | null;
  created_at: string | null;
}

function fmt(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

function statusIcon(doc: Doc) {
  if (doc.ocr_status === "processing" || doc.ocr_status === "pending")
    return <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />;
  if (doc.ocr_status === "failed")
    return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
  if (doc.processing_status === "processed")
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  return <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />;
}

function statusLabel(doc: Doc) {
  if (doc.ocr_status === "pending" || doc.ocr_status === "processing") return "Verwerken...";
  if (doc.ocr_status === "failed") return "Mislukt";
  if (doc.processing_status === "processed") return "Verwerkt";
  return "Inbox";
}

interface Props {
  documents: Doc[];
  isLoading: boolean;
}

export function RecentDocuments({ documents, isLoading }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div variants={cardVariant} className="arcory-glass rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-micro text-muted-foreground">Recente Bonnen & Documenten</span>
        <button onClick={() => navigate("/bonnen")} className="text-[12px] text-primary hover:text-primary/80 transition-colors">
          Alles bekijken
        </button>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
            <Receipt className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <p className="text-[13px] text-muted-foreground/50">Nog geen documenten geüpload</p>
        </div>
      ) : (
        <motion.div variants={staggerContainerFast} initial="initial" animate="animate" className="space-y-0.5">
          {documents.map((doc) => (
            <motion.button
              key={doc.id}
              variants={tableRowVariant}
              onClick={() => navigate(doc.document_type === "receipt" ? "/bonnen" : "/documenten")}
              className="flex items-center gap-3 w-full py-2.5 px-2 rounded-xl hover:bg-white/[0.03] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center">
                {doc.document_type === "receipt" ? (
                  <Receipt className="h-4 w-4 text-cyan-400" />
                ) : (
                  <FileText className="h-4 w-4 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-foreground/80 truncate">
                  {doc.extracted_supplier_name || doc.file_name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {statusIcon(doc)}
                  <span className="text-[10px] text-muted-foreground/40">{statusLabel(doc)}</span>
                  {doc.extracted_date && (
                    <span className="text-[10px] text-muted-foreground/40">
                      · {new Date(doc.extracted_date).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                </div>
              </div>
              {doc.extracted_amount != null && (
                <span className="text-[13px] font-medium tabular-nums text-foreground/70">{fmt(doc.extracted_amount)}</span>
              )}
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
