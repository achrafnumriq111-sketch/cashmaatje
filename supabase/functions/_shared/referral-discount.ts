// Shared referral discount sync helpers
// Used by payments-webhook and recalculate-referral-discount.

import { createStripeClient, type StripeEnv } from "./stripe.ts";

export interface DiscountCalc {
  active_referrals: number;
  counted_referrals: number;
  base_price_cents: number;
  discount_cents: number;
  final_price_cents: number;
}

export async function recalcAndSyncForOrg(opts: {
  admin: any;
  env: StripeEnv;
  organizationId: string;
  reason: string;
}): Promise<DiscountCalc | null> {
  const { admin, env, organizationId, reason } = opts;

  // 1. Bereken nieuwe discount via DB
  const { data: calcRaw, error: calcErr } = await admin.rpc(
    "calculate_referral_discount",
    { p_org_id: organizationId }
  );
  if (calcErr) {
    console.error("calc rpc error", calcErr);
    return null;
  }
  const calc = calcRaw as DiscountCalc;

  // 2. Vind het abonnement van de eigenaar van deze organisatie
  const { data: ownerMember } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("is_owner", true)
    .limit(1)
    .maybeSingle();

  let stripeCustomerId: string | null = null;
  let stripeSubscriptionId: string | null = null;
  let syncStatus = "no_subscription";
  let syncError: string | null = null;

  if (ownerMember?.user_id) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status")
      .eq("user_id", ownerMember.user_id)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    stripeCustomerId = sub?.stripe_customer_id ?? null;
    stripeSubscriptionId = sub?.stripe_subscription_id ?? null;

    if (sub && ["active", "trialing", "past_due"].includes(sub.status) && stripeSubscriptionId) {
      try {
        await syncStripeCoupon({
          env,
          admin,
          organizationId,
          stripeSubscriptionId,
          discountCents: calc.discount_cents,
          countedReferrals: calc.counted_referrals,
        });
        syncStatus = calc.discount_cents > 0 ? "coupon_applied" : "coupon_removed";
      } catch (e) {
        syncError = e instanceof Error ? e.message : String(e);
        syncStatus = "sync_failed";
        console.error("Stripe coupon sync failed", syncError);
      }
    }
  }

  // 3. Snapshot opslaan
  await admin.from("referral_discount_snapshots").insert({
    organization_id: organizationId,
    active_referrals_count: calc.active_referrals,
    counted_referrals_count: calc.counted_referrals,
    base_price_cents: calc.base_price_cents,
    discount_cents: calc.discount_cents,
    final_price_cents: calc.final_price_cents,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    notes: `${reason} | sync=${syncStatus}${syncError ? " | err=" + syncError : ""}`,
  });

  return calc;
}

async function syncStripeCoupon(opts: {
  env: StripeEnv;
  admin: any;
  organizationId: string;
  stripeSubscriptionId: string;
  discountCents: number;
  countedReferrals: number;
}) {
  const stripe = createStripeClient(opts.env);

  // 1. Haal huidige org-coupon op
  const { data: org } = await opts.admin
    .from("organizations")
    .select("stripe_coupon_id")
    .eq("id", opts.organizationId)
    .maybeSingle();

  const currentCouponId: string | null = org?.stripe_coupon_id ?? null;

  // Geen korting → eventueel aangehechte coupon verwijderen
  if (opts.discountCents <= 0) {
    if (currentCouponId) {
      try {
        await stripe.subscriptions.update(opts.stripeSubscriptionId, {
          coupon: "",
        } as any);
      } catch (e) {
        // Sommige API-versies vragen om discounts: deletePromotionCode
        try {
          await stripe.subscriptions.deleteDiscount(opts.stripeSubscriptionId);
        } catch {/* noop */}
      }
      try {
        await stripe.coupons.del(currentCouponId);
      } catch {/* coupon kan al weg zijn */}
      await opts.admin
        .from("organizations")
        .update({ stripe_coupon_id: null })
        .eq("id", opts.organizationId);
    }
    return;
  }

  // Wel korting → maak nieuwe coupon met juiste amount_off (idempotent: oude verwijderen daarna)
  const newCoupon = await stripe.coupons.create({
    name: `Cash Maatje Referral Discount - ${opts.countedReferrals} referrals`,
    amount_off: opts.discountCents,
    currency: "eur",
    duration: "forever",
    metadata: {
      organization_id: opts.organizationId,
      counted_referrals: String(opts.countedReferrals),
      lovable_managed: "referral_discount",
    },
  });

  await stripe.subscriptions.update(opts.stripeSubscriptionId, {
    coupon: newCoupon.id,
  });

  await opts.admin
    .from("organizations")
    .update({ stripe_coupon_id: newCoupon.id })
    .eq("id", opts.organizationId);

  // Oude coupon opruimen na switch
  if (currentCouponId && currentCouponId !== newCoupon.id) {
    try {
      await stripe.coupons.del(currentCouponId);
    } catch {/* ignore */}
  }
}

/**
 * Probeer een referral te activeren bij eerste succesvolle betaling.
 * Idempotent: zet status naar 'active' alleen als hij nog pending of first_payment_received was.
 */
export async function activateReferralForCustomer(opts: {
  admin: any;
  env: StripeEnv;
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  userId?: string | null;
}): Promise<{ activated: boolean; referrerOrgId: string | null }> {
  const { admin, stripeCustomerId, stripeSubscriptionId, userId } = opts;

  // Zoek referral op customer of via user
  let { data: ref } = await admin
    .from("referrals")
    .select("*")
    .eq("stripe_customer_id", stripeCustomerId)
    .limit(1)
    .maybeSingle();

  if (!ref && userId) {
    const { data: byUser } = await admin
      .from("referrals")
      .select("*")
      .eq("referred_user_id", userId)
      .limit(1)
      .maybeSingle();
    ref = byUser;
  }

  if (!ref) return { activated: false, referrerOrgId: null };

  const updates: Record<string, unknown> = {
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId ?? ref.stripe_subscription_id,
  };

  if (ref.status === "pending" || ref.status === "first_payment_received") {
    updates.first_payment_at = ref.first_payment_at ?? new Date().toISOString();
    updates.activated_at = new Date().toISOString();
    updates.status = "active";
  }

  await admin.from("referrals").update(updates).eq("id", ref.id);

  return {
    activated: ref.status !== "active",
    referrerOrgId: ref.referrer_organization_id,
  };
}

export async function deactivateReferralForSubscription(opts: {
  admin: any;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  newStatus: "cancelled" | "inactive";
}): Promise<{ referrerOrgId: string | null }> {
  const { admin, stripeSubscriptionId, stripeCustomerId, newStatus } = opts;

  let query = admin.from("referrals").select("*");
  if (stripeSubscriptionId) {
    query = query.eq("stripe_subscription_id", stripeSubscriptionId);
  } else if (stripeCustomerId) {
    query = query.eq("stripe_customer_id", stripeCustomerId);
  } else {
    return { referrerOrgId: null };
  }

  const { data: ref } = await query.limit(1).maybeSingle();
  if (!ref) return { referrerOrgId: null };

  await admin
    .from("referrals")
    .update({
      status: newStatus,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", ref.id);

  return { referrerOrgId: ref.referrer_organization_id };
}
