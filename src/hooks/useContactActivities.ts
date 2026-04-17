import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export type ActivityType = "call" | "email" | "note" | "meeting" | "sms";

export interface ContactActivity {
  id: string;
  organization_id: string;
  contact_id: string;
  activity_type: ActivityType;
  subject: string | null;
  notes: string | null;
  outcome: string | null;
  performed_by: string | null;
  performed_at: string;
  created_at: string;
}

export function useContactActivities(contactId: string | null) {
  return useQuery({
    queryKey: ["contact-activities", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_activities")
        .select("*")
        .eq("contact_id", contactId!)
        .order("performed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ContactActivity[];
    },
  });
}

export function useLogContactActivity() {
  const { membership } = useOrganization();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      contactId: string;
      activityType: ActivityType;
      subject?: string;
      notes?: string;
      outcome?: string;
    }) => {
      const orgId = membership?.organizationId;
      if (!orgId) throw new Error("No organization");
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("contact_activities")
        .insert({
          organization_id: orgId,
          contact_id: input.contactId,
          activity_type: input.activityType,
          subject: input.subject ?? null,
          notes: input.notes ?? null,
          outcome: input.outcome ?? null,
          performed_by: userId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contact-activities", vars.contactId] });
    },
  });
}
