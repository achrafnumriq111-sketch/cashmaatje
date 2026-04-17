import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export interface PaymentReminder {
  id: string;
  organization_id: string;
  name: string;
  days_after_due: number;
  subject: string;
  body_template: string;
  channel: "email" | "sms";
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function usePaymentReminders() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["payment-reminders", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_reminders")
        .select("*")
        .eq("organization_id", orgId!)
        .order("sort_order")
        .order("days_after_due");
      if (error) throw error;
      return (data ?? []) as PaymentReminder[];
    },
  });
}

export function useUpsertReminder() {
  const { membership } = useOrganization();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<PaymentReminder> & { id?: string }) => {
      const orgId = membership?.organizationId;
      if (!orgId) throw new Error("No organization");
      const payload = {
        organization_id: orgId,
        name: input.name ?? "Herinnering",
        days_after_due: input.days_after_due ?? 7,
        subject: input.subject ?? "Vriendelijke herinnering",
        body_template: input.body_template ?? "",
        channel: (input.channel as "email" | "sms") ?? "email",
        is_active: input.is_active ?? true,
        sort_order: input.sort_order ?? 0,
      };
      if (input.id) {
        const { error } = await supabase.from("payment_reminders").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_reminders").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-reminders"] }),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-reminders"] }),
  });
}
