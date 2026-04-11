import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

/**
 * Detects recurring transaction patterns by analyzing counterparty + amount frequency.
 */
export function useDetectRecurringPatterns() {
  const { membership } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const orgId = membership!.organizationId;

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: transactions } = await supabase
        .from("bank_transactions")
        .select("id, counterparty_name, counterparty_iban, amount, transaction_date, account_id, contact_id")
        .eq("organization_id", orgId)
        .gte("transaction_date", sixMonthsAgo.toISOString().split("T")[0])
        .order("transaction_date", { ascending: true });

      if (!transactions?.length) return { patterns: 0 };

      // Group by counterparty name
      const groups: Record<string, typeof transactions> = {};
      for (const tx of transactions) {
        const key = (tx.counterparty_name || "unknown").toLowerCase().trim();
        if (!groups[key]) groups[key] = [];
        groups[key].push(tx);
      }

      let patternCount = 0;

      for (const [, txs] of Object.entries(groups)) {
        if (txs.length < 3) continue;

        const dates = txs.map(t => new Date(t.transaction_date).getTime()).sort((a, b) => a - b);
        const intervals: number[] = [];
        for (let i = 1; i < dates.length; i++) {
          intervals.push(Math.round((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)));
        }

        const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
        const intervalVariance = Math.sqrt(intervals.reduce((s, v) => s + (v - avgInterval) ** 2, 0) / intervals.length);

        if (intervalVariance > avgInterval * 0.5) continue;

        const amounts = txs.map(t => t.amount);
        const avgAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length;
        const amountVar = Math.max(...amounts) - Math.min(...amounts);

        const lastDate = new Date(Math.max(...dates));
        const nextExpected = new Date(lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);
        const lastTx = txs[txs.length - 1];

        // Determine frequency label
        let frequency = "onbekend";
        if (avgInterval >= 25 && avgInterval <= 35) frequency = "maandelijks";
        else if (avgInterval >= 6 && avgInterval <= 8) frequency = "wekelijks";
        else if (avgInterval >= 80 && avgInterval <= 100) frequency = "per kwartaal";
        else if (avgInterval >= 350 && avgInterval <= 380) frequency = "jaarlijks";

        const description = `${lastTx.counterparty_name || "Onbekend"} — ${frequency} ~€${Math.abs(avgAmount).toFixed(0)}`;

        const patternData = {
          counterparty_name: lastTx.counterparty_name || "Onbekend",
          typical_amount: Math.round(avgAmount * 100) / 100,
          amount_variance: Math.round(amountVar * 100) / 100,
          frequency,
          expected_day: new Date(lastDate).getDate(),
          next_expected_date: nextExpected.toISOString().split("T")[0],
          times_matched: txs.length,
          last_seen_date: lastDate.toISOString().split("T")[0],
          account_id: lastTx.account_id,
          contact_id: lastTx.contact_id,
          confidence: intervalVariance < avgInterval * 0.2 ? 0.9 : 0.7,
          detected_by: "system",
          sample_transactions: txs.slice(-3).map(t => t.id),
        };

        // Upsert
        const { data: existing } = await supabase
          .from("recurring_patterns")
          .select("id")
          .eq("organization_id", orgId)
          .eq("counterparty_name", patternData.counterparty_name)
          .limit(1);

        if (existing?.length) {
          await supabase.from("recurring_patterns").update(patternData).eq("id", existing[0].id);
        } else {
          await supabase.from("recurring_patterns").insert({
            ...patternData,
            organization_id: orgId,
            description,
          });
        }

        patternCount++;
      }

      return { patterns: patternCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-patterns"] });
    },
  });
}

export function useRecurringPatterns() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
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
  });
}
