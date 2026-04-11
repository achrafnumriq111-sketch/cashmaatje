import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export interface CompanyCar {
  id?: string;
  organization_id?: string;
  year: number;
  car_name: string;
  catalog_value: number;
  addition_percentage: number;
  use_km_allowance: boolean;
  km_per_year: number;
  km_rate: number;
  fixed_costs: number;
  maintenance_costs: number;
  fuel_costs: number;
  is_active: boolean;
  notes: string | null;
}

export function getCarNetEffect(car: CompanyCar): number {
  if (!car.is_active) return 0;
  const totalCosts = car.fixed_costs + car.maintenance_costs + car.fuel_costs;
  if (car.use_km_allowance) {
    return car.km_per_year * car.km_rate + totalCosts;
  }
  // Bijtelling = catalog_value * addition_percentage (this is taxable income added)
  const bijtelling = car.catalog_value * (car.addition_percentage / 100);
  return totalCosts - bijtelling; // negative means net cost increase via bijtelling
}

export function useCompanyCar(year: number) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [cars, setCars] = useState<CompanyCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("company_car")
      .select("*")
      .eq("organization_id", orgId)
      .eq("year", year)
      .order("created_at", { ascending: true });

    setCars(
      (data || []).map((d: any) => ({
        id: d.id,
        organization_id: d.organization_id,
        year: d.year,
        car_name: d.car_name,
        catalog_value: Number(d.catalog_value),
        addition_percentage: Number(d.addition_percentage),
        use_km_allowance: d.use_km_allowance,
        km_per_year: d.km_per_year || 0,
        km_rate: Number(d.km_rate),
        fixed_costs: Number(d.fixed_costs),
        maintenance_costs: Number(d.maintenance_costs),
        fuel_costs: Number(d.fuel_costs),
        is_active: d.is_active,
        notes: d.notes,
      }))
    );
    setLoading(false);
  }, [orgId, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = useCallback(async (car: CompanyCar) => {
    if (!orgId) return;
    setSaving(true);
    const payload = {
      organization_id: orgId,
      year: car.year,
      car_name: car.car_name,
      catalog_value: car.catalog_value,
      addition_percentage: car.addition_percentage,
      use_km_allowance: car.use_km_allowance,
      km_per_year: car.km_per_year,
      km_rate: car.km_rate,
      fixed_costs: car.fixed_costs,
      maintenance_costs: car.maintenance_costs,
      fuel_costs: car.fuel_costs,
      is_active: car.is_active,
      notes: car.notes,
    };

    if (car.id) {
      await supabase.from("company_car").update(payload).eq("id", car.id);
    } else {
      await supabase.from("company_car").insert(payload);
    }
    setSaving(false);
    await fetchData();
  }, [orgId, fetchData]);

  const remove = useCallback(async (id: string) => {
    await supabase.from("company_car").delete().eq("id", id);
    await fetchData();
  }, [fetchData]);

  const totalBijtelling = cars
    .filter((c) => c.is_active && !c.use_km_allowance)
    .reduce((sum, c) => sum + c.catalog_value * (c.addition_percentage / 100), 0);

  const totalCarCosts = cars
    .filter((c) => c.is_active)
    .reduce((sum, c) => sum + c.fixed_costs + c.maintenance_costs + c.fuel_costs, 0);

  return { cars, loading, saving, save, remove, totalBijtelling, totalCarCosts, refetch: fetchData };
}
