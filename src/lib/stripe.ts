import { loadStripe, Stripe } from "@stripe/stripe-js";

// Determine which Stripe environment we're in.
type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
const environment: StripeEnv = clientToken?.startsWith("pk_test_") ? "sandbox" : "live";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    if (!clientToken) {
      throw new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set");
    }
    stripePromise = loadStripe(clientToken);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return environment;
}

// Single plan: €25,99/maand met referral-korting (zie referral_discount logica).
export const CASHMAATJE_PRICE_ID = "cashmaatje_monthly" as const;
export const CASHMAATJE_BASE_PRICE_CENTS = 2599;
export const CASHMAATJE_MIN_PRICE_CENTS = 1599;
export const CASHMAATJE_DISCOUNT_PER_REF_CENTS = 100;
export const CASHMAATJE_MAX_REFERRALS = 10;

// Entity add-on: vaste prijs €15,99/mnd per extra entiteit. Geen referral korting.
export const ENTITY_ADDON_PRICE_ID = "entity_addon_monthly" as const;
export const ENTITY_ADDON_PRICE_CENTS = 1599;

// Backwards-compat alias — alle oude price IDs verwijzen nu naar het nieuwe plan.
export const PLAN_PRICE_IDS = {
  cashmaatje: CASHMAATJE_PRICE_ID,
} as const;

export type PlanTier = "cashmaatje";

export function tierFromPriceId(priceId: string | null | undefined): PlanTier | null {
  if (!priceId) return null;
  return "cashmaatje";
}
