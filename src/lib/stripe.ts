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

export const PLAN_PRICE_IDS = {
  start: "start_monthly",
  smart: "smart_monthly",
  pro: "pro_monthly",
} as const;

export type PlanTier = keyof typeof PLAN_PRICE_IDS;

export function tierFromPriceId(priceId: string | null | undefined): PlanTier | null {
  if (!priceId) return null;
  if (priceId.startsWith("start")) return "start";
  if (priceId.startsWith("smart")) return "smart";
  if (priceId.startsWith("pro")) return "pro";
  return null;
}
