import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { useReportData } from "./useReportData";
import { startOfYear, endOfYear, format } from "date-fns";

interface TaxDeduction {
  id?: string;
  year: number;
  zelfstandigenaftrek_enabled: boolean;
  zelfstandigenaftrek_amount: number;
  startersaftrek_enabled: boolean;
  startersaftrek_amount: number;
  mkb_winstvrijstelling_enabled: boolean;
  mkb_winstvrijstelling_percentage: number;
  meewerkaftrek_enabled: boolean;
  meewerkaftrek_amount: number;
  stakingsaftrek_enabled: boolean;
  stakingsaftrek_amount: number;
  for_enabled: boolean;
  for_percentage: number;
  for_max_amount: number;
  notes: string | null;
}

const defaults = (year: number): TaxDeduction => ({
  year,
  zelfstandigenaftrek_enabled: true,
  zelfstandigenaftrek_amount: 3750,
  startersaftrek_enabled: false,
  startersaftrek_amount: 2123,
  mkb_winstvrijstelling_enabled: true,
  mkb_winstvrijstelling_percentage: 13.31,
  meewerkaftrek_enabled: false,
  meewerkaftrek_amount: 0,
  stakingsaftrek_enabled: false,
  stakingsaftrek_amount: 3630,
  for_enabled: false,
  for_percentage: 9.44,
  for_max_amount: 9632,
  notes: null,
});

export function useTaxDeductions(year: number) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const { fetchAccountBalances } = useReportData();

  const [deduction, setDeduction] = useState<TaxDeduction>(defaults(year));
  const [profit, setProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    // Fetch deduction settings
    const { data } = await supabase
      .from("tax_deductions")
      .select("*")
      .eq("organization_id", orgId)
      .eq("year", year)
      .maybeSingle();

    if (data) {
      setDeduction({
        id: data.id,
        year: data.year,
        zelfstandigenaftrek_enabled: data.zelfstandigenaftrek_enabled,
        zelfstandigenaftrek_amount: Number(data.zelfstandigenaftrek_amount),
        startersaftrek_enabled: data.startersaftrek_enabled,
        startersaftrek_amount: Number(data.startersaftrek_amount),
        mkb_winstvrijstelling_enabled: data.mkb_winstvrijstelling_enabled,
        mkb_winstvrijstelling_percentage: Number(data.mkb_winstvrijstelling_percentage),
        meewerkaftrek_enabled: data.meewerkaftrek_enabled,
        meewerkaftrek_amount: Number(data.meewerkaftrek_amount),
        stakingsaftrek_enabled: data.stakingsaftrek_enabled,
        stakingsaftrek_amount: Number(data.stakingsaftrek_amount),
        for_enabled: data.for_enabled,
        for_percentage: Number(data.for_percentage),
        for_max_amount: Number(data.for_max_amount),
        notes: data.notes,
      });
    } else {
      setDeduction(defaults(year));
    }

    // Fetch profit for the year
    const start = format(startOfYear(new Date(year, 0, 1)), "yyyy-MM-dd");
    const end = format(endOfYear(new Date(year, 0, 1)), "yyyy-MM-dd");
    const balances = await fetchAccountBalances(start, end);

    const revenue = balances
      .filter((b) => b.accountType === "revenue")
      .reduce((s, b) => s + Math.abs(b.balance), 0);
    const expenses = balances
      .filter((b) => b.accountType === "expense")
      .reduce((s, b) => s + Math.abs(b.balance), 0);

    setProfit(revenue - expenses);
    setLoading(false);
  }, [orgId, year, fetchAccountBalances]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const save = useCallback(
    async (updated: TaxDeduction) => {
      if (!orgId) return;
      setSaving(true);

      const payload = {
        organization_id: orgId,
        year: updated.year,
        zelfstandigenaftrek_enabled: updated.zelfstandigenaftrek_enabled,
        zelfstandigenaftrek_amount: updated.zelfstandigenaftrek_amount,
        startersaftrek_enabled: updated.startersaftrek_enabled,
        startersaftrek_amount: updated.startersaftrek_amount,
        mkb_winstvrijstelling_enabled: updated.mkb_winstvrijstelling_enabled,
        mkb_winstvrijstelling_percentage: updated.mkb_winstvrijstelling_percentage,
        meewerkaftrek_enabled: updated.meewerkaftrek_enabled,
        meewerkaftrek_amount: updated.meewerkaftrek_amount,
        stakingsaftrek_enabled: updated.stakingsaftrek_enabled,
        stakingsaftrek_amount: updated.stakingsaftrek_amount,
        for_enabled: updated.for_enabled,
        for_percentage: updated.for_percentage,
        for_max_amount: updated.for_max_amount,
        notes: updated.notes,
      };

      if (updated.id) {
        await supabase
          .from("tax_deductions")
          .update(payload)
          .eq("id", updated.id);
      } else {
        const { data } = await supabase
          .from("tax_deductions")
          .insert(payload)
          .select("id")
          .single();
        if (data) {
          setDeduction((d) => ({ ...d, id: data.id }));
        }
      }

      setDeduction(updated);
      setSaving(false);
    },
    [orgId]
  );

  // Calculate taxable profit
  const totalDeductions = (() => {
    let total = 0;
    if (deduction.zelfstandigenaftrek_enabled) total += deduction.zelfstandigenaftrek_amount;
    if (deduction.startersaftrek_enabled) total += deduction.startersaftrek_amount;
    if (deduction.meewerkaftrek_enabled) total += deduction.meewerkaftrek_amount;
    if (deduction.stakingsaftrek_enabled) total += deduction.stakingsaftrek_amount;

    const afterFixed = Math.max(0, profit - total);

    if (deduction.for_enabled) {
      const forAmount = Math.min(
        afterFixed * (deduction.for_percentage / 100),
        deduction.for_max_amount
      );
      total += forAmount;
    }

    const afterFor = Math.max(0, profit - total);

    if (deduction.mkb_winstvrijstelling_enabled) {
      total += afterFor * (deduction.mkb_winstvrijstelling_percentage / 100);
    }

    return total;
  })();

  const taxableProfit = Math.max(0, profit - totalDeductions);

  return {
    deduction,
    setDeduction,
    profit,
    totalDeductions,
    taxableProfit,
    loading,
    saving,
    save,
    refetch: fetchData,
  };
}
