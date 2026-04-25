import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useOrganization } from "@/hooks/useOrganization";
import { Loader2 } from "lucide-react";

/**
 * Hard paywall: if a user has an organization but no active subscription,
 * route them to /pricing. The only routes that bypass this gate are the
 * pricing page, checkout return, settings (so they can manage billing),
 * and onboarding.
 */
const ALLOWED_WITHOUT_SUBSCRIPTION = [
  "/pricing",
  "/checkout/return",
  "/onboarding",
  "/2fa/setup",
  "/2fa/verify",
  "/2fa/recovery",
  "/instellingen", // user can still reach settings to manage account
];

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const sub = useSubscription();
  const { membership, loading: orgLoading } = useOrganization();

  // Wait for org + subscription to load
  if (orgLoading || sub.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No org yet → onboarding flow handles it
  if (!membership) return <>{children}</>;

  // Demo organisations bypass the paywall entirely
  if ((membership.organization as any)?.is_demo) return <>{children}</>;

  // Active subscription → free pass
  if (sub.isActive) return <>{children}</>;

  // Allowed routes (pricing, settings, etc.) render normally
  const isAllowed = ALLOWED_WITHOUT_SUBSCRIPTION.some((p) =>
    location.pathname === p || location.pathname.startsWith(p + "/")
  );
  if (isAllowed) return <>{children}</>;

  // Otherwise: hard redirect to pricing
  return <Navigate to="/pricing" replace state={{ from: location.pathname }} />;
}
