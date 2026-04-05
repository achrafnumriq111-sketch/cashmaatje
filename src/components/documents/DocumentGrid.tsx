import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { FileText, Image, AlertTriangle, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";

type Document = Database["public"]["Tables"]["documents"]["Row"];

interface Props {
  documents: Document[];
  onSelect: (id: string) => void;
}

function statusBadge(status: string | null) {
  switch (status) {
    case "processing":
      return <Badge variant="secondary">Verwerken</Badge>;
    case "completed":
      return <Badge className="bg-primary/10 text-primary border-primary/20">Voltooid</Badge>;
    case "error":
      return <Badge variant="destructive">Fout</Badge>;
    default:
      return <Badge variant="outline">Wacht</Badge>;
  }
}

export function DocumentGrid({ documents, onSelect }: Props) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-10 w-10 mb-2" />
        <p className="text-sm">Nog geen documenten geüpload.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => (
        <Card
          key={doc.id}
          className="cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => onSelect(doc.id)}
        >
          <CardContent className="p-4 space-y-3">
            {/* Thumbnail area */}
            <div className="flex items-center justify-center h-24 rounded bg-muted">
              {doc.file_type?.startsWith("image/") ? (
                <Image className="h-8 w-8 text-muted-foreground" />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="space-y-1">
              <p className="text-sm font-medium truncate text-foreground">
                {doc.file_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {doc.created_at
                  ? format(new Date(doc.created_at), "d MMM yyyy", { locale: nl })
                  : "—"}
              </p>
            </div>

            {/* Status & indicators */}
            <div className="flex items-center gap-2 flex-wrap">
              {statusBadge(doc.ocr_status)}
              {doc.is_duplicate && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Duplicaat
                </Badge>
              )}
              {doc.invoice_id && (
                <Badge variant="outline" className="text-xs">
                  <Link2 className="h-3 w-3 mr-1" />
                  Gekoppeld
                </Badge>
              )}
            </div>

            {/* Extracted info */}
            {doc.ocr_status === "completed" && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                {doc.extracted_supplier_name && (
                  <p className="truncate">{doc.extracted_supplier_name}</p>
                )}
                {doc.extracted_amount != null && (
                  <p className="font-medium text-foreground">
                    €{" "}
                    {Number(doc.extracted_amount).toLocaleString("nl-NL", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                )}
                {doc.extracted_date && (
                  <p>
                    {format(new Date(doc.extracted_date), "d MMM yyyy", {
                      locale: nl,
                    })}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
