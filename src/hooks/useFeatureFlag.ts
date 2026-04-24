import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

/**
 * Resolve a feature flag for the current organization.
 * Honors per-org overrides, internal-test-org auto-grant, global enable, and rollout %.
 */
export function useFeatureFlag(key: string) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId ?? null;

  const query = useQuery({
    queryKey: ["feature_flag", key, orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_feature_enabled" as any, {
        _feature_key: key,
        _org_id: orgId,
      });
      if (error) {
        console.error("feature flag error", key, error);
        return false;
      }
      return Boolean(data);
    },
    staleTime: 60_000,
  });

  return { enabled: query.data ?? false, isLoading: query.isLoading };
}
