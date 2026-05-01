import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export interface RecurringTemplate {
  id: string;
  name: string;
  invoice_type: "sales" | "purchase";
  contact_id: string | null;
  contact_name: string | null;
  description: string | null;
  subtotal: number;
  vat_rate_type: string;
  vat_amount: number;
  total_amount: number;
  currency: string;
  frequency: "monthly" | "quarterly" | "yearly";
  day_of_month: number;
  start_date: string;
  end_date: string | null;
  next_run_date: string;
  last_generated_date: string | null;
  auto_send: boolean;
  is_active: boolean;
  notes: string | null;
}

export function useRecurringTemplates() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["recurring-templates", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_invoice_templates")
        .select("*")
        .eq("organization_id", orgId!)
        .order("next_run_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as RecurringTemplate[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: Partial<RecurringTemplate> & { name: string; total_amount: number; frequency: RecurringTemplate["frequency"]; start_date: string; }) => {
      const { error, data } = await supabase
        .from("recurring_invoice_templates")
        .insert([{
          organization_id: orgId!,
          name: input.name,
          invoice_type: input.invoice_type ?? "sales",
          contact_id: input.contact_id ?? null,
          contact_name: input.contact_name ?? null,
          description: input.description ?? null,
          subtotal: input.subtotal ?? input.total_amount,
          vat_rate_type: (input.vat_rate_type as any) ?? "high",
          vat_amount: input.vat_amount ?? 0,
          total_amount: input.total_amount,
          currency: input.currency ?? "EUR",
          frequency: input.frequency,
          day_of_month: input.day_of_month ?? 1,
          start_date: input.start_date,
          end_date: input.end_date ?? null,
          next_run_date: input.next_run_date ?? input.start_date,
          auto_send: input.auto_send ?? false,
          is_active: input.is_active ?? true,
          notes: input.notes ?? null,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-templates", orgId] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<RecurringTemplate> & { id: string }) => {
      const { error } = await supabase
        .from("recurring_invoice_templates")
        .update(patch as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-templates", orgId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_invoice_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-templates", orgId] }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("recurring_invoice_templates")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-templates", orgId] }),
  });

  return { list, create, update, remove, toggle };
}
