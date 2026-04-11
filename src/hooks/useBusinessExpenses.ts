import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export interface BusinessExpense {
  id?: string;
  organization_id?: string;
  year: number;
  name: string;
  category: string;
  frequency: string;
  amount: number;
  is_active: boolean;
  notes: string | null;
}

const CATEGORIES = ["software", "marketing", "kantoor", "huisvesting", "verzekering", "overig"] as const;
const FREQUENCIES = ["maandelijks", "jaarlijks", "eenmalig"] as const;

export type ExpenseCategory = typeof CATEGORIES[number];
export type ExpenseFrequency = typeof FREQUENCIES[number];
export { CATEGORIES, FREQUENCIES };

export function useBusinessExpenses(year: number) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("business_expenses")
      .select("*")
      .eq("organization_id", orgId)
      .eq("year", year)
      .order("created_at", { ascending: true });

    setExpenses(
      (data || []).map((d: any) => ({
        id: d.id,
        organization_id: d.organization_id,
        year: d.year,
        name: d.name,
        category: d.category,
        frequency: d.frequency,
        amount: Number(d.amount),
        is_active: d.is_active,
        notes: d.notes,
      }))
    );
    setLoading(false);
  }, [orgId, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = useCallback(async (expense: BusinessExpense) => {
    if (!orgId) return;
    setSaving(true);
    const payload = {
      organization_id: orgId,
      year: expense.year,
      name: expense.name,
      category: expense.category,
      frequency: expense.frequency,
      amount: expense.amount,
      is_active: expense.is_active,
      notes: expense.notes,
    };

    if (expense.id) {
      await supabase.from("business_expenses").update(payload).eq("id", expense.id);
    } else {
      await supabase.from("business_expenses").insert(payload);
    }
    setSaving(false);
    await fetchData();
  }, [orgId, fetchData]);

  const remove = useCallback(async (id: string) => {
    await supabase.from("business_expenses").delete().eq("id", id);
    await fetchData();
  }, [fetchData]);

  // Calculate annual total
  const annualTotal = expenses
    .filter((e) => e.is_active)
    .reduce((sum, e) => {
      if (e.frequency === "maandelijks") return sum + e.amount * 12;
      return sum + e.amount;
    }, 0);

  return { expenses, loading, saving, save, remove, annualTotal, refetch: fetchData };
}
