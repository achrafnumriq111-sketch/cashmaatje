import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export interface BankRule {
  id: string;
  organization_id: string;
  name: string;
  priority: number;
  match_field: "counterparty_name" | "description" | "counterparty_iban" | "payment_reference";
  match_type: "exact" | "contains" | "starts_with" | "regex";
  match_value: string;
  account_id: string | null;
  contact_id: string | null;
  is_active: boolean;
  times_applied: number;
  last_applied_at: string | null;
}

export function useBankRules() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["bank-rules", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_rules")
        .select("*, accounts(code, name_nl), contacts(name)")
        .eq("organization_id", orgId!)
        .order("priority", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateBankRule() {
  const { membership } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Omit<BankRule, "id" | "organization_id" | "times_applied" | "last_applied_at">) => {
      const { error } = await supabase
        .from("bank_rules")
        .insert({ ...rule, organization_id: membership!.organizationId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank-rules"] }),
  });
}

export function useUpdateBankRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BankRule> }) => {
      const { error } = await supabase
        .from("bank_rules")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank-rules"] }),
  });
}

export function useDeleteBankRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bank_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank-rules"] }),
  });
}

/** Apply bank rules to a set of transactions client-side, then update via supabase */
export function useApplyBankRules() {
  const { membership } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const orgId = membership!.organizationId;

      // Fetch active rules
      const { data: rules } = await supabase
        .from("bank_rules")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("priority", { ascending: true });

      if (!rules?.length) return { matched: 0, total: transactionIds.length };

      // Fetch transactions
      const { data: transactions } = await supabase
        .from("bank_transactions")
        .select("id, counterparty_name, description, counterparty_iban, payment_reference")
        .in("id", transactionIds);

      if (!transactions?.length) return { matched: 0, total: 0 };

      let matched = 0;

      for (const tx of transactions) {
        for (const rule of rules) {
          const fieldValue = (tx as any)[rule.match_field] as string | null;
          if (!fieldValue) continue;

          let isMatch = false;
          const val = fieldValue.toLowerCase();
          const pattern = rule.match_value.toLowerCase();

          switch (rule.match_type) {
            case "exact":
              isMatch = val === pattern;
              break;
            case "contains":
              isMatch = val.includes(pattern);
              break;
            case "starts_with":
              isMatch = val.startsWith(pattern);
              break;
            case "regex":
              try { isMatch = new RegExp(rule.match_value, "i").test(fieldValue); } catch { }
              break;
          }

          if (isMatch) {
            const updates: Record<string, any> = {};
            if (rule.account_id) updates.account_id = rule.account_id;
            if (rule.contact_id) updates.contact_id = rule.contact_id;
            if (Object.keys(updates).length > 0) {
              updates.status = "matched";
              await supabase.from("bank_transactions").update(updates).eq("id", tx.id);

              // Update rule stats
              await supabase.from("bank_rules").update({
                times_applied: rule.times_applied + 1,
                last_applied_at: new Date().toISOString(),
              }).eq("id", rule.id);

              matched++;
              break; // First matching rule wins
            }
          }
        }
      }

      return { matched, total: transactionIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-rules"] });
    },
  });
}
