import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/lib/auth";

export type TimeEntry = {
  id: string;
  organization_id: string;
  user_id: string;
  entry_date: string;
  hours: number;
  description: string | null;
  contact_id: string | null;
  hourly_rate_eur: number | null;
  is_billable: boolean;
  is_invoiced: boolean;
  created_at: string;
};

export function useTimeEntries() {
  const qc = useQueryClient();
  const { membership } = useOrganization();
  const { user } = useAuth();
  const orgId = membership?.organizationId;

  const list = useQuery({
    queryKey: ["time_entries", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("organization_id", orgId!)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data as TimeEntry[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: Partial<TimeEntry> & { entry_date: string; hours: number }) => {
      if (!orgId || !user) throw new Error("Geen organisatie");
      const { error } = await supabase.from("time_entries").insert({
        organization_id: orgId,
        user_id: user.id,
        entry_date: input.entry_date,
        hours: input.hours,
        description: input.description ?? null,
        contact_id: input.contact_id ?? null,
        hourly_rate_eur: input.hourly_rate_eur ?? null,
        is_billable: input.is_billable ?? true,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time_entries", orgId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time_entries", orgId] }),
  });

  return { list, create, remove };
}
