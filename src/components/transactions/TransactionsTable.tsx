import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Pencil, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUpdateTransaction, useCategorizeTransactions } from "@/hooks/useTransactions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Enums"]["user_role"] | undefined;

function fmtAmount(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  new: { label: "Nieuw", cls: "bg-foreground/5 text-foreground/80" },
  matched: { label: "Gematcht", cls: "bg-primary/10 text-primary" },
  manually_matched: { label: "Handmatig", cls: "bg-primary/10 text-primary" },
  excluded: { label: "Uitgesloten", cls: "bg-muted text-muted-foreground" },
  reconciled: { label: "Afgeletterd", cls: "bg-primary/10 text-primary" },
  partial_match: { label: "Deelmatch", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

function StatusPill({ s }: { s: string }) {
  const m = STATUS_MAP[s] ?? { label: s, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", m.cls)}>
      {m.label}
    </span>
  );
}

function ConfidenceBadge({ c }: { c: number | null }) {
  if (c == null) return null;
  const pct = Math.round(c * 100);
  const cls = pct >= 80 ? "text-primary" : pct >= 50 ? "text-amber-600 dark:text-amber-400" : "text-destructive";
  return <span className={cn("text-[11px] font-medium tabular-nums", cls)}>{pct}%</span>;
}

interface Props {
  transactions: any[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onRowClick: (id: string) => void;
  role: Role;
}

export function TransactionsTable({ transactions, isLoading, selectedIds, onSelectionChange, onRowClick }: Props) {
  const updateTx = useUpdateTransaction();
  useCategorizeTransactions();
  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length;

  const toggleAll = () => {
    if (allSelected) onSelectionChange(new Set());
    else onSelectionChange(new Set(transactions.map((t) => t.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange(next);
  };

  const acceptSuggestion = async (tx: any) => {
    if (!tx.ai_category_suggestion) return;
    try {
      await updateTx.mutateAsync({
        id: tx.id,
        updates: {
          account_id: tx.ai_category_suggestion,
          contact_id: tx.ai_contact_suggestion,
          status: "matched",
        },
      });
      toast.success("Categorie geaccepteerd");
    } catch {
      toast.error("Fout bij accepteren");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Datum</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Omschrijving</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Tegenpartij</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium text-right">Bedrag</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Categorie</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium text-center">AI</TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-16">
                Geen transacties gevonden
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => {
              const aiAccount = tx.accounts as { code: string; name: string; name_nl: string } | null;
              const isIncoming = tx.amount >= 0;
              return (
                <TableRow
                  key={tx.id}
                  className="border-border/60 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => onRowClick(tx.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(tx.id)} onCheckedChange={() => toggleOne(tx.id)} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(tx.transaction_date).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                  </TableCell>
                  <TableCell className="text-sm max-w-[220px] truncate">{tx.description || "—"}</TableCell>
                  <TableCell className="text-sm max-w-[160px] truncate font-medium">{tx.counterparty_name || "—"}</TableCell>
                  <TableCell className={cn("text-sm text-right font-medium tabular-nums", isIncoming ? "text-primary" : "text-foreground")}>
                    {isIncoming && "+"}{fmtAmount(tx.amount)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {aiAccount ? (
                      <span className="text-muted-foreground">{aiAccount.code} · {aiAccount.name_nl || aiAccount.name}</span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell><StatusPill s={tx.status} /></TableCell>
                  <TableCell className="text-center">
                    {tx.ai_confidence != null && (
                      <div className="flex items-center justify-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary/60" />
                        <ConfidenceBadge c={tx.ai_confidence} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {tx.ai_category_suggestion && tx.status === "new" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-primary/10" onClick={() => acceptSuggestion(tx)}>
                              <Check className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Accepteer suggestie</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => onRowClick(tx.id)}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Wijzig</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
