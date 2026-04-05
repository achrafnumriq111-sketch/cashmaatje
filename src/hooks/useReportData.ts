import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

interface AccountLine {
  accountId: string;
  code: string;
  name: string;
  nameNl: string | null;
  accountType: string;
  accountSubtype: string | null;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

interface CashflowPoint {
  date: string;
  actual: number | null;
  predicted: number | null;
}

interface UpcomingItem {
  id: string;
  type: "receivable" | "payable";
  contactName: string | null;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
}

export function useReportData() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  const fetchAccountBalances = useCallback(
    async (startDate: string, endDate: string): Promise<AccountLine[]> => {
      if (!orgId) return [];

      const { data: accounts } = await supabase
        .from("accounts")
        .select("id, code, name, name_nl, account_type, account_subtype")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .eq("is_header", false)
        .order("code");

      if (!accounts?.length) return [];

      const { data: lines } = await supabase
        .from("journal_lines")
        .select("account_id, debit_amount, credit_amount, journal_entries!inner(organization_id, date, status)")
        .eq("journal_entries.organization_id", orgId)
        .eq("journal_entries.status", "posted")
        .gte("journal_entries.date", startDate)
        .lte("journal_entries.date", endDate);

      const totals: Record<string, { debit: number; credit: number }> = {};
      (lines ?? []).forEach((l: any) => {
        const id = l.account_id;
        if (!totals[id]) totals[id] = { debit: 0, credit: 0 };
        totals[id].debit += Number(l.debit_amount ?? 0);
        totals[id].credit += Number(l.credit_amount ?? 0);
      });

      return accounts.map((a) => {
        const t = totals[a.id] ?? { debit: 0, credit: 0 };
        return {
          accountId: a.id,
          code: a.code,
          name: a.name,
          nameNl: a.name_nl,
          accountType: a.account_type,
          accountSubtype: a.account_subtype,
          debitTotal: t.debit,
          creditTotal: t.credit,
          balance: t.debit - t.credit,
        };
      });
    },
    [orgId]
  );

  const fetchBalanceSheet = useCallback(
    async (asOfDate: string): Promise<AccountLine[]> => {
      return fetchAccountBalances("1900-01-01", asOfDate);
    },
    [fetchAccountBalances]
  );

  const fetchCashflow = useCallback(async (): Promise<{
    points: CashflowPoint[];
    upcoming: UpcomingItem[];
  }> => {
    if (!orgId) return { points: [], upcoming: [] };

    const { data: entries } = await supabase
      .from("cashflow_entries")
      .select("*")
      .eq("organization_id", orgId)
      .order("date");

    const points: CashflowPoint[] = (entries ?? []).map((e: any) => ({
      date: e.date,
      actual: e.entry_type === "actual" ? Number(e.amount) : null,
      predicted: e.entry_type === "predicted" ? Number(e.amount) : null,
    }));

    const { data: receivables } = await supabase
      .from("invoices")
      .select("id, invoice_number, contact_name, amount_due, due_date")
      .eq("organization_id", orgId)
      .eq("invoice_type", "sales")
      .in("status", ["sent", "partial", "overdue"])
      .order("due_date");

    const { data: payables } = await supabase
      .from("invoices")
      .select("id, invoice_number, contact_name, amount_due, due_date")
      .eq("organization_id", orgId)
      .eq("invoice_type", "purchase")
      .in("status", ["sent", "partial", "overdue"])
      .order("due_date");

    const upcoming: UpcomingItem[] = [
      ...(receivables ?? []).map((r: any) => ({
        id: r.id,
        type: "receivable" as const,
        contactName: r.contact_name,
        invoiceNumber: r.invoice_number,
        amount: Number(r.amount_due ?? 0),
        dueDate: r.due_date ?? "",
      })),
      ...(payables ?? []).map((p: any) => ({
        id: p.id,
        type: "payable" as const,
        contactName: p.contact_name,
        invoiceNumber: p.invoice_number,
        amount: Number(p.amount_due ?? 0),
        dueDate: p.due_date ?? "",
      })),
    ];

    return { points, upcoming };
  }, [orgId]);

  return { orgId, fetchAccountBalances, fetchBalanceSheet, fetchCashflow };
}
