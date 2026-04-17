import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Save, FileText, ScrollText, Link2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdateTransaction } from "@/hooks/useTransactions";
import { toast } from "sonner";

interface Props {
  transaction: any;
  open: boolean;
  onClose: () => void;
  accounts: Array<{ id: string; code: string; name: string; name_nl: string | null; account_type: string }>;
}

function fmtAmount(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

export function TransactionDetail({ transaction: tx, open, onClose, accounts }: Props) {
  const updateTx = useUpdateTransaction();
  const navigate = useNavigate();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [accountSearch, setAccountSearch] = useState("");

  useEffect(() => {
    if (tx) {
      setSelectedAccountId(tx.account_id || tx.ai_category_suggestion || "");
      setAccountSearch("");
    }
  }, [tx]);

  if (!tx) return null;

  const filteredAccounts = accounts.filter((a) => {
    if (!accountSearch) return true;
    const s = accountSearch.toLowerCase();
    return a.code.includes(s) || a.name.toLowerCase().includes(s) || a.name_nl?.toLowerCase().includes(s);
  });

  const confidence = tx.ai_confidence != null ? Math.round(tx.ai_confidence * 100) : null;
  const confColor = confidence != null ? (confidence >= 80 ? "text-emerald-400" : confidence >= 50 ? "text-amber-400" : "text-red-400") : "";

  const handleSave = async () => {
    try {
      await updateTx.mutateAsync({
        id: tx.id,
        updates: {
          account_id: selectedAccountId || null,
          status: selectedAccountId ? "manually_matched" : tx.status,
        },
      });
      toast.success("Transactie opgeslagen");
      onClose();
    } catch {
      toast.error("Fout bij opslaan");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card border-border/50">
        <SheetHeader>
          <SheetTitle className="text-foreground">Transactie details</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Datum</Label>
              <p className="text-sm">{new Date(tx.transaction_date).toLocaleDateString("nl-NL")}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Bedrag</Label>
              <p className={`text-sm font-semibold ${tx.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {fmtAmount(tx.amount)}
              </p>
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Omschrijving</Label>
              <p className="text-sm">{tx.description || "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tegenpartij</Label>
              <p className="text-sm">{tx.counterparty_name || "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">IBAN</Label>
              <p className="text-sm font-mono text-xs">{tx.counterparty_iban || "—"}</p>
            </div>
            {tx.payment_reference && (
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Betalingskenmerk</Label>
                <p className="text-sm">{tx.payment_reference}</p>
              </div>
            )}
          </div>

          {/* AI suggestion */}
          {tx.ai_reasoning && (
            <>
              <Separator className="bg-border/50" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI Suggestie</span>
                  {confidence != null && (
                    <Badge variant="secondary" className={`text-[10px] border-0 bg-muted ${confColor}`}>
                      {confidence}% confidence
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{tx.ai_reasoning}</p>
              </div>
            </>
          )}

          <Separator className="bg-border/50" />

          {/* Category selector */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Categorie</Label>
            <Input
              placeholder="Zoek op code of naam..."
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              className="bg-background border-border/50 mb-2"
            />
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue placeholder="Selecteer categorie" />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                {filteredAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="font-mono text-xs text-muted-foreground mr-2">{a.code}</span>
                    {a.name_nl || a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Audit trail — gekoppelde stukken */}
          <Separator className="bg-border/50" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Audit trail</span>
            </div>
            <div className="space-y-1.5 text-sm">
              {tx.matched_invoice_id ? (
                <button
                  onClick={() => { onClose(); navigate(tx.amount > 0 ? "/facturen/verkoop" : "/facturen/inkoop"); }}
                  className="w-full flex items-center justify-between rounded-md bg-muted/30 hover:bg-muted/50 transition-colors px-3 py-2 text-left"
                >
                  <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Gekoppelde factuur</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ) : (
                <p className="text-xs text-muted-foreground italic px-3 py-2">Geen factuur gekoppeld</p>
              )}
              {tx.journal_entry_id ? (
                <button
                  onClick={() => { onClose(); navigate("/journaalposten"); }}
                  className="w-full flex items-center justify-between rounded-md bg-muted/30 hover:bg-muted/50 transition-colors px-3 py-2 text-left"
                >
                  <span className="flex items-center gap-2"><ScrollText className="h-3.5 w-3.5" /> Journaalpost</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ) : (
                <p className="text-xs text-muted-foreground italic px-3 py-2">Nog geen journaalpost geboekt</p>
              )}
            </div>
          </div>

          <Button onClick={handleSave} disabled={updateTx.isPending} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Opslaan
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
