import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Sparkles, X, Ban } from "lucide-react";
import { useState } from "react";
import { useBulkUpdateTransactions, useCategorizeTransactions } from "@/hooks/useTransactions";
import { toast } from "sonner";

interface Props {
  selectedIds: string[];
  accounts: Array<{ id: string; code: string; name: string; name_nl: string | null }>;
  onClear: () => void;
}

export function BulkActions({ selectedIds, accounts, onClear }: Props) {
  const [categoryId, setCategoryId] = useState("");
  const bulkUpdate = useBulkUpdateTransactions();
  const categorize = useCategorizeTransactions();

  const handleCategorize = async () => {
    if (!categoryId) return;
    try {
      await bulkUpdate.mutateAsync({
        ids: selectedIds,
        updates: { account_id: categoryId, status: "manually_matched" },
      });
      toast.success(`${selectedIds.length} transacties gecategoriseerd`);
      onClear();
    } catch {
      toast.error("Fout bij bulk categoriseren");
    }
  };

  const handleAcceptAI = async () => {
    try {
      await categorize.mutateAsync(selectedIds);
      toast.success("AI categorisatie gestart");
      onClear();
    } catch {
      toast.error("Fout bij AI categorisatie");
    }
  };

  const handleExclude = async () => {
    try {
      await bulkUpdate.mutateAsync({
        ids: selectedIds,
        updates: { status: "excluded" },
      });
      toast.success(`${selectedIds.length} transacties uitgesloten`);
      onClear();
    } catch {
      toast.error("Fout bij uitsluiten");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
      <span className="text-sm font-medium text-primary">{selectedIds.length} geselecteerd</span>

      <div className="flex items-center gap-2 ml-auto">
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-[200px] h-8 text-xs bg-card border-border/50">
            <SelectValue placeholder="Categorie kiezen" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <span className="font-mono text-xs mr-1">{a.code}</span> {a.name_nl || a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={handleCategorize} disabled={!categoryId || bulkUpdate.isPending}>
          <Check className="h-3.5 w-3.5 mr-1" /> Toepassen
        </Button>

        <Button size="sm" variant="outline" onClick={handleAcceptAI} disabled={categorize.isPending}>
          <Sparkles className="h-3.5 w-3.5 mr-1" /> AI categoriseer
        </Button>

        <Button size="sm" variant="outline" onClick={handleExclude} disabled={bulkUpdate.isPending}>
          <Ban className="h-3.5 w-3.5 mr-1" /> Uitsluiten
        </Button>

        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
