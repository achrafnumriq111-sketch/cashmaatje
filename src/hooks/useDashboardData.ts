import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export function useDashboardData() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  const healthSnapshot = useQuery({
    queryKey: ["health-snapshot", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("financial_health_snapshots")
        .select("*")
        .eq("organization_id", orgId!)
        .order("snapshot_date", { ascending: false })
        .limit(2);
      return data ?? [];
    },
  });

  const recentTransactions = useQuery({
    queryKey: ["recent-transactions", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("bank_transactions")
        .select("id, transaction_date, counterparty_name, amount, status, ai_category_suggestion, ai_confidence, description")
        .eq("organization_id", orgId!)
        .order("transaction_date", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const anomaliesCount = useQuery({
    queryKey: ["anomalies-count", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { count } = await supabase
        .from("anomalies")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId!)
        .eq("status", "open");
      return count ?? 0;
    },
  });

  const unreconciledCount = useQuery({
    queryKey: ["unreconciled-count", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { count } = await supabase
        .from("bank_transactions")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId!)
        .in("status", ["new", "suggested"]);
      return count ?? 0;
    },
  });

  const missingDocsCount = useQuery({
    queryKey: ["missing-docs-count", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { count } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId!)
        .is("document_id", null)
        .neq("status", "draft");
      return count ?? 0;
    },
  });

  const vatDeadline = useQuery({
    queryKey: ["vat-deadline", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("vat_returns")
        .select("deadline_date, period_type, period_number, year")
        .eq("organization_id", orgId!)
        .eq("status", "draft")
        .order("deadline_date", { ascending: true })
        .limit(1);
      if (data && data.length > 0) {
        const deadline = new Date(data[0].deadline_date);
        const now = new Date();
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...data[0], daysRemaining: diffDays };
      }
      return null;
    },
  });

  const monthlyRevenue = useQuery({
    queryKey: ["monthly-revenue", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      // Get last 12 months of journal data aggregated by month
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const { data } = await supabase
        .from("journal_lines")
        .select("credit_amount, debit_amount, journal_entries!inner(date, organization_id, status)")
        .gte("journal_entries.date", twelveMonthsAgo.toISOString().split("T")[0])
        .eq("journal_entries.organization_id", orgId!)
        .eq("journal_entries.status", "posted");
      return data ?? [];
    },
  });

  return {
    healthSnapshot,
    recentTransactions,
    anomaliesCount,
    unreconciledCount,
    missingDocsCount,
    vatDeadline,
    monthlyRevenue,
    role: membership?.role,
  };
}
