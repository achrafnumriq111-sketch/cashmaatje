import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export interface AgingInvoice {
  id: string;
  invoice_number: string;
  contact_id: string | null;
  contact_name: string | null;
  invoice_date: string;
  due_date: string | null;
  total_amount: number;
  amount_paid: number;
  amount_open: number;
  days_overdue: number;
  bucket: "not_due" | "0_30" | "31_60" | "61_90" | "90_plus";
  status: string;
}

export interface AgingContactGroup {
  contact_id: string | null;
  contact_name: string;
  invoices: AgingInvoice[];
  totals: {
    not_due: number;
    b0_30: number;
    b31_60: number;
    b61_90: number;
    b90_plus: number;
    total: number;
  };
}

export const BUCKET_LABELS: Record<string, string> = {
  not_due: "Niet vervallen",
  "0_30": "0-30 dagen",
  "31_60": "31-60 dagen",
  "61_90": "61-90 dagen",
  "90_plus": "90+ dagen",
};

function bucketFor(daysOverdue: number): AgingInvoice["bucket"] {
  if (daysOverdue <= 0) return "not_due";
  if (daysOverdue <= 30) return "0_30";
  if (daysOverdue <= 60) return "31_60";
  if (daysOverdue <= 90) return "61_90";
  return "90_plus";
}

export function useInvoiceAging(type: "sales" | "purchase" = "sales") {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["invoice-aging", type, orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, contact_id, contact_name, invoice_date, due_date, total_amount, amount_paid, status, archived")
        .eq("organization_id", orgId!)
        .eq("invoice_type", type)
        .eq("archived", false)
        .in("status", ["sent", "partial", "overdue"])
        .order("due_date", { ascending: true });

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const items: AgingInvoice[] = (data ?? [])
        .map((inv: any) => {
          const open = Number(inv.total_amount) - Number(inv.amount_paid || 0);
          if (open <= 0.01) return null;
          const due = inv.due_date ? new Date(inv.due_date) : null;
          const days = due ? Math.floor((today.getTime() - due.getTime()) / 86400000) : 0;
          return {
            ...inv,
            amount_open: open,
            days_overdue: days,
            bucket: bucketFor(days),
          } as AgingInvoice;
        })
        .filter(Boolean) as AgingInvoice[];

      const byContact = new Map<string, AgingContactGroup>();
      for (const inv of items) {
        const key = inv.contact_id ?? `name:${inv.contact_name ?? "onbekend"}`;
        if (!byContact.has(key)) {
          byContact.set(key, {
            contact_id: inv.contact_id,
            contact_name: inv.contact_name ?? "Onbekend",
            invoices: [],
            totals: { not_due: 0, b0_30: 0, b31_60: 0, b61_90: 0, b90_plus: 0, total: 0 },
          });
        }
        const g = byContact.get(key)!;
        g.invoices.push(inv);
        g.totals.total += inv.amount_open;
        if (inv.bucket === "not_due") g.totals.not_due += inv.amount_open;
        else if (inv.bucket === "0_30") g.totals.b0_30 += inv.amount_open;
        else if (inv.bucket === "31_60") g.totals.b31_60 += inv.amount_open;
        else if (inv.bucket === "61_90") g.totals.b61_90 += inv.amount_open;
        else g.totals.b90_plus += inv.amount_open;
      }

      const groups = Array.from(byContact.values()).sort((a, b) => b.totals.total - a.totals.total);

      const grandTotals = groups.reduce(
        (acc, g) => ({
          not_due: acc.not_due + g.totals.not_due,
          b0_30: acc.b0_30 + g.totals.b0_30,
          b31_60: acc.b31_60 + g.totals.b31_60,
          b61_90: acc.b61_90 + g.totals.b61_90,
          b90_plus: acc.b90_plus + g.totals.b90_plus,
          total: acc.total + g.totals.total,
        }),
        { not_due: 0, b0_30: 0, b31_60: 0, b61_90: 0, b90_plus: 0, total: 0 },
      );

      return { groups, grandTotals };
    },
  });
}
