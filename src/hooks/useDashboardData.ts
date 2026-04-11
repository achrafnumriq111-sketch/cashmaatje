import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

interface PeriodRange {
  from: Date;
  to: Date;
}

export function useDashboardData(period?: PeriodRange) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  const fromStr = period ? period.from.toISOString().split("T")[0] : undefined;
  const toStr = period ? period.to.toISOString().split("T")[0] : undefined;
  const periodKey = fromStr && toStr ? `${fromStr}_${toStr}` : "all";

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
    queryKey: ["recent-transactions", orgId, periodKey],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from("bank_transactions")
        .select("id, transaction_date, counterparty_name, amount, status, ai_category_suggestion, ai_confidence, description")
        .eq("organization_id", orgId!)
        .order("transaction_date", { ascending: false })
        .limit(10);
      if (fromStr) q = q.gte("transaction_date", fromStr);
      if (toStr) q = q.lte("transaction_date", toStr);
      const { data } = await q;
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
    queryKey: ["unreconciled-count", orgId, periodKey],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from("bank_transactions")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId!)
        .eq("status", "new");
      if (fromStr) q = q.gte("transaction_date", fromStr);
      if (toStr) q = q.lte("transaction_date", toStr);
      const { count } = await q;
      return count ?? 0;
    },
  });

  const missingDocsCount = useQuery({
    queryKey: ["missing-docs-count", orgId, periodKey],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId!)
        .is("document_id", null)
        .neq("status", "draft");
      if (fromStr) q = q.gte("invoice_date", fromStr);
      if (toStr) q = q.lte("invoice_date", toStr);
      const { count } = await q;
      return count ?? 0;
    },
  });

  const pendingDocsCount = useQuery({
    queryKey: ["pending-docs-count", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { count } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId!)
        .or("processing_status.eq.inbox,processing_status.eq.processing,ocr_status.eq.pending,ocr_status.eq.processing");
      return count ?? 0;
    },
  });

  const recentDocuments = useQuery({
    queryKey: ["recent-documents", orgId, periodKey],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from("documents")
        .select("id, file_name, document_type, extracted_supplier_name, extracted_amount, extracted_date, ocr_status, processing_status, created_at")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(5);
      if (fromStr) q = q.gte("created_at", `${fromStr}T00:00:00`);
      if (toStr) q = q.lte("created_at", `${toStr}T23:59:59`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const vatDeadline = useQuery({
    queryKey: ["vat-deadline", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("vat_returns")
        .select("period_end, period_type, period_number, year")
        .eq("organization_id", orgId!)
        .eq("status", "draft")
        .order("period_end", { ascending: true })
        .limit(1);
      if (data && data.length > 0) {
        const row = data[0];
        const deadline = new Date(row.period_end);
        const now = new Date();
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { period_end: row.period_end, period_number: row.period_number, year: row.year, daysRemaining: diffDays };
      }
      return null;
    },
  });

  const monthlyRevenue = useQuery({
    queryKey: ["monthly-revenue", orgId, periodKey],
    enabled: !!orgId,
    queryFn: async () => {
      const lookback = period?.from ?? (() => { const d = new Date(); d.setMonth(d.getMonth() - 12); return d; })();
      const { data } = await supabase
        .from("journal_lines")
        .select("credit_amount, debit_amount, journal_entries!inner(date, organization_id, status)")
        .gte("journal_entries.date", lookback.toISOString().split("T")[0])
        .eq("journal_entries.organization_id", orgId!)
        .eq("journal_entries.status", "posted");
      return data ?? [];
    },
  });

  const bankBalances = useQuery({
    queryKey: ["bank-balances", orgId],
    enabled: !!orgId,
    refetchInterval: 60000,
    queryFn: async () => {
      const { data } = await supabase
        .from("bank_accounts")
        .select("id, name, iban, current_balance, bank_name, is_primary, last_sync_at")
        .eq("organization_id", orgId!)
        .eq("is_active", true)
        .order("is_primary", { ascending: false });
      return data ?? [];
    },
  });

  const openInvoices = useQuery({
    queryKey: ["open-invoices", orgId, periodKey],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from("invoices")
        .select("id, invoice_type, total_amount, amount_paid, due_date, contact_name, status")
        .eq("organization_id", orgId!)
        .in("status", ["sent", "partial", "overdue"]);
      if (fromStr) q = q.gte("invoice_date", fromStr);
      if (toStr) q = q.lte("invoice_date", toStr);
      const { data } = await q;
      const invoices = data ?? [];
      const receivable = invoices
        .filter(i => i.invoice_type === "sales")
        .reduce((sum, i) => sum + (i.total_amount - (i.amount_paid ?? 0)), 0);
      const payable = invoices
        .filter(i => i.invoice_type === "purchase")
        .reduce((sum, i) => sum + (i.total_amount - (i.amount_paid ?? 0)), 0);
      const overdueReceivable = invoices
        .filter(i => i.invoice_type === "sales" && i.due_date && new Date(i.due_date) < new Date())
        .reduce((sum, i) => sum + (i.total_amount - (i.amount_paid ?? 0)), 0);
      const overduePayable = invoices
        .filter(i => i.invoice_type === "purchase" && i.due_date && new Date(i.due_date) < new Date())
        .reduce((sum, i) => sum + (i.total_amount - (i.amount_paid ?? 0)), 0);
      return { receivable, payable, overdueReceivable, overduePayable, invoices };
    },
  });

  const burnRate = useQuery({
    queryKey: ["burn-rate", orgId, periodKey],
    enabled: !!orgId,
    queryFn: async () => {
      const lookbackFrom = fromStr ?? (() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split("T")[0]; })();
      const lookbackTo = toStr ?? new Date().toISOString().split("T")[0];

      // Calculate months in range for averages
      const rangeStart = new Date(lookbackFrom);
      const rangeEnd = new Date(lookbackTo);
      const monthsInRange = Math.max(1, (rangeEnd.getFullYear() - rangeStart.getFullYear()) * 12 + rangeEnd.getMonth() - rangeStart.getMonth() + 1);

      const { data } = await supabase
        .from("journal_lines")
        .select("debit_amount, credit_amount, account_id, accounts!inner(account_type), journal_entries!inner(date, organization_id, status)")
        .gte("journal_entries.date", lookbackFrom)
        .lte("journal_entries.date", lookbackTo)
        .eq("journal_entries.organization_id", orgId!)
        .eq("journal_entries.status", "posted")
        .eq("accounts.account_type", "expense");
      
      const totalExpenses = (data ?? []).reduce((sum, line) => sum + ((line.debit_amount ?? 0) - (line.credit_amount ?? 0)), 0);
      const monthlyBurn = totalExpenses / monthsInRange;

      const { data: revData } = await supabase
        .from("journal_lines")
        .select("debit_amount, credit_amount, accounts!inner(account_type), journal_entries!inner(date, organization_id, status)")
        .gte("journal_entries.date", lookbackFrom)
        .lte("journal_entries.date", lookbackTo)
        .eq("journal_entries.organization_id", orgId!)
        .eq("journal_entries.status", "posted")
        .eq("accounts.account_type", "revenue");
      
      const totalRevenue = (revData ?? []).reduce((sum, line) => sum + ((line.credit_amount ?? 0) - (line.debit_amount ?? 0)), 0);
      const monthlyRevenueAvg = totalRevenue / monthsInRange;
      const netProfit = monthlyRevenueAvg - monthlyBurn;
      const grossMargin = monthlyRevenueAvg > 0 ? ((monthlyRevenueAvg - monthlyBurn) / monthlyRevenueAvg) * 100 : 0;

      const cashBalance = (await supabase
        .from("bank_accounts")
        .select("current_balance")
        .eq("organization_id", orgId!)
        .eq("is_active", true)).data?.reduce((sum, b) => sum + (b.current_balance ?? 0), 0) ?? 0;

      const cashRunwayMonths = monthlyBurn > 0 ? cashBalance / monthlyBurn : null;

      return { monthlyBurn, monthlyRevenue: monthlyRevenueAvg, netProfit, grossMargin, cashRunwayMonths, cashBalance };
    },
  });

  return {
    healthSnapshot,
    recentTransactions,
    anomaliesCount,
    unreconciledCount,
    missingDocsCount,
    pendingDocsCount,
    recentDocuments,
    vatDeadline,
    monthlyRevenue,
    bankBalances,
    openInvoices,
    burnRate,
    role: membership?.role,
  };
}
