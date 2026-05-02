import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { BenefitsInput } from "@/lib/benefits/calculations";

export interface BenefitsProfile {
  user_id?: string;
  birth_year: number | null;
  has_partner: boolean;
  partner_birth_year: number | null;
  partner_yearly_income: number;
  num_children: number;
  children_ages: number[];
  rent_type: "social" | "private" | "none";
  monthly_rent: number;
  monthly_service_costs: number;
  has_childcare: boolean;
  childcare_hours_per_month: number;
  childcare_hourly_rate: number;
  total_assets: number;
  health_insurance_yearly: number;
  income_override: number | null;
  notes: string | null;
}

const defaultProfile: BenefitsProfile = {
  birth_year: null,
  has_partner: false,
  partner_birth_year: null,
  partner_yearly_income: 0,
  num_children: 0,
  children_ages: [],
  rent_type: "none",
  monthly_rent: 0,
  monthly_service_costs: 0,
  has_childcare: false,
  childcare_hours_per_month: 0,
  childcare_hourly_rate: 0,
  total_assets: 0,
  health_insurance_yearly: 0,
  income_override: null,
  notes: null,
};

export function useBenefitsProfile() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [profile, setProfile] = useState<BenefitsProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("benefits_profile")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) {
      setProfile({
        ...defaultProfile,
        ...(data as any),
        children_ages: Array.isArray((data as any).children_ages)
          ? ((data as any).children_ages as number[])
          : [],
      });
    } else {
      setProfile(defaultProfile);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const save = useCallback(
    async (next: BenefitsProfile) => {
      if (!userId) return;
      setSaving(true);
      const payload: any = {
        user_id: userId,
        birth_year: next.birth_year,
        has_partner: next.has_partner,
        partner_birth_year: next.partner_birth_year,
        partner_yearly_income: next.partner_yearly_income,
        num_children: next.num_children,
        children_ages: next.children_ages,
        rent_type: next.rent_type,
        monthly_rent: next.monthly_rent,
        monthly_service_costs: next.monthly_service_costs,
        has_childcare: next.has_childcare,
        childcare_hours_per_month: next.childcare_hours_per_month,
        childcare_hourly_rate: next.childcare_hourly_rate,
        total_assets: next.total_assets,
        health_insurance_yearly: next.health_insurance_yearly,
        income_override: next.income_override,
        notes: next.notes,
      };
      await supabase.from("benefits_profile").upsert(payload, { onConflict: "user_id" });
      setProfile(next);
      setSaving(false);
    },
    [userId]
  );

  return { profile, setProfile, save, loading, saving };
}

export function profileToInput(
  profile: BenefitsProfile,
  fallbackIncome: number,
  year: number
): BenefitsInput {
  const age = profile.birth_year ? year - profile.birth_year : 30;
  const partnerAge = profile.partner_birth_year ? year - profile.partner_birth_year : undefined;
  return {
    year,
    income: profile.income_override ?? fallbackIncome,
    hasPartner: profile.has_partner,
    partnerIncome: profile.partner_yearly_income,
    age,
    partnerAge,
    numChildren: profile.num_children,
    childrenAges: profile.children_ages,
    rentType: profile.rent_type,
    monthlyRent: profile.monthly_rent,
    monthlyServiceCosts: profile.monthly_service_costs,
    hasChildcare: profile.has_childcare,
    childcareHoursPerMonth: profile.childcare_hours_per_month,
    childcareHourlyRate: profile.childcare_hourly_rate,
    totalAssets: profile.total_assets,
  };
}
