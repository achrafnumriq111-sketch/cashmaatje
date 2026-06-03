import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { useAuth } from "@/lib/auth";

export interface WorkflowRecord {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  trigger_type: "event" | "schedule" | "condition";
  trigger_label: string | null;
  condition_expr: string | null;
  action_expr: string | null;
  email_template_subject: string | null;
  email_template_body: string | null;
  active: boolean;
  total_runs: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveWorkflowInput {
  id?: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  trigger_type: WorkflowRecord["trigger_type"];
  trigger_label?: string | null;
  condition_expr?: string | null;
  action_expr?: string | null;
  email_template_subject?: string | null;
  email_template_body?: string | null;
  active?: boolean;
}

const DEFAULT_WORKFLOWS: SaveWorkflowInput[] = [
  { title: "Betalingsherinnering", description: "Automatisch bij facturen > 7 dagen overdue", icon: "Mail", trigger_type: "condition", trigger_label: "Factuur overdue", condition_expr: "IF factuur overdue > 7 dagen", action_expr: "THEN verstuur herinnering email", active: true },
  { title: "Offerte follow-up", description: "Herinnering als offerte niet geopend na 3 dagen", icon: "FileText", trigger_type: "condition", trigger_label: "Offerte verstuurd", condition_expr: "IF offerte niet geopend > 3 dagen", action_expr: "THEN verstuur follow-up email", active: true },
  { title: "BTW deadline alert", description: "5 dagen voor BTW aangifte deadline", icon: "Wallet", trigger_type: "schedule", trigger_label: "Kalender", condition_expr: "IF BTW deadline < 5 dagen", action_expr: "THEN verstuur herinnering", active: true },
  { title: "Jaarafsluiting herinnering", description: "Melding voor jaarrekening en deponering", icon: "Clock", trigger_type: "schedule", trigger_label: "Kalender", condition_expr: "IF maand = december", action_expr: "THEN verstuur jaarafsluiting checklist", active: false },
  { title: "Ontbrekende documenten", description: "Alert bij missende bonnen en facturen", icon: "Bell", trigger_type: "schedule", trigger_label: "Dagelijks", condition_expr: "IF transacties zonder document > 5", action_expr: "THEN verstuur document reminder", active: true },
  { title: "Betaling ontvangen", description: "Bevestiging bij ontvangen betaling", icon: "Zap", trigger_type: "event", trigger_label: "Betaling event", condition_expr: "IF betaling ontvangen", action_expr: "THEN verstuur bevestiging", active: true },
];

export function useWorkflows() {
  const { membership } = useOrganization();
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["workflows", orgId],
    queryFn: async (): Promise<WorkflowRecord[]> => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("automation_workflows" as any)
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      let list = (data as any[]) ?? [];
      // Seed defaults on first use
      if (list.length === 0 && user) {
        const rows = DEFAULT_WORKFLOWS.map((w) => ({
          ...w,
          organization_id: orgId,
          created_by: user.id,
        }));
        const { data: seeded } = await supabase
          .from("automation_workflows" as any)
          .insert(rows as any)
          .select();
        list = (seeded as any[]) ?? [];
        qc.invalidateQueries({ queryKey: ["workflows", orgId] });
      }
      return list;
    },
    enabled: !!orgId,
  });
}

export function useSaveWorkflow() {
  const { membership } = useOrganization();
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = membership?.organizationId;

  return useMutation({
    mutationFn: async (input: SaveWorkflowInput): Promise<WorkflowRecord> => {
      if (!orgId) throw new Error("Geen actieve organisatie");
      if (input.id) {
        const { id, ...rest } = input;
        const { data, error } = await supabase
          .from("automation_workflows" as any)
          .update(rest as any)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data as any;
      }
      const { data, error } = await supabase
        .from("automation_workflows" as any)
        .insert({ ...input, organization_id: orgId, created_by: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as any;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows", orgId] }),
  });
}

export function useToggleWorkflow() {
  const { membership } = useOrganization();
  const qc = useQueryClient();
  const orgId = membership?.organizationId;
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("automation_workflows" as any)
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows", orgId] }),
  });
}

export function useDeleteWorkflow() {
  const { membership } = useOrganization();
  const qc = useQueryClient();
  const orgId = membership?.organizationId;
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("automation_workflows" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows", orgId] }),
  });
}
