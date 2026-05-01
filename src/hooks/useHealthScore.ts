import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "./useOrganization";
import { calculateHealthScore } from "@/lib/healthScore";

export function useHealthScore() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  return useQuery({
    queryKey: ["health-score", orgId],
    queryFn: () => calculateHealthScore(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60_000,
  });
}
