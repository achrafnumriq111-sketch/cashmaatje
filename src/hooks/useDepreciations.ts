import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export interface Depreciation {
  id?: string;
  organization_id?: string;
  name: string;
  purchase_date: string;
  purchase_amount: number;
  residual_value: number;
  useful_life_years: number;
  depreciation_method: string;
  notes: string | null;
}

export function getAnnualDepreciation(d: Depreciation): number {
  if (d.useful_life_years <= 0) return 0;
  return (d.purchase_amount - d.residual_value) / d.useful_life_years;
}

export function getDepreciationForYear(d: Depreciation, year: number): number {
  const startYear = new Date(d.purchase_date).getFullYear();
  const endYear = startYear + d.useful_life_years - 1;
  if (year < startYear || year > endYear) return 0;
  return getAnnualDepreciation(d);
}

export function useDepreciations() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [items, setItems] = useState<Depreciation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("depreciations")
      .select("*")
      .eq("organization_id", orgId)
      .order("purchase_date", { ascending: false });

    setItems(
      (data || []).map((d: any) => ({
        id: d.id,
        organization_id: d.organization_id,
        name: d.name,
        purchase_date: d.purchase_date,
        purchase_amount: Number(d.purchase_amount),
        residual_value: Number(d.residual_value),
        useful_life_years: d.useful_life_years,
        depreciation_method: d.depreciation_method,
        notes: d.notes,
      }))
    );
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = useCallback(async (item: Depreciation) => {
    if (!orgId) return;
    setSaving(true);
    const payload = {
      organization_id: orgId,
      name: item.name,
      purchase_date: item.purchase_date,
      purchase_amount: item.purchase_amount,
      residual_value: item.residual_value,
      useful_life_years: item.useful_life_years,
      depreciation_method: item.depreciation_method,
      notes: item.notes,
    };

    if (item.id) {
      await supabase.from("depreciations").update(payload).eq("id", item.id);
    } else {
      await supabase.from("depreciations").insert(payload);
    }
    setSaving(false);
    await fetchData();
  }, [orgId, fetchData]);

  const remove = useCallback(async (id: string) => {
    await supabase.from("depreciations").delete().eq("id", id);
    await fetchData();
  }, [fetchData]);

  const totalForYear = useCallback((year: number) => {
    return items.reduce((sum, d) => sum + getDepreciationForYear(d, year), 0);
  }, [items]);

  return { items, loading, saving, save, remove, totalForYear, refetch: fetchData };
}
