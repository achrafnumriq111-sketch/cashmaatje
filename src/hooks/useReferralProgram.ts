import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { getStripeEnvironment } from "@/lib/stripe";
import { buildReferralUrl } from "@/lib/referralCapture";
import { toast } from "sonner";

const BASE_PRICE_CENTS = 2599;
const MAX_REFERRALS = 10;
const MIN_PRICE_CENTS = 1599;

export interface ReferralRow {
  id: string;
  referred_organization_id: string | null;
  referred_user_id: string | null;
  referral_code: string;
  status: "pending" | "first_payment_received" | "active" | "inactive" | "cancelled" | "rejected";
  first_payment_at: string | null;
  activated_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  referred_org_name?: string | null;
}

export interface ReferralDiscountSummary {
  basePriceCents: number;
  activeReferrals: number;
  countedReferrals: number;
  maxReferrals: number;
  discountCents: number;
  finalMonthlyPriceCents: number;
  nextReferralPriceCents: number;
  progressPercentage: number;
  referralCode: string | null;
  referralUrl: string | null;
}

export function useReferralProgram() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId ?? null;
  const qc = useQueryClient();

  // 1. Referral link (auto-create indien nodig)
  const linkQuery = useQuery({
    queryKey: ["referral-link", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase.rpc("get_or_create_referral_link", {
        p_org_id: orgId,
      });
      if (error) throw error;
      return data as { id: string; code: string; organization_id: string } | null;
    },
    enabled: !!orgId,
  });

  // 2. Discount snapshot (live)
  const discountQuery = useQuery({
    queryKey: ["referral-discount", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase.rpc("calculate_referral_discount", {
        p_org_id: orgId,
      });
      if (error) throw error;
      return data as {
        active_referrals: number;
        counted_referrals: number;
        max_referrals: number;
        base_price_cents: number;
        discount_cents: number;
        final_price_cents: number;
        next_referral_price_cents: number;
      } | null;
    },
    enabled: !!orgId,
  });

  // 3. Referral lijst
  const referralsQuery = useQuery({
    queryKey: ["referrals", orgId],
    queryFn: async () => {
      if (!orgId) return [] as ReferralRow[];
      const { data, error } = await supabase
        .from("referrals")
        .select("*, referred_org:organizations!referrals_referred_organization_id_fkey(name)")
        .eq("referrer_organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        referred_org_name: r.referred_org?.name ?? null,
      })) as ReferralRow[];
    },
    enabled: !!orgId,
  });

  // Realtime: refetch wanneer referrals/snapshots veranderen voor deze org
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`referral-${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "referrals", filter: `referrer_organization_id=eq.${orgId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["referrals", orgId] });
          qc.invalidateQueries({ queryKey: ["referral-discount", orgId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "referral_discount_snapshots", filter: `organization_id=eq.${orgId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["referral-discount", orgId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, qc]);

  const recalc = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Geen actieve organisatie");
      const { data, error } = await supabase.functions.invoke("recalculate-referral-discount", {
        body: { organization_id: orgId, environment: getStripeEnvironment() },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-discount", orgId] });
      toast.success("Korting opnieuw berekend");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const calc = discountQuery.data;
  const code = linkQuery.data?.code ?? null;

  const summary: ReferralDiscountSummary = {
    basePriceCents: calc?.base_price_cents ?? BASE_PRICE_CENTS,
    activeReferrals: calc?.active_referrals ?? 0,
    countedReferrals: calc?.counted_referrals ?? 0,
    maxReferrals: calc?.max_referrals ?? MAX_REFERRALS,
    discountCents: calc?.discount_cents ?? 0,
    finalMonthlyPriceCents: calc?.final_price_cents ?? BASE_PRICE_CENTS,
    nextReferralPriceCents:
      calc?.next_referral_price_cents ??
      Math.max(BASE_PRICE_CENTS - 100, MIN_PRICE_CENTS),
    progressPercentage: Math.min(
      100,
      ((calc?.counted_referrals ?? 0) / MAX_REFERRALS) * 100
    ),
    referralCode: code,
    referralUrl: code ? buildReferralUrl(code) : null,
  };

  return {
    summary,
    referrals: referralsQuery.data ?? [],
    isLoading: linkQuery.isLoading || discountQuery.isLoading,
    isReferralsLoading: referralsQuery.isLoading,
    recalc,
    refetch: () => {
      qc.invalidateQueries({ queryKey: ["referral-link", orgId] });
      qc.invalidateQueries({ queryKey: ["referral-discount", orgId] });
      qc.invalidateQueries({ queryKey: ["referrals", orgId] });
    },
  };
}

export function formatEuro(cents: number): string {
  return (cents / 100).toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}
