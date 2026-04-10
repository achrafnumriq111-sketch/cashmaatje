import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useJournalLines } from "@/hooks/useJournalEntries";
import { CheckCircle2, AlertTriangle, FileText, ArrowLeftRight, Cpu } from "lucide-react";

function fmtAmount(n: number | null) {
  if (n == null || n === 0) return "—";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" });
}

function vatLabel(rateType: string | null, pct: number | null) {
  if (!rateType) return "—";
  const labels: Record<string, string> = {
    high: "Hoog (21%)",
    low: "Laag (9%)",
    zero: "Nul (0%)",
    exempt: "Vrijgesteld",
    reverse_charge: "Verlegd",
  };
  return labels[rateType] ?? `${pct ?? 0}%`;
}

interface Props {
  entry: any | null;
  open: boolean;
  onClose: () => void;
}

export function JournalDetail({ entry, open, onClose }: Props) {
  const { data: lines = [], isLoading } = useJournalLines(entry?.id ?? null);

  const totalDebit = lines.reduce((s, l) => s + (l.debit_amount ?? 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit_amount ?? 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {entry && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground text-sm">#{entry.entry_number}</span>
                Journaalpost
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Datum</p>
                  <p className="font-medium">{fmtDate(entry.date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge variant="secondary" className={`text-[10px] ${
                    entry.status === "posted" ? "bg-emerald-500/15 text-emerald-400 border-0" :
                    entry.status === "voided" ? "bg-red-500/15 text-red-400 border-0" :
                    "bg-blue-500/15 text-blue-400 border-0"
                  }`}>
                    {entry.status === "posted" ? "Geboekt" : entry.status === "voided" ? "Ongeldig" : "Concept"}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Omschrijving</p>
                  <p className="font-medium">{entry.description}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Bron</p>
                  <div className="flex items-center gap-1.5">
                    {entry.source_type === "invoice" ? <FileText className="h-3.5 w-3.5 text-muted-foreground" /> :
                     entry.source_type === "bank_transaction" ? <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" /> :
                     <Cpu className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span>{entry.source_type === "invoice" ? "Factuur" : entry.source_type === "bank_transaction" ? "Bank" : "Systeem"}</span>
                  </div>
                </div>
                {entry.ai_generated && (
                  <div>
                    <p className="text-muted-foreground text-xs">AI Confidence</p>
                    <span className={`font-medium ${
                      (entry.ai_confidence ?? 0) >= 0.8 ? "text-emerald-400" :
                      (entry.ai_confidence ?? 0) >= 0.5 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {Math.round((entry.ai_confidence ?? 0) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {entry.ai_reasoning && (
                <div className="rounded-md bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1">AI Redenering</p>
                  <p className="text-sm">{entry.ai_reasoning}</p>
                </div>
              )}

              <Separator />

              {/* Journal Lines */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Boekingsregels</h3>
                  {!isLoading && (
                    <div className="flex items-center gap-1.5">
                      {balanced ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      )}
                      <span className={`text-xs font-medium ${balanced ? "text-emerald-400" : "text-red-400"}`}>
                        {balanced ? "In balans" : "Ongebalanceerd!"}
                      </span>
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-xs">Rekening</TableHead>
                        <TableHead className="text-xs text-right">Debet</TableHead>
                        <TableHead className="text-xs text-right">Credit</TableHead>
                        <TableHead className="text-xs">BTW</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line) => {
                        const acct = line.accounts as { code: string; name: string; name_nl: string } | null;
                        return (
                          <TableRow key={line.id} className="border-border/50">
                            <TableCell className="text-xs">
                              <span className="font-mono text-muted-foreground">{acct?.code}</span>{" "}
                              <span>{acct?.name_nl || acct?.name}</span>
                            </TableCell>
                            <TableCell className="text-sm text-right tabular-nums font-medium">
                              {fmtAmount(line.debit_amount)}
                            </TableCell>
                            <TableCell className="text-sm text-right tabular-nums font-medium">
                              {fmtAmount(line.credit_amount)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {line.vat_box && (
                                <Badge variant="outline" className="text-[10px] mr-1">
                                  {line.vat_box}
                                </Badge>
                              )}
                              {vatLabel(line.vat_rate_type, line.vat_percentage)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Totals row */}
                      <TableRow className="border-t-2 border-border font-semibold">
                        <TableCell className="text-xs">Totaal</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{fmtAmount(totalDebit)}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{fmtAmount(totalCredit)}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
