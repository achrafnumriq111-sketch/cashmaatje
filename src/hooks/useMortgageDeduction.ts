import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export interface MortgageDeduction {
  id?: string;
  organization_id?: string;
  year: number;
  mortgage_interest_annual: number;
  financing_costs: number;
  ground_lease_annual: number;
  woz_value: number;
  eigenwoningforfait_percentage: number;
  notes: string | null;
}

export function getMortgageNetDeduction(m: MortgageDeduction): number {
  const eigenwoningforfait = m.woz_value * m.eigenwoningforfait_percentage;
  const totalDeduction = m.mortgage_interest_annual + m.financing_costs + m.ground_lease_annual;
  return Math.max(0, totalDeduction - eigenwoningforfait);
}

export function useMortgageDeduction(year: number) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [mortgage, setMortgage] = useState<MortgageDeduction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaults: MortgageDeduction = {
    year,
    mortgage_interest_annual: 0,
    financing_costs: 0,
    ground_lease_annual: 0,
    woz_value: 0,
    eigenwoningforfait_percentage: 0.0035,
    notes: null,
  };

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("mortgage_deduction")
      .select("*")
      .eq("organization_id", orgId)
      .eq("year", year)
      .maybeSingle();

    if (data) {
      setMortgage({
        id: data.id,
        organization_id: data.organization_id,
        year: data.year,
        mortgage_interest_annual: Number(data.mortgage_interest_annual),
        financing_costs: Number(data.financing_costs),
        ground_lease_annual: Number(data.ground_lease_annual),
        woz_value: Number(data.woz_value),
        eigenwoningforfait_percentage: Number(data.eigenwoningforfait_percentage),
        notes: data.notes,
      });
    } else {
      setMortgage(null);
    }
    setLoading(false);
  }, [orgId, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = useCallback(async (m: MortgageDeduction) => {
    if (!orgId) return;
    setSaving(true);
    const payload = {
      organization_id: orgId,
      year: m.year,
      mortgage_interest_annual: m.mortgage_interest_annual,
      financing_costs: m.financing_costs,
      ground_lease_annual: m.ground_lease_annual,
      woz_value: m.woz_value,
      eigenwoningforfait_percentage: m.eigenwoningforfait_percentage,
      notes: m.notes,
    };

    if (m.id) {
      await supabase.from("mortgage_deduction").update(payload).eq("id", m.id);
    } else {
      const { data } = await supabase.from("mortgage_deduction").insert(payload).select("id").single();
      if (data) setMortgage((prev) => prev ? { ...prev, id: data.id } : null);
    }
    setMortgage(m);
    setSaving(false);
  }, [orgId]);

  const netDeduction = mortgage ? getMortgageNetDeduction(mortgage) : 0;

  return { mortgage: mortgage || defaults, setMortgage, loading, saving, save, netDeduction, refetch: fetchData };
}
