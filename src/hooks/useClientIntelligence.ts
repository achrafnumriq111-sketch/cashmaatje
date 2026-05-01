import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export interface ClientInsight {
  contact_id: string;
  name: string;
  is_customer: boolean;
  is_supplier: boolean;
  total_revenue: number;        // sales invoices total (for customers)
  total_spend: number;          // purchase invoices total (for suppliers)
  invoice_count: number;
  paid_count: number;
  open_amount: number;          // unpaid amount (sales)
  overdue_amount: number;
  avg_days_to_pay: number | null;
  last_activity: string | null;
  risk_score: "low" | "medium" | "high";
  revenue_share: number;        // 0..1
}

export function useClientIntelligence() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery<ClientInsight[]>({
    queryKey: ["client-intelligence", orgId],
    enabled: !!orgId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: contacts, error: cErr } = await supabase
        .from("contacts")
        .select("id, name, is_customer, is_supplier")
        .eq("organization_id", orgId!)
        .eq("is_active", true);
      if (cErr) throw cErr;
      if (!contacts?.length) return [];

      const { data: invoices, error: iErr } = await supabase
        .from("invoices")
        .select("contact_id, invoice_type, status, total_amount, amount_paid, invoice_date, due_date, paid_date")
        .eq("organization_id", orgId!);
      if (iErr) throw iErr;

      const byContact = new Map<string, typeof invoices>();
      (invoices ?? []).forEach((i) => {
        if (!i.contact_id) return;
        const arr = byContact.get(i.contact_id) ?? [];
        arr.push(i);
        byContact.set(i.contact_id, arr);
      });

      const today = new Date();
      const totalSalesRevenue = (invoices ?? [])
        .filter((i) => i.invoice_type === "sales")
        .reduce((s, i) => s + Number(i.total_amount || 0), 0) || 1;

      const insights: ClientInsight[] = contacts.map((c) => {
        const list = byContact.get(c.id) ?? [];
        const sales = list.filter((i) => i.invoice_type === "sales");
        const purchases = list.filter((i) => i.invoice_type === "purchase");

        const total_revenue = sales.reduce((s, i) => s + Number(i.total_amount || 0), 0);
        const total_spend = purchases.reduce((s, i) => s + Number(i.total_amount || 0), 0);

        const open_amount = sales.reduce((s, i) => {
          const due = Number(i.total_amount || 0) - Number(i.amount_paid || 0);
          return s + (i.status !== "paid" && due > 0 ? due : 0);
        }, 0);
        const overdue_amount = sales.reduce((s, i) => {
          const due = Number(i.total_amount || 0) - Number(i.amount_paid || 0);
          if (i.status === "paid" || due <= 0) return s;
          if (i.due_date && new Date(i.due_date) < today) return s + due;
          return s;
        }, 0);

        const paidWithDates = sales.filter((i) => i.paid_date && i.invoice_date && i.status === "paid");
        const avg_days_to_pay = paidWithDates.length
          ? Math.round(
              paidWithDates.reduce((s, i) => {
                const days = (new Date(i.paid_date!).getTime() - new Date(i.invoice_date).getTime()) / 86400000;
                return s + days;
              }, 0) / paidWithDates.length
            )
          : null;

        const last_activity = list
          .map((i) => i.invoice_date)
          .sort()
          .pop() ?? null;

        let risk: "low" | "medium" | "high" = "low";
        if (overdue_amount > 0 && avg_days_to_pay && avg_days_to_pay > 60) risk = "high";
        else if (overdue_amount > 0 || (avg_days_to_pay ?? 0) > 30) risk = "medium";

        return {
          contact_id: c.id,
          name: c.name,
          is_customer: !!c.is_customer,
          is_supplier: !!c.is_supplier,
          total_revenue,
          total_spend,
          invoice_count: list.length,
          paid_count: sales.filter((i) => i.status === "paid").length,
          open_amount,
          overdue_amount,
          avg_days_to_pay,
          last_activity,
          risk_score: risk,
          revenue_share: total_revenue / totalSalesRevenue,
        };
      });

      return insights
        .filter((i) => i.invoice_count > 0)
        .sort((a, b) => b.total_revenue + b.total_spend - (a.total_revenue + a.total_spend));
    },
  });
}
