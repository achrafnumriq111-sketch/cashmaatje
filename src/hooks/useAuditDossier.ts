import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { useReportData } from "./useReportData";

export interface AuditSection {
  id: string;
  title: string;
  status: "complete" | "incomplete" | "warning";
  itemCount: number;
  totalAmount: number;
  details: any[];
}

export function useAuditDossier(year: number) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const { fetchAccountBalances, fetchBalanceSheet } = useReportData();

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const fetchLeadSchedules = useCallback(async (): Promise<AuditSection> => {
    const balances = await fetchAccountBalances(startDate, endDate);
    const nonZero = balances.filter((b) => Math.abs(b.balance) > 0.01);
    return {
      id: "lead",
      title: "Lead Schedules",
      status: nonZero.length > 0 ? "complete" : "incomplete",
      itemCount: nonZero.length,
      totalAmount: nonZero.reduce((s, b) => s + Math.abs(b.balance), 0),
      details: nonZero,
    };
  }, [fetchAccountBalances, startDate, endDate]);

  const fetchInvoiceEvidence = useCallback(async (): Promise<AuditSection> => {
    if (!orgId) return { id: "invoices", title: "Factuur Bewijs", status: "incomplete", itemCount: 0, totalAmount: 0, details: [] };

    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, invoice_number, invoice_type, invoice_date, contact_name, total_amount, total_vat, status, document_id")
      .eq("organization_id", orgId)
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate)
      .order("invoice_date");

    const items = invoices ?? [];
    const withDoc = items.filter((i) => i.document_id);
    const missingDoc = items.filter((i) => !i.document_id);

    return {
      id: "invoices",
      title: "Factuur Bewijs",
      status: missingDoc.length > 0 ? "warning" : "complete",
      itemCount: items.length,
      totalAmount: items.reduce((s, i) => s + Number(i.total_amount ?? 0), 0),
      details: items.map((i) => ({ ...i, hasDocument: !!i.document_id })),
    };
  }, [orgId, startDate, endDate]);

  const fetchBankReconciliation = useCallback(async (): Promise<AuditSection> => {
    if (!orgId) return { id: "bank", title: "Bankaansluitingen", status: "incomplete", itemCount: 0, totalAmount: 0, details: [] };

    const { data: txs } = await supabase
      .from("bank_transactions")
      .select("id, transaction_date, amount, status, counterparty_name, description")
      .eq("organization_id", orgId)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate);

    const items = txs ?? [];
    const reconciled = items.filter((t) => t.status === "reconciled" || t.status === "matched");
    const unreconciled = items.filter((t) => t.status === "new");

    return {
      id: "bank",
      title: "Bankaansluitingen",
      status: unreconciled.length > 0 ? "warning" : "complete",
      itemCount: items.length,
      totalAmount: items.reduce((s, t) => s + Math.abs(Number(t.amount)), 0),
      details: [
        { label: "Totaal transacties", value: items.length },
        { label: "Afgestemd", value: reconciled.length },
        { label: "Openstaand", value: unreconciled.length },
        { label: "Percentage", value: items.length > 0 ? Math.round((reconciled.length / items.length) * 100) : 0 },
      ],
    };
  }, [orgId, startDate, endDate]);

  const fetchVatCheck = useCallback(async (): Promise<AuditSection> => {
    if (!orgId) return { id: "vat", title: "BTW Controle", status: "incomplete", itemCount: 0, totalAmount: 0, details: [] };

    const { data: vatReturns } = await supabase
      .from("vat_returns")
      .select("*")
      .eq("organization_id", orgId)
      .eq("year", year)
      .order("period_number");

    const items = vatReturns ?? [];
    const filed = items.filter((v) => v.status === "filed" || v.status === "paid");

    return {
      id: "vat",
      title: "BTW Controle",
      status: items.length === 0 ? "incomplete" : filed.length < items.length ? "warning" : "complete",
      itemCount: items.length,
      totalAmount: items.reduce((s, v: any) => s + Math.abs(Number(v.box_5c_vat ?? 0)), 0),
      details: items,
    };
  }, [orgId, year]);

  const fetchDebtors = useCallback(async (): Promise<AuditSection> => {
    if (!orgId) return { id: "debtors", title: "Debiteuren Analyse", status: "incomplete", itemCount: 0, totalAmount: 0, details: [] };

    const { data: receivables } = await supabase
      .from("invoices")
      .select("id, invoice_number, contact_name, total_amount, amount_paid, amount_due, due_date, invoice_date, status")
      .eq("organization_id", orgId)
      .eq("invoice_type", "sales")
      .in("status", ["sent", "partial", "overdue"])
      .order("due_date");

    const items = receivables ?? [];
    const now = new Date();
    const aging = {
      current: 0,
      d30: 0,
      d60: 0,
      d90: 0,
      over90: 0,
    };

    items.forEach((inv) => {
      const due = new Date(inv.due_date ?? inv.invoice_date);
      const days = Math.floor((now.getTime() - due.getTime()) / 86400000);
      const amt = Number(inv.amount_due ?? inv.total_amount) - Number(inv.amount_paid ?? 0);
      if (days <= 0) aging.current += amt;
      else if (days <= 30) aging.d30 += amt;
      else if (days <= 60) aging.d60 += amt;
      else if (days <= 90) aging.d90 += amt;
      else aging.over90 += amt;
    });

    const totalDue = Object.values(aging).reduce((s, v) => s + v, 0);

    return {
      id: "debtors",
      title: "Debiteuren Analyse",
      status: aging.over90 > 0 ? "warning" : "complete",
      itemCount: items.length,
      totalAmount: totalDue,
      details: [
        { label: "Lopend", value: aging.current },
        { label: "1-30 dagen", value: aging.d30 },
        { label: "31-60 dagen", value: aging.d60 },
        { label: "61-90 dagen", value: aging.d90 },
        { label: ">90 dagen", value: aging.over90 },
      ],
    };
  }, [orgId]);

  const fetchCreditors = useCallback(async (): Promise<AuditSection> => {
    if (!orgId) return { id: "creditors", title: "Crediteuren Analyse", status: "incomplete", itemCount: 0, totalAmount: 0, details: [] };

    const { data: payables } = await supabase
      .from("invoices")
      .select("id, invoice_number, contact_name, total_amount, amount_paid, amount_due, due_date, invoice_date, status")
      .eq("organization_id", orgId)
      .eq("invoice_type", "purchase")
      .in("status", ["sent", "partial", "overdue"])
      .order("due_date");

    const items = payables ?? [];
    const totalDue = items.reduce((s, i) => s + (Number(i.amount_due ?? i.total_amount) - Number(i.amount_paid ?? 0)), 0);

    return {
      id: "creditors",
      title: "Crediteuren Analyse",
      status: items.length > 0 ? "warning" : "complete",
      itemCount: items.length,
      totalAmount: totalDue,
      details: items,
    };
  }, [orgId]);

  const fetchDocuments = useCallback(async (): Promise<AuditSection> => {
    if (!orgId) return { id: "documents", title: "Ondersteunende Documenten", status: "incomplete", itemCount: 0, totalAmount: 0, details: [] };

    const { data: docs } = await supabase
      .from("documents")
      .select("id, file_name, document_type, extracted_amount, is_validated, created_at")
      .eq("organization_id", orgId)
      .gte("created_at", startDate)
      .lte("created_at", endDate + "T23:59:59");

    const items = docs ?? [];
    const validated = items.filter((d) => d.is_validated);

    return {
      id: "documents",
      title: "Ondersteunende Documenten",
      status: validated.length < items.length ? "warning" : "complete",
      itemCount: items.length,
      totalAmount: items.reduce((s, d) => s + Math.abs(Number(d.extracted_amount ?? 0)), 0),
      details: [
        { label: "Totaal documenten", value: items.length },
        { label: "Gevalideerd", value: validated.length },
        { label: "Nog te valideren", value: items.length - validated.length },
      ],
    };
  }, [orgId, startDate, endDate]);

  const fetchAllSections = useCallback(async () => {
    const [lead, invoices, bank, vat, debtors, creditors, documents] = await Promise.all([
      fetchLeadSchedules(),
      fetchInvoiceEvidence(),
      fetchBankReconciliation(),
      fetchVatCheck(),
      fetchDebtors(),
      fetchCreditors(),
      fetchDocuments(),
    ]);
    return [lead, invoices, bank, vat, debtors, creditors, documents];
  }, [fetchLeadSchedules, fetchInvoiceEvidence, fetchBankReconciliation, fetchVatCheck, fetchDebtors, fetchCreditors, fetchDocuments]);

  return { orgId, fetchAllSections };
}
