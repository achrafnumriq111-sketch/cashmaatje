import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FileText, ArrowLeftRight, TrendingDown, Calendar, Receipt, CreditCard } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Document = Database["public"]["Tables"]["documents"]["Row"];

interface SupplierGroup {
  name: string;
  documents: Document[];
  totalAmount: number;
  lastDate: string | null;
  contactId: string | null;
}

interface Props {
  supplier: SupplierGroup | null;
  open: boolean;
  onClose: () => void;
  onSelectDoc: (id: string) => void;
  orgId: string | undefined;
}

function fmtAmount(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

export function SupplierReceiptsSheet({ supplier, open, onClose, onSelectDoc, orgId }: Props) {
  // Fetch related transactions for this supplier
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["supplier-transactions", orgId, supplier?.name],
    enabled: !!orgId && !!supplier?.name,
    queryFn: async () => {
      const { data } = await supabase
        .from("bank_transactions")
        .select("id, transaction_date, description, counterparty_name, amount, status")
        .eq("organization_id", orgId!)
        .ilike("counterparty_name", `%${supplier!.name}%`)
        .order("transaction_date", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  // Fetch related invoices
  const { data: invoices, isLoading: invLoading } = useQuery({
    queryKey: ["supplier-invoices", orgId, supplier?.name],
    enabled: !!orgId && !!supplier?.name,
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("id, invoice_number, invoice_date, total_amount, total_vat, status, contact_name")
        .eq("organization_id", orgId!)
        .eq("invoice_type", "purchase")
        .ilike("contact_name", `%${supplier!.name}%`)
        .order("invoice_date", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  // Fetch contact info if linked
  const { data: contact } = useQuery({
    queryKey: ["supplier-contact", supplier?.contactId],
    enabled: !!supplier?.contactId,
    queryFn: async () => {
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", supplier!.contactId!)
        .single();
      return data;
    },
  });

  const totalTx = transactions?.reduce((s, t) => s + Math.abs(t.amount), 0) ?? 0;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {supplier && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {supplier.name}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/20 p-3 text-center">
                  <Receipt className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold">{supplier.documents.length}</p>
                  <p className="text-[10px] text-muted-foreground">Bonnen</p>
                </div>
                <div className="rounded-lg bg-muted/20 p-3 text-center">
                  <TrendingDown className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold tabular-nums">{fmtAmount(supplier.totalAmount)}</p>
                  <p className="text-[10px] text-muted-foreground">Totaal bonnen</p>
                </div>
                <div className="rounded-lg bg-muted/20 p-3 text-center">
                  <ArrowLeftRight className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold">{transactions?.length ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground">Transacties</p>
                </div>
              </div>

              {/* Contact info if linked */}
              {contact && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">Gekoppeld als crediteur</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{contact.legal_name || contact.name}</p>
                  {contact.btw_number && (
                    <p className="text-xs text-muted-foreground font-mono">BTW: {contact.btw_number}</p>
                  )}
                  {contact.iban && (
                    <p className="text-xs text-muted-foreground font-mono">IBAN: {contact.iban}</p>
                  )}
                </div>
              )}

              <Separator />

              {/* Receipts list */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  Bonnen ({supplier.documents.length})
                </h3>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {supplier.documents
                    .sort((a, b) => (b.extracted_date ?? b.created_at ?? "").localeCompare(a.extracted_date ?? a.created_at ?? ""))
                    .map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-md px-3 py-2 bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() => {
                          onClose();
                          onSelectDoc(doc.id);
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{doc.file_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {doc.extracted_date
                                ? format(new Date(doc.extracted_date), "d MMM yyyy", { locale: nl })
                                : doc.created_at
                                  ? format(new Date(doc.created_at), "d MMM yyyy", { locale: nl })
                                  : "—"}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs font-semibold tabular-nums text-foreground shrink-0 ml-2">
                          {doc.extracted_amount != null ? fmtAmount(Number(doc.extracted_amount)) : "—"}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              <Separator />

              {/* Transactions */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                  Banktransacties ({transactions?.length ?? 0})
                </h3>
                {txLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between rounded-md px-3 py-2 bg-muted/10">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{tx.description || tx.counterparty_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(tx.transaction_date), "d MMM yyyy", { locale: nl })}
                          </p>
                        </div>
                        <p className={`text-xs font-semibold tabular-nums shrink-0 ml-2 ${tx.amount < 0 ? "text-red-400" : "text-emerald-400"}`}>
                          {fmtAmount(tx.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Geen transacties gevonden</p>
                )}
              </div>

              {/* Invoices */}
              {invoices && invoices.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Inkoopfacturen ({invoices.length})
                    </h3>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {invoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between rounded-md px-3 py-2 bg-muted/10">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{inv.invoice_number}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(inv.invoice_date), "d MMM yyyy", { locale: nl })}
                            </p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-xs font-semibold tabular-nums text-foreground">{fmtAmount(inv.total_amount)}</p>
                            <p className="text-[10px] text-muted-foreground">BTW {fmtAmount(inv.total_vat)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
