import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowLeftRight, Cpu, AlertTriangle, CheckCircle2, Pencil, BookText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function fmtAmount(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
}

function statusBadge(status: string, aiGenerated: boolean | null, aiConfidence: number | null) {
  if (status === "voided") {
    return <Badge variant="secondary" className="bg-red-500/15 text-red-400 border-0 text-[10px]">Ongeldig</Badge>;
  }

  // Determine review state
  const needsReview = aiGenerated && aiConfidence != null && aiConfidence < 0.75;
  const adjusted = !aiGenerated && status === "posted";

  if (needsReview) {
    return (
      <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border-0 text-[10px] gap-1">
        <AlertTriangle className="h-3 w-3" />
        Review
      </Badge>
    );
  }
  if (status === "posted") {
    return (
      <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px] gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {adjusted ? "Aangepast" : "Geboekt"}
      </Badge>
    );
  }
  return <Badge variant="secondary" className="bg-blue-500/15 text-blue-400 border-0 text-[10px]">Concept</Badge>;
}

function sourceIcon(type: string | null) {
  switch (type) {
    case "invoice":
    case "sales_invoice":
    case "purchase_invoice": return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
    case "bank_transaction": return <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />;
    case "memorial": return <BookText className="h-3.5 w-3.5 text-violet-400" />;
    default: return <Cpu className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function sourceLabel(type: string | null) {
  switch (type) {
    case "invoice":
    case "sales_invoice":
    case "purchase_invoice": return "Factuur";
    case "bank_transaction": return "Bank";
    case "memorial": return "Memoriaalboeking";
    default: return "Systeem";
  }
}

interface Props {
  entries: any[];
  isLoading: boolean;
  onRowClick: (id: string) => void;
}

export function JournalTable({ entries, isLoading, onRowClick }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-xs w-12">#</TableHead>
            <TableHead className="text-xs">Datum</TableHead>
            <TableHead className="text-xs">Omschrijving</TableHead>
            <TableHead className="text-xs">Bron</TableHead>
            <TableHead className="text-xs text-right">Debet</TableHead>
            <TableHead className="text-xs text-right">Credit</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs text-center">AI</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                Geen journaalposten gevonden
              </TableCell>
            </TableRow>
          ) : (
            entries.map((e) => (
              <TableRow
                key={e.id}
                className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onRowClick(e.id)}
              >
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {e.entry_number}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {fmtDate(e.date)}
                </TableCell>
                <TableCell className="text-sm max-w-[280px] truncate">
                  {e.description || "—"}
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1.5">
                        {sourceIcon(e.source_type)}
                        <span className="text-xs text-muted-foreground">{sourceLabel(e.source_type)}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{sourceLabel(e.source_type)}</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-sm text-right font-medium tabular-nums">
                  {/* Placeholder — actual amounts come from lines aggregation */}
                  —
                </TableCell>
                <TableCell className="text-sm text-right font-medium tabular-nums">
                  —
                </TableCell>
                <TableCell>
                  {statusBadge(e.status, e.ai_generated, e.ai_confidence)}
                </TableCell>
                <TableCell className="text-center">
                  {e.ai_confidence != null && (
                    <span className={`text-xs font-medium ${
                      e.ai_confidence >= 0.8 ? "text-emerald-400" :
                      e.ai_confidence >= 0.5 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {Math.round(e.ai_confidence * 100)}%
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
