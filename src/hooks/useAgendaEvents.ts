import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/lib/auth";

export type AgendaEvent = {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  contact_id: string | null;
  is_billable: boolean;
  hourly_rate_eur: number | null;
  status: string;
};

export function useAgendaEvents(rangeStart?: string, rangeEnd?: string) {
  const qc = useQueryClient();
  const { membership } = useOrganization();
  const { user } = useAuth();
  const orgId = membership?.organizationId;

  const list = useQuery({
    queryKey: ["agenda_events", orgId, rangeStart, rangeEnd],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase.from("agenda_events").select("*").eq("organization_id", orgId!).order("start_at");
      if (rangeStart) q = q.gte("start_at", rangeStart);
      if (rangeEnd) q = q.lte("start_at", rangeEnd);
      const { data, error } = await q;
      if (error) throw error;
      return data as AgendaEvent[];
    },
  });

  const create = useMutation({
    mutationFn: async (e: Partial<AgendaEvent> & { title: string; start_at: string; end_at: string }) => {
      if (!orgId || !user) throw new Error("Geen organisatie");
      const { error } = await supabase.from("agenda_events").insert({
        organization_id: orgId,
        user_id: user.id,
        title: e.title,
        description: e.description ?? null,
        start_at: e.start_at,
        end_at: e.end_at,
        contact_id: e.contact_id ?? null,
        is_billable: e.is_billable ?? false,
        hourly_rate_eur: e.hourly_rate_eur ?? null,
        status: e.status ?? "scheduled",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda_events", orgId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agenda_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda_events", orgId] }),
  });

  return { list, create, remove };
}
