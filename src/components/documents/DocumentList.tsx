import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { FileText, AlertTriangle, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export function DocumentList({ documents, onSelect }: Props) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-10 w-10 mb-2" />
        <p className="text-sm">Nog geen documenten geüpload.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bestandsnaam</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Leverancier</TableHead>
            <TableHead className="text-right">Bedrag</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow
              key={doc.id}
              className="cursor-pointer"
              onClick={() => onSelect(doc.id)}
            >
              <TableCell className="font-medium max-w-[200px] truncate">
                {doc.file_name}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {doc.created_at
                  ? format(new Date(doc.created_at), "d MMM yyyy", { locale: nl })
                  : "—"}
              </TableCell>
              <TableCell className="text-sm">
                {doc.extracted_supplier_name ?? "—"}
              </TableCell>
              <TableCell className="text-right text-sm">
                {doc.extracted_amount != null
                  ? `€ ${Number(doc.extracted_amount).toLocaleString("nl-NL", {
                      minimumFractionDigits: 2,
                    })}`
                  : "—"}
              </TableCell>
              <TableCell>{statusBadge(doc.ocr_status)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {doc.is_duplicate && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  {doc.invoice_id && (
                    <Link2 className="h-4 w-4 text-primary" />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
