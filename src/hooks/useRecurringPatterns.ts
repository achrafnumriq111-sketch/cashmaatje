import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

/**
 * Detects recurring transaction patterns by analyzing counterparty + amount frequency.
 * Runs client-side analysis then upserts into recurring_patterns table.
 */
export function useDetectRecurringPatterns() {
  const { membership } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const orgId = membership!.organizationId;

      // Get last 6 months of transactions
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: transactions } = await supabase
        .from("bank_transactions")
        .select("id, counterparty_name, counterparty_iban, amount, transaction_date, account_id, contact_id")
        .eq("organization_id", orgId)
        .gte("transaction_date", sixMonthsAgo.toISOString().split("T")[0])
        .order("transaction_date", { ascending: true });

      if (!transactions?.length) return { patterns: 0 };

      // Group by counterparty name (normalized)
      const groups: Record<string, typeof transactions> = {};
      for (const tx of transactions) {
        const key = (tx.counterparty_name || "unknown").toLowerCase().trim();
        if (!groups[key]) groups[key] = [];
        groups[key].push(tx);
      }

      const patterns: Array<{
        counterparty_name: string;
        counterparty_iban: string | null;
        typical_amount: number;
        amount_variance: number;
        frequency_days: number;
        next_expected_date: string;
        occurrence_count: number;
        last_seen_date: string;
        account_id: string | null;
        contact_id: string | null;
      }> = [];

      for (const [, txs] of Object.entries(groups)) {
        if (txs.length < 3) continue; // Need at least 3 occurrences

        // Calculate intervals between transactions
        const dates = txs.map(t => new Date(t.transaction_date).getTime()).sort((a, b) => a - b);
        const intervals: number[] = [];
        for (let i = 1; i < dates.length; i++) {
          intervals.push(Math.round((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)));
        }

        const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
        const intervalVariance = Math.sqrt(intervals.reduce((s, v) => s + (v - avgInterval) ** 2, 0) / intervals.length);

        // Only consider as recurring if interval variance is reasonable (< 50% of avg)
        if (intervalVariance > avgInterval * 0.5) continue;

        const amounts = txs.map(t => t.amount);
        const avgAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length;
        const amountVariance = Math.max(...amounts) - Math.min(...amounts);

        const lastDate = new Date(Math.max(...dates));
        const nextExpected = new Date(lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);

        const lastTx = txs[txs.length - 1];

        patterns.push({
          counterparty_name: lastTx.counterparty_name || "Onbekend",
          counterparty_iban: lastTx.counterparty_iban,
          typical_amount: Math.round(avgAmount * 100) / 100,
          amount_variance: Math.round(amountVariance * 100) / 100,
          frequency_days: Math.round(avgInterval),
          next_expected_date: nextExpected.toISOString().split("T")[0],
          occurrence_count: txs.length,
          last_seen_date: lastDate.toISOString().split("T")[0],
          account_id: lastTx.account_id,
          contact_id: lastTx.contact_id,
        });
      }

      // Upsert patterns
      for (const p of patterns) {
        // Check if pattern exists
        const { data: existing } = await supabase
          .from("recurring_patterns")
          .select("id")
          .eq("organization_id", orgId)
          .eq("counterparty_name", p.counterparty_name)
          .limit(1);

        if (existing?.length) {
          await supabase
            .from("recurring_patterns")
            .update(p)
            .eq("id", existing[0].id);
        } else {
          await supabase
            .from("recurring_patterns")
            .insert({ ...p, organization_id: orgId });
        }
      }

      return { patterns: patterns.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-patterns"] });
    },
  });
}

export function useRecurringPatterns() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return {
    ...({} as any), // placeholder for type
    ...(await import("@tanstack/react-query")).useQuery({
      queryKey: ["recurring-patterns", orgId],
      enabled: !!orgId,
      queryFn: async () => {
        const { data } = await supabase
          .from("recurring_patterns")
          .select("*, accounts(code, name_nl), contacts(name)")
          .eq("organization_id", orgId!)
          .eq("is_active", true)
          .order("next_expected_date", { ascending: true });
        return data ?? [];
      },
    }),
  };
}
