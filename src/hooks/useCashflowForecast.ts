import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "./useOrganization";
import { buildCashflowForecast } from "@/lib/cashflowForecast";

export function useCashflowForecast(horizon: 30 | 60 | 90) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["cashflow-forecast", orgId, horizon],
    queryFn: () => buildCashflowForecast(orgId!, horizon),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}
