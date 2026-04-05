import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Pencil, Link, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUpdateTransaction, useCategorizeTransactions } from "@/hooks/useTransactions";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Enums"]["user_role"] | undefined;

function fmtAmount(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

function statusLabel(s: string) {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: "Nieuw", cls: "bg-blue-500/15 text-blue-400 border-0" },
    matched: { label: "Gematcht", cls: "bg-emerald-500/15 text-emerald-400 border-0" },
    manually_matched: { label: "Handmatig", cls: "bg-violet-500/15 text-violet-400 border-0" },
    excluded: { label: "Uitgesloten", cls: "bg-zinc-500/15 text-zinc-400 border-0" },
    reconciled: { label: "Afgeletterd", cls: "bg-emerald-500/15 text-emerald-400 border-0" },
    partial_match: { label: "Deelmatch", cls: "bg-amber-500/15 text-amber-400 border-0" },
  };
  const m = map[s] ?? { label: s, cls: "" };
  return <Badge variant="secondary" className={`text-[10px] ${m.cls}`}>{m.label}</Badge>;
}

function confidenceBadge(c: number | null) {
  if (c == null) return null;
  const pct = Math.round(c * 100);
  const cls = pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400";
  return <span className={`text-xs font-medium ${cls}`}>{pct}%</span>;
}

interface Props {
  transactions: any[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onRowClick: (id: string) => void;
  role: Role;
}

export function TransactionsTable({ transactions, isLoading, selectedIds, onSelectionChange, onRowClick, role }: Props) {
  const updateTx = useUpdateTransaction();
  const categorizeTx = useCategorizeTransactions();
  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(transactions.map((t) => t.id)));
    }
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
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead className="text-xs">Datum</TableHead>
            <TableHead className="text-xs">Omschrijving</TableHead>
            <TableHead className="text-xs">Tegenpartij</TableHead>
            <TableHead className="text-xs text-right">Bedrag</TableHead>
            <TableHead className="text-xs">Categorie</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs text-center">AI</TableHead>
            <TableHead className="text-xs text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                Geen transacties gevonden
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => {
              const aiAccount = tx.accounts as { code: string; name: string; name_nl: string } | null;
              return (
                <TableRow
                  key={tx.id}
                  className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onRowClick(tx.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(tx.id)}
                      onCheckedChange={() => toggleOne(tx.id)}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(tx.transaction_date).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{tx.description || "—"}</TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">{tx.counterparty_name || "—"}</TableCell>
                  <TableCell className={`text-sm text-right font-medium tabular-nums ${tx.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmtAmount(tx.amount)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {aiAccount ? (
                      <span className="text-muted-foreground">{aiAccount.code} {aiAccount.name_nl || aiAccount.name}</span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell>{statusLabel(tx.status)}</TableCell>
                  <TableCell className="text-center">
                    {tx.ai_confidence != null && (
                      <div className="flex items-center justify-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary/70" />
                        {confidenceBadge(tx.ai_confidence)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {tx.ai_category_suggestion && tx.status === "new" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => acceptSuggestion(tx)}
                            >
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Accepteer AI suggestie</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onRowClick(tx.id)}>
                            <Pencil className="h-3.5 w-3.5" />
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
