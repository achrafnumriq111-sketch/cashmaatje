import { useSubscription } from "@/hooks/useSubscription";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

/**
 * Vereenvoudigd entitlements model — single plan (€25,99/mnd).
 * Active subscriber → alle modules vrij. Internal test orgs → ook vrij.
 * Geen lock overlays meer; alleen subscription gating.
 */
export function useEntitlements() {
  const sub = useSubscription();
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  const { data: isInternalTest } = useQuery({
    queryKey: ["org_internal_test", orgId],
    queryFn: async () => {
      if (!orgId) return false;
      const { data } = await supabase
        .from("organizations")
        .select("is_internal_test_org")
        .eq("id", orgId)
        .maybeSingle();
      return Boolean(data?.is_internal_test_org);
    },
    enabled: !!orgId,
  });

  const hasAccess = sub.isActive || Boolean(isInternalTest);
  const isUnlocked = (_key?: string): boolean => hasAccess;

  return {
    isUnlocked,
    hasAccess,
    isLoading: sub.isLoading,
  };
}
