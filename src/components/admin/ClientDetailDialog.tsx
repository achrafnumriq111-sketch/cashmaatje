import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, Mail, FileText, Receipt, Users, CreditCard, Wallet, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  orgId: string | null;
  orgName?: string;
  open: boolean;
  onClose: () => void;
}

export function ClientDetailDialog({ orgId, orgName, open, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin_client_detail", orgId],
    enabled: !!orgId && open,
    queryFn: async () => {
      if (!orgId) return null;
      const [org, members, invoices, txs, docs, subs] = await Promise.all([
        supabase.from("organizations").select("*").eq("id", orgId).single(),
        supabase.from("organization_members").select("user_id, role, is_owner, joined_at").eq("organization_id", orgId),
        supabase.from("invoices").select("id, invoice_type, total_amount, amount_due, status, invoice_date").eq("organization_id", orgId),
        supabase.from("bank_transactions").select("id, amount, status, transaction_date").eq("organization_id", orgId).limit(2000),
        supabase.from("documents").select("id, status, created_at").eq("organization_id", orgId).limit(2000),
        supabase.from("subscriptions").select("status, price_id, current_period_end, environment").limit(100),
      ]);

      const memberRows = members.data ?? [];
      const userIds = memberRows.map((m: any) => m.user_id);
      let profiles: Record<string, any> = {};
      if (userIds.length) {
        const { data: ps } = await supabase.from("user_profiles").select("id, email, full_name").in("id", userIds);
        (ps ?? []).forEach((p: any) => { profiles[p.id] = p; });
      }

      const ownerId = memberRows.find((m: any) => m.is_owner)?.user_id;
      const ownerSub = ownerId
        ? (subs.data ?? []).find((s: any) => s.user_id === ownerId) ?? null
        : null;

      const inv = invoices.data ?? [];
      const sales = inv.filter((i: any) => i.invoice_type === "sales");
      const purchases = inv.filter((i: any) => i.invoice_type === "purchase");
      const openSales = sales.filter((i: any) => Number(i.amount_due) > 0);
      const openPurch = purchases.filter((i: any) => Number(i.amount_due) > 0);

      const txRows = txs.data ?? [];
      const docRows = docs.data ?? [];

      return {
        org: org.data,
        members: memberRows.map((m: any) => ({ ...m, profile: profiles[m.user_id] })),
        owner: ownerId ? profiles[ownerId] : null,
        subscription: ownerSub,
        stats: {
          invoiceCount: inv.length,
          salesRevenue: sales.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0),
          purchaseSpend: purchases.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0),
          openSales: openSales.length,
          openSalesAmount: openSales.reduce((s: number, i: any) => s + Number(i.amount_due || 0), 0),
          openPurch: openPurch.length,
          openPurchAmount: openPurch.reduce((s: number, i: any) => s + Number(i.amount_due || 0), 0),
          txCount: txRows.length,
          txUnmatched: txRows.filter((t: any) => t.status === "new" || t.status === "unmatched").length,
          docCount: docRows.length,
          docPending: docRows.filter((d: any) => d.status === "pending" || d.status === "processing").length,
        },
      };
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {orgName ?? "Organisatie"}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-5">
            {/* Org info */}
            <section className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <Info label="Naam" value={data.org?.name} />
              <Info label="Juridische naam" value={data.org?.legal_name} />
              <Info label="Type" value={data.org?.org_type} />
              <Info label="KVK" value={data.org?.kvk_number} />
              <Info label="BTW" value={data.org?.btw_number} />
              <Info label="Email" value={data.org?.email} />
              <Info label="Telefoon" value={data.org?.phone} />
              <Info label="Stad" value={data.org?.address_city} />
              <Info label="Aangemaakt" value={data.org?.created_at ? format(new Date(data.org.created_at), "d MMM yyyy", { locale: nl }) : "—"} />
            </section>

            {/* Owner + subscription */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Panel icon={<Users className="h-4 w-4" />} title="Eigenaar">
                <p className="text-sm font-medium text-foreground">{data.owner?.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground break-all">{data.owner?.email || "—"}</p>
              </Panel>
              <Panel icon={<CreditCard className="h-4 w-4" />} title="Abonnement">
                {data.subscription ? (
                  <div className="space-y-1">
                    <Badge variant="outline" className={cn(
                      data.subscription.status === "active" && "border-primary/40 text-primary",
                      data.subscription.status === "past_due" && "border-yellow-500/40 text-yellow-200",
                    )}>{data.subscription.status}</Badge>
                    <p className="text-xs text-muted-foreground">{data.subscription.price_id ?? "—"} · {data.subscription.environment}</p>
                    {data.subscription.current_period_end && (
                      <p className="text-xs text-muted-foreground">
                        Loopt tot {format(new Date(data.subscription.current_period_end), "d MMM yyyy", { locale: nl })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Geen actief abonnement gevonden</p>
                )}
              </Panel>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Stat icon={<Receipt className="h-3.5 w-3.5" />} label="Verkoopomzet" value={`€ ${data.stats.salesRevenue.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`} />
              <Stat icon={<Wallet className="h-3.5 w-3.5" />} label="Inkoop totaal" value={`€ ${data.stats.purchaseSpend.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`} />
              <Stat icon={<FileText className="h-3.5 w-3.5" />} label="Open verkoop" value={`${data.stats.openSales} · € ${data.stats.openSalesAmount.toLocaleString("nl-NL", { minimumFractionDigits: 0 })}`} tone={data.stats.openSales > 3 ? "warn" : undefined} />
              <Stat icon={<FileText className="h-3.5 w-3.5" />} label="Open inkoop" value={`${data.stats.openPurch} · € ${data.stats.openPurchAmount.toLocaleString("nl-NL", { minimumFractionDigits: 0 })}`} />
              <Stat icon={<Activity className="h-3.5 w-3.5" />} label="Banktransacties" value={String(data.stats.txCount)} />
              <Stat icon={<Activity className="h-3.5 w-3.5" />} label="Niet gematched" value={String(data.stats.txUnmatched)} tone={data.stats.txUnmatched > 10 ? "warn" : undefined} />
              <Stat icon={<FileText className="h-3.5 w-3.5" />} label="Documenten" value={String(data.stats.docCount)} />
              <Stat icon={<FileText className="h-3.5 w-3.5" />} label="In verwerking" value={String(data.stats.docPending)} />
            </section>

            {/* Members */}
            <section>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" /> Leden ({data.members.length})
              </h4>
              <div className="border border-border rounded-lg divide-y divide-border">
                {data.members.map((m: any) => (
                  <div key={m.user_id} className="px-3 py-2 flex items-center gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{m.profile?.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><Mail className="h-3 w-3" />{m.profile?.email || "—"}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{m.role}</Badge>
                    {m.is_owner && <Badge className="text-[10px]">Eigenaar</Badge>}
                  </div>
                ))}
                {data.members.length === 0 && (
                  <p className="px-3 py-4 text-xs text-muted-foreground text-center">Geen leden</p>
                )}
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground break-words">{value || "—"}</p>
    </div>
  );
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-3">
      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">{icon}{title}</p>
      {children}
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "warn" }) {
  return (
    <div className="border border-border rounded-lg p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">{icon}{label}</p>
      <p className={cn("text-sm font-semibold mt-0.5", tone === "warn" ? "text-yellow-300" : "text-foreground")}>{value}</p>
    </div>
  );
}
