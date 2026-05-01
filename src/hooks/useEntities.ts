import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { getStripeEnvironment } from "@/lib/stripe";

export interface EntityRow {
  id: string;
  name: string;
  legal_name: string | null;
  org_type: string;
  kvk_number: string | null;
  btw_number: string | null;
  entity_ownership_pct: number | null;
  addon_status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  is_active_addon: boolean;
}

export function useEntities() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const env = getStripeEnvironment();

  const query = useQuery({
    queryKey: ["entities", orgId, env],
    queryFn: async (): Promise<EntityRow[]> => {
      if (!orgId) return [];
      const { data: orgs, error } = await supabase
        .from("organizations")
        .select("id, name, legal_name, org_type, kvk_number, btw_number, entity_ownership_pct")
        .eq("parent_organization_id", orgId);
      if (error) {
        console.error("entities fetch error", error);
        return [];
      }
      if (!orgs?.length) return [];

      const ids = orgs.map((o: any) => o.id);
      const { data: addons } = await supabase
        .from("entity_addons" as any)
        .select("child_organization_id, status, current_period_end, cancel_at_period_end")
        .in("child_organization_id", ids)
        .eq("environment", env);

      const addonByChild = new Map<string, any>(
        (addons ?? []).map((a: any) => [a.child_organization_id, a])
      );

      return orgs.map((o: any): EntityRow => {
        const a = addonByChild.get(o.id);
        const periodOk = !a?.current_period_end || new Date(a.current_period_end) > new Date();
        const isActive =
          (["active", "trialing", "past_due"].includes(a?.status) && periodOk) ||
          (a?.status === "canceled" && a?.current_period_end && new Date(a.current_period_end) > new Date());
        return {
          id: o.id,
          name: o.name,
          legal_name: o.legal_name,
          org_type: o.org_type,
          kvk_number: o.kvk_number,
          btw_number: o.btw_number,
          entity_ownership_pct: o.entity_ownership_pct,
          addon_status: a?.status ?? null,
          current_period_end: a?.current_period_end ?? null,
          cancel_at_period_end: !!a?.cancel_at_period_end,
          is_active_addon: !!isActive,
        };
      });
    },
    enabled: !!orgId,
  });

  // Realtime: refetch when entity_addons changes for this parent
  useEffect(() => {
    if (!orgId) return;
    const channelName = `entity-addons-${orgId}-${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "entity_addons",
          filter: `parent_organization_id=eq.${orgId}`,
        },
        () => query.refetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  return { entities: query.data ?? [], isLoading: query.isLoading, refetch: query.refetch };
}
