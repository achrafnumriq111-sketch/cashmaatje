// Determine which Stripe environment we're in.
// .env.development is set to "sandbox" by Lovable; production uses "live".
export function getStripeEnvironment(): "sandbox" | "live" {
  // import.meta.env.MODE is "development" in preview, "production" in published.
  if (import.meta.env.MODE === "production") return "live";
  return "sandbox";
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
