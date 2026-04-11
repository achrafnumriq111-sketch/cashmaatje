import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export interface DeductiblePremium {
  id?: string;
  organization_id?: string;
  year: number;
  premium_type: string;
  name: string;
  amount: number;
  is_active: boolean;
  notes: string | null;
}

export function useDeductiblePremiums(year: number) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [premiums, setPremiums] = useState<DeductiblePremium[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("deductible_premiums")
      .select("*")
      .eq("organization_id", orgId)
      .eq("year", year)
      .order("created_at", { ascending: true });

    setPremiums(
      (data || []).map((d: any) => ({
        id: d.id,
        organization_id: d.organization_id,
        year: d.year,
        premium_type: d.premium_type,
        name: d.name,
        amount: Number(d.amount),
        is_active: d.is_active,
        notes: d.notes,
      }))
    );
    setLoading(false);
  }, [orgId, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = useCallback(async (premium: DeductiblePremium) => {
    if (!orgId) return;
    setSaving(true);
    const payload = {
      organization_id: orgId,
      year: premium.year,
      premium_type: premium.premium_type,
      name: premium.name,
      amount: premium.amount,
      is_active: premium.is_active,
      notes: premium.notes,
    };

    if (premium.id) {
      await supabase.from("deductible_premiums").update(payload).eq("id", premium.id);
    } else {
      await supabase.from("deductible_premiums").insert(payload);
    }
    setSaving(false);
    await fetchData();
  }, [orgId, fetchData]);

  const remove = useCallback(async (id: string) => {
    await supabase.from("deductible_premiums").delete().eq("id", id);
    await fetchData();
  }, [fetchData]);

  const annualTotal = premiums
    .filter((p) => p.is_active)
    .reduce((sum, p) => sum + p.amount, 0);

  return { premiums, loading, saving, save, remove, annualTotal, refetch: fetchData };
}
