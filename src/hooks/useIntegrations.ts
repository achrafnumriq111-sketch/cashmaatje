import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { toast } from "sonner";

export interface IntegrationConnection {
  id: string;
  organization_id: string;
  integration_key: string;
  display_name: string;
  status: "connected" | "disconnected" | "error" | "pending";
  config: Record<string, unknown>;
  last_sync_at: string | null;
  last_error: string | null;
  connected_at: string | null;
  created_at: string;
}

export function useIntegrations() {
  const { activeOrgId } = useOrganization();
  const qc = useQueryClient();

  const connectionsQuery = useQuery({
    queryKey: ["integration_connections", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_connections")
        .select("*")
        .eq("organization_id", activeOrgId!);
      if (error) throw error;
      return (data ?? []) as IntegrationConnection[];
    },
  });

  const upsertConnection = useMutation({
    mutationFn: async (input: { integration_key: string; display_name: string; status: IntegrationConnection["status"]; config?: Record<string, unknown> }) => {
      if (!activeOrgId) throw new Error("Geen actieve organisatie");
      const payload = {
        organization_id: activeOrgId,
        integration_key: input.integration_key,
        display_name: input.display_name,
        status: input.status,
        config: input.config ?? {},
        connected_at: input.status === "connected" ? new Date().toISOString() : null,
      };
      const { data, error } = await supabase
        .from("integration_connections")
        .upsert(payload, { onConflict: "organization_id,integration_key" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["integration_connections"] });
      toast.success(vars.status === "connected" ? `${vars.display_name} verbonden` : `${vars.display_name} losgekoppeld`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    connections: connectionsQuery.data ?? [],
    isLoading: connectionsQuery.isLoading,
    upsertConnection,
    getConnection: (key: string) => (connectionsQuery.data ?? []).find((c) => c.integration_key === key),
  };
}
