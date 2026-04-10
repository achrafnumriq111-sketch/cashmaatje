import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  nameNl: string | null;
  accountType: string;
  accountSubtype: string | null;
  isSystem: boolean;
  isHeader: boolean;
  vatBoxMapping: string | null;
  defaultVatPercentage: number | null;
  debitTotal: number;
  creditTotal: number;
  balance: number;
  entryCount: number;
}

export interface LedgerFilters {
  search: string;
  accountType: "all" | "asset" | "liability" | "equity" | "revenue" | "expense";
  activity: "all" | "active" | "inactive";
}

export function useGeneralLedger(filters: LedgerFilters, dateFrom: string, dateTo: string) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["general-ledger", orgId, filters, dateFrom, dateTo],
    enabled: !!orgId,
    queryFn: async () => {
      // Fetch accounts
      let accountQuery = supabase
        .from("accounts")
        .select("id, code, name, name_nl, account_type, account_subtype, is_system, is_header, vat_box_mapping, default_vat_percentage")
        .eq("organization_id", orgId!)
        .eq("is_active", true)
        .order("code");

      if (filters.accountType !== "all") {
        accountQuery = accountQuery.eq("account_type", filters.accountType);
      }
      if (filters.search) {
        accountQuery = accountQuery.or(`name.ilike.%${filters.search}%,name_nl.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      }

      const { data: accounts, error: accErr } = await accountQuery;
      if (accErr) throw accErr;
      if (!accounts?.length) return [];

      // Fetch journal line totals
      const { data: lines } = await supabase
        .from("journal_lines")
        .select("account_id, debit_amount, credit_amount, journal_entries!inner(organization_id, date, status)")
        .eq("journal_entries.organization_id", orgId!)
        .eq("journal_entries.status", "posted")
        .gte("journal_entries.date", dateFrom)
        .lte("journal_entries.date", dateTo);

      const totals: Record<string, { debit: number; credit: number; count: number }> = {};
      (lines ?? []).forEach((l: any) => {
        const id = l.account_id;
        if (!totals[id]) totals[id] = { debit: 0, credit: 0, count: 0 };
        totals[id].debit += Number(l.debit_amount ?? 0);
        totals[id].credit += Number(l.credit_amount ?? 0);
        totals[id].count += 1;
      });

      const result: LedgerAccount[] = accounts
        .filter((a) => !a.is_header)
        .map((a) => {
          const t = totals[a.id] ?? { debit: 0, credit: 0, count: 0 };
          return {
            id: a.id,
            code: a.code,
            name: a.name,
            nameNl: a.name_nl,
            accountType: a.account_type,
            accountSubtype: a.account_subtype,
            isSystem: a.is_system ?? false,
            isHeader: a.is_header ?? false,
            vatBoxMapping: a.vat_box_mapping,
            defaultVatPercentage: a.default_vat_percentage,
            debitTotal: t.debit,
            creditTotal: t.credit,
            balance: t.debit - t.credit,
            entryCount: t.count,
          };
        });

      if (filters.activity === "active") return result.filter((r) => r.entryCount > 0);
      if (filters.activity === "inactive") return result.filter((r) => r.entryCount === 0);
      return result;
    },
  });
}

export function useAccountLedger(accountId: string | null, dateFrom: string, dateTo: string) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["account-ledger", accountId, orgId, dateFrom, dateTo],
    enabled: !!accountId && !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_lines")
        .select("*, accounts!journal_lines_account_id_fkey(code, name, name_nl), journal_entries!inner(id, entry_number, date, description, status, source_type, ai_confidence)")
        .eq("account_id", accountId!)
        .eq("journal_entries.organization_id", orgId!)
        .eq("journal_entries.status", "posted")
        .gte("journal_entries.date", dateFrom)
        .lte("journal_entries.date", dateTo)
        .order("journal_entries(date)", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}
