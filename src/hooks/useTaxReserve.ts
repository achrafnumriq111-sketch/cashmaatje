import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "./useOrganization";
import { calculateTaxReserve } from "@/lib/taxReserve";

export function useTaxReserve() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["tax-reserve", orgId],
    queryFn: () => calculateTaxReserve(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}
