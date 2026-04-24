import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getStripeEnvironment, tierFromPriceId, type PlanTier } from "@/lib/stripe";

export interface SubscriptionState {
  isActive: boolean;
  tier: PlanTier | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

const EMPTY: SubscriptionState = {
  isActive: false,
  tier: null,
  status: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

export function useSubscription() {
  const { user } = useAuth();
  const env = getStripeEnvironment();

  const query = useQuery({
    queryKey: ["subscription", user?.id, env],
    queryFn: async (): Promise<SubscriptionState> => {
      if (!user) return EMPTY;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("subscription fetch error", error);
        return EMPTY;
      }
      if (!data) return EMPTY;
      const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;
      const periodOk = !periodEnd || periodEnd > new Date();
      const isActive =
        (["active", "trialing", "past_due"].includes(data.status) && periodOk) ||
        (data.status === "canceled" && periodEnd !== null && periodEnd > new Date());
      return {
        isActive,
        tier: tierFromPriceId(data.price_id),
        status: data.status,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: !!data.cancel_at_period_end,
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
      };
    },
    enabled: !!user,
  });

  // Realtime: refetch when this user's subscription row changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subscription-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => query.refetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { ...(query.data ?? EMPTY), isLoading: query.isLoading, refetch: query.refetch };
}
