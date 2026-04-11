import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { FileText, Receipt, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

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
  return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
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
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Recente Bonnen & Documenten</CardTitle>
          <button
            onClick={() => navigate("/bonnen")}
            className="text-xs text-primary hover:underline"
          >
            Alles bekijken
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Receipt className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Nog geen documenten geüpload</p>
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => navigate(doc.document_type === "receipt" ? "/bonnen" : "/documenten")}
                className="flex items-center gap-3 w-full py-2.5 px-2 rounded-md hover:bg-muted/50 transition-colors text-left"
              >
                <div className="p-1.5 rounded-lg bg-muted">
                  {doc.document_type === "receipt" ? (
                    <Receipt className="h-4 w-4 text-cyan-400" />
                  ) : (
                    <FileText className="h-4 w-4 text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {doc.extracted_supplier_name || doc.file_name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {statusIcon(doc)}
                    <span className="text-[10px] text-muted-foreground">{statusLabel(doc)}</span>
                    {doc.extracted_date && (
                      <span className="text-[10px] text-muted-foreground">
                        · {new Date(doc.extracted_date).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
                {doc.extracted_amount != null && (
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {fmt(doc.extracted_amount)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
