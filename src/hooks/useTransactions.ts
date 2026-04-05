import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type BankTxStatus = Database["public"]["Enums"]["bank_tx_status"];

export interface TransactionFilters {
  bankAccountId: string | null;
  dateFrom: string;
  dateTo: string;
  status: BankTxStatus | "all";
  search: string;
}

export function useTransactions(filters: TransactionFilters) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["transactions", orgId, filters],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from("bank_transactions")
        .select("*, contacts(name), accounts!bank_transactions_ai_category_suggestion_fkey(code, name, name_nl)")
        .eq("organization_id", orgId!)
        .gte("transaction_date", filters.dateFrom)
        .lte("transaction_date", filters.dateTo)
        .order("transaction_date", { ascending: false });

      if (filters.bankAccountId) {
        query = query.eq("bank_account_id", filters.bankAccountId);
      }
      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.search) {
        query = query.or(
          `counterparty_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBankAccounts() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["bank-accounts", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("bank_accounts")
        .select("id, name, iban, current_balance")
        .eq("organization_id", orgId!)
        .eq("is_active", true);
      return data ?? [];
    },
  });
}

export function useAccounts() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["accounts", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("accounts")
        .select("id, code, name, name_nl, account_type")
        .eq("organization_id", orgId!)
        .eq("is_active", true)
        .eq("is_header", false)
        .order("code");
      return data ?? [];
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Record<string, any>;
    }) => {
      const { error } = await supabase
        .from("bank_transactions")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useBulkUpdateTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      updates,
    }: {
      ids: string[];
      updates: Record<string, any>;
    }) => {
      const { error } = await supabase
        .from("bank_transactions")
        .update(updates)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useCategorizeTransactions() {
  const { membership } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const { data, error } = await supabase.functions.invoke(
        "categorize-transaction",
        {
          body: {
            transaction_ids: transactionIds,
            organization_id: membership?.organizationId,
          },
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useImportTransactions() {
  const { membership } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bankAccountId,
      rows,
    }: {
      bankAccountId: string;
      rows: Array<{
        transaction_date: string;
        amount: number;
        description: string;
        counterparty_name: string;
        payment_reference?: string;
        counterparty_iban?: string;
      }>;
    }) => {
      const orgId = membership?.organizationId;
      if (!orgId) throw new Error("No organization");

      const inserts = rows.map((r) => ({
        ...r,
        organization_id: orgId,
        bank_account_id: bankAccountId,
        status: "new" as const,
      }));

      const { data, error } = await supabase
        .from("bank_transactions")
        .insert(inserts)
        .select("id");
      if (error) throw error;
      return data?.map((d) => d.id) ?? [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
