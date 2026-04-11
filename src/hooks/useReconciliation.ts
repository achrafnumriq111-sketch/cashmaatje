import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { createPaymentJournalEntry, createDirectBookingJournalEntry } from "./useInvoices";

export interface ReconciliationFilters {
  bankAccountId: string | null;
  dateFrom: string;
  dateTo: string;
}

export function useUnreconciledTransactions(filters: ReconciliationFilters) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["unreconciled-transactions", orgId, filters],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from("bank_transactions")
        .select("*, contacts(name)")
        .eq("organization_id", orgId!)
        .in("status", ["new"])
        .gte("transaction_date", filters.dateFrom)
        .lte("transaction_date", filters.dateTo)
        .order("transaction_date", { ascending: false });

      if (filters.bankAccountId) {
        query = query.eq("bank_account_id", filters.bankAccountId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTransactionStats() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["transaction-stats", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: all } = await supabase
        .from("bank_transactions")
        .select("id, status")
        .eq("organization_id", orgId!);

      const total = all?.length ?? 0;
      const matched = all?.filter((t) => t.status === "matched" || t.status === "reconciled").length ?? 0;
      return { total, matched, percentage: total > 0 ? Math.round((matched / total) * 100) : 0 };
    },
  });
}

export function useOpenInvoices(search: string) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["open-invoices", orgId, search],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("id, invoice_number, invoice_type, contact_name, contact_id, total_amount, amount_paid, amount_due, due_date, payment_reference")
        .eq("organization_id", orgId!)
        .in("status", ["sent", "partial", "overdue"])
        .order("due_date", { ascending: true });

      if (search) {
        query = query.or(
          `invoice_number.ilike.%${search}%,contact_name.ilike.%${search}%,payment_reference.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSuggestedMatches(transactionId: string | null) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["suggested-matches", transactionId],
    enabled: !!orgId && !!transactionId,
    queryFn: async () => {
      if (!transactionId) return [];

      const { data: tx } = await supabase
        .from("bank_transactions")
        .select("amount, counterparty_name, counterparty_iban, payment_reference")
        .eq("id", transactionId)
        .single();

      if (!tx) return [];

      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, invoice_number, invoice_type, contact_name, contact_id, total_amount, amount_paid, amount_due, due_date, payment_reference, contacts(iban)")
        .eq("organization_id", orgId!)
        .in("status", ["sent", "partial", "overdue"]);

      if (!invoices) return [];

      type ScoredInvoice = (typeof invoices)[number] & {
        confidence: number;
        matchMethod: string;
      };

      const scored: ScoredInvoice[] = [];
      const txAmount = Math.abs(tx.amount);

      for (const inv of invoices) {
        let confidence = 0;
        let matchMethod = "ai_fuzzy";
        const due = inv.amount_due ?? inv.total_amount - (inv.amount_paid ?? 0);

        // Exact payment reference match
        if (tx.payment_reference && inv.payment_reference && tx.payment_reference === inv.payment_reference) {
          confidence = 95;
          matchMethod = "exact_reference";
        }
        // Amount match
        else if (Math.abs(txAmount - due) < 0.01) {
          confidence = 75;
          matchMethod = "amount_and_date";

          // Boost if IBAN matches
          const contactIban = (inv.contacts as any)?.iban;
          if (contactIban && tx.counterparty_iban && contactIban === tx.counterparty_iban) {
            confidence = 90;
            matchMethod = "counterparty_pattern";
          }
          // Boost if name matches
          if (tx.counterparty_name && inv.contact_name &&
            tx.counterparty_name.toLowerCase().includes(inv.contact_name.toLowerCase())) {
            confidence = Math.max(confidence, 85);
            matchMethod = "counterparty_pattern";
          }
        }
        // Partial amount match (within 10%)
        else if (due > 0 && Math.abs(txAmount - due) / due < 0.1) {
          confidence = 40;
          matchMethod = "ai_fuzzy";
        }

        if (confidence > 20) {
          scored.push({ ...inv, confidence, matchMethod });
        }
      }

      return scored.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    },
  });
}

export function useMatchTransaction() {
  const { membership } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      invoiceId,
      amount,
    }: {
      transactionId: string;
      invoiceId: string;
      amount: number;
    }) => {
      const orgId = membership?.organizationId;
      if (!orgId) throw new Error("No organization");

      // Create payment allocation
      const { error: allocError } = await supabase
        .from("payment_allocations")
        .insert({
          organization_id: orgId,
          bank_transaction_id: transactionId,
          invoice_id: invoiceId,
          amount: Math.abs(amount),
          allocation_date: new Date().toISOString().split("T")[0],
        });
      if (allocError) throw allocError;

      // Update transaction status
      const { error: txError } = await supabase
        .from("bank_transactions")
        .update({ status: "matched", matched_invoice_id: invoiceId })
        .eq("id", transactionId);
      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreconciled-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-stats"] });
      queryClient.invalidateQueries({ queryKey: ["suggested-matches"] });
    },
  });
}

export function useBookDirectly() {
  const { membership } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      accountId,
    }: {
      transactionId: string;
      accountId: string;
    }) => {
      const orgId = membership?.organizationId;
      if (!orgId) throw new Error("No organization");

      const { error } = await supabase
        .from("bank_transactions")
        .update({ status: "matched", account_id: accountId })
        .eq("id", transactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreconciled-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-stats"] });
    },
  });
}

export function useExcludeTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from("bank_transactions")
        .update({ status: "reconciled" })
        .eq("id", transactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreconciled-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-stats"] });
    },
  });
}

export function useReconciliationRules() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["reconciliation-rules", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("reconciliation_rules")
        .select("*, accounts(code, name)")
        .eq("organization_id", orgId!)
        .eq("is_active", true)
        .order("priority", { ascending: false });
      return data ?? [];
    },
  });
}

export function useCreateRule() {
  const { membership } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: {
      name: string;
      match_counterparty?: string;
      match_description?: string;
      assign_account_id?: string;
      assign_contact_id?: string;
    }) => {
      const orgId = membership?.organizationId;
      if (!orgId) throw new Error("No organization");

      const { error } = await supabase
        .from("reconciliation_rules")
        .insert({ ...rule, organization_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation-rules"] });
    },
  });
}
