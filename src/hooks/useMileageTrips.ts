import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export type TripType = "business" | "commute" | "private";

export interface MileageTrip {
  id?: string;
  organization_id?: string;
  trip_date: string; // YYYY-MM-DD
  from_address: string;
  to_address: string;
  from_lat?: number | null;
  from_lng?: number | null;
  to_lat?: number | null;
  to_lng?: number | null;
  km: number;
  return_trip: boolean;
  trip_type: TripType;
  purpose?: string | null;
  contact_id?: string | null;
  vehicle_id?: string | null;
  source?: string;
  route_id?: string | null;
}

export interface MileageRoute {
  id?: string;
  organization_id?: string;
  name: string;
  from_address: string;
  to_address: string;
  km: number;
  default_trip_type: TripType;
  default_contact_id?: string | null;
}

// Forfaitair tarief 2026 voor zakelijke kilometers met privé-auto
export const KM_RATE_BUSINESS = 0.23;

export function useMileageTrips(year: number) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [trips, setTrips] = useState<MileageTrip[]>([]);
  const [routes, setRoutes] = useState<MileageRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const [tripsRes, routesRes] = await Promise.all([
      supabase
        .from("mileage_trips")
        .select("*")
        .eq("organization_id", orgId)
        .gte("trip_date", start)
        .lte("trip_date", end)
        .order("trip_date", { ascending: false }),
      supabase
        .from("mileage_routes")
        .select("*")
        .eq("organization_id", orgId)
        .order("name", { ascending: true }),
    ]);
    setTrips((tripsRes.data ?? []) as any);
    setRoutes((routesRes.data ?? []) as any);
    setLoading(false);
  }, [orgId, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveTrip = useCallback(
    async (trip: MileageTrip) => {
      if (!orgId) return;
      setSaving(true);
      const effectiveKm = trip.return_trip ? trip.km * 2 : trip.km;
      const payload: any = {
        organization_id: orgId,
        trip_date: trip.trip_date,
        from_address: trip.from_address,
        to_address: trip.to_address,
        from_lat: trip.from_lat ?? null,
        from_lng: trip.from_lng ?? null,
        to_lat: trip.to_lat ?? null,
        to_lng: trip.to_lng ?? null,
        km: effectiveKm,
        return_trip: trip.return_trip,
        trip_type: trip.trip_type,
        purpose: trip.purpose ?? null,
        contact_id: trip.contact_id ?? null,
        vehicle_id: trip.vehicle_id ?? null,
        source: trip.source ?? "manual",
        route_id: trip.route_id ?? null,
      };
      if (trip.id) {
        await supabase.from("mileage_trips").update(payload).eq("id", trip.id);
      } else {
        await supabase.from("mileage_trips").insert(payload);
      }
      setSaving(false);
      await fetchData();
    },
    [orgId, fetchData]
  );

  const deleteTrip = useCallback(
    async (id: string) => {
      await supabase.from("mileage_trips").delete().eq("id", id);
      await fetchData();
    },
    [fetchData]
  );

  const saveRoute = useCallback(
    async (route: MileageRoute) => {
      if (!orgId) return;
      const payload: any = {
        organization_id: orgId,
        name: route.name,
        from_address: route.from_address,
        to_address: route.to_address,
        km: route.km,
        default_trip_type: route.default_trip_type,
        default_contact_id: route.default_contact_id ?? null,
      };
      if (route.id) {
        await supabase.from("mileage_routes").update(payload).eq("id", route.id);
      } else {
        await supabase.from("mileage_routes").insert(payload);
      }
      await fetchData();
    },
    [orgId, fetchData]
  );

  const deleteRoute = useCallback(
    async (id: string) => {
      await supabase.from("mileage_routes").delete().eq("id", id);
      await fetchData();
    },
    [fetchData]
  );

  const totals = {
    business: trips.filter((t) => t.trip_type === "business").reduce((s, t) => s + Number(t.km), 0),
    commute: trips.filter((t) => t.trip_type === "commute").reduce((s, t) => s + Number(t.km), 0),
    private: trips.filter((t) => t.trip_type === "private").reduce((s, t) => s + Number(t.km), 0),
    total: trips.reduce((s, t) => s + Number(t.km), 0),
  };
  const businessDeduction = totals.business * KM_RATE_BUSINESS;

  return {
    trips,
    routes,
    loading,
    saving,
    saveTrip,
    deleteTrip,
    saveRoute,
    deleteRoute,
    totals,
    businessDeduction,
    refetch: fetchData,
  };
}
