import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "@/hooks/use-toast";

export type ChaosPriority = "red" | "orange" | "green";
export type ChaosStatus = "pending" | "analyzing" | "analyzed" | "failed" | "resolved";
export type PanicBand = "stable" | "warning" | "high" | "immediate";
export type UrgencyLane = "today" | "this_week" | "later";
export type ConfidenceBand = "high" | "medium" | "low";

export interface ChaosUpload {
  id: string;
  organization_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  status: ChaosStatus;
  error_message: string | null;
  created_at: string;
}

export interface MissingDoc {
  name: string;
  why: string;
  severity?: "high" | "medium" | "low";
}

export interface RiskTimelineStep {
  stage: string;
  when: string;
  consequence: string;
}

export interface ChaosItem {
  id: string;
  organization_id: string;
  upload_id: string;
  category: string;
  sender_name: string | null;
  document_title: string;
  summary: string | null;
  amount_due: number | null;
  currency: string | null;
  reference_number: string | null;
  payment_deadline: string | null;
  legal_deadline: string | null;
  priority: ChaosPriority;
  panic_score: number | null;
  panic_band: PanicBand | null;
  urgency_lane: UrgencyLane | null;
  confidence_band: ConfidenceBand | null;
  missing_documents: MissingDoc[] | null;
  risk_timeline: RiskTimelineStep[] | null;
  daily_anchor: boolean;
  risk_level: number | null;
  risk_if_ignored: string | null;
  recommended_action: string;
  action_owner: string | null;
  phone_number: string | null;
  phone_script: string | null;
  required_documents: string[] | null;
  is_resolved: boolean;
  resolved_at: string | null;
  notes: string | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  created_at: string;
}

export type ActionType =
  | "call"
  | "payment_arrangement"
  | "objection"
  | "delay_request"
  | "email_sent"
  | "payment_made"
  | "prepare_handover"
  | "other";

export interface ChaosAction {
  id: string;
  organization_id: string;
  chaos_item_id: string;
  action_type: ActionType;
  status: "open" | "in_progress" | "done";
  notes: string | null;
  performed_at: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface ChaosActionProof {
  id: string;
  action_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface RecoveryPlanDay {
  day: number;
  date: string;
  title: string;
  item_id: string | null;
  action_type: ActionType;
  why: string;
  done?: boolean;
}

export interface RecoveryPlan {
  id: string;
  organization_id: string;
  generated_at: string;
  summary: string | null;
  days: RecoveryPlanDay[];
  status: "active" | "completed" | "archived";
}

export interface PreventionRule {
  id: string;
  organization_id: string;
  rule_type: string;
  label: string;
  next_due_at: string | null;
  cadence: string | null;
  channel: "email" | "in_app";
  is_active: boolean;
}

export function useChaosData() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const queryClient = useQueryClient();

  // Defense-in-depth: every query is filtered by organization_id even though
  // RLS would block cross-org access at the database layer.
  const uploads = useQuery({
    queryKey: ["chaos-uploads", orgId],
    queryFn: async () => {
      if (!orgId) return [] as ChaosUpload[];
      const { data, error } = await supabase
        .from("chaos_uploads")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as ChaosUpload[];
    },
    enabled: !!orgId,
    refetchInterval: (q) => {
      const list = (q.state.data as ChaosUpload[] | undefined) ?? [];
      const inFlight = list.some((u) => u.status === "pending" || u.status === "analyzing");
      return inFlight ? 2500 : false;
    },
  });

  const items = useQuery({
    queryKey: ["chaos-items", orgId],
    queryFn: async () => {
      if (!orgId) return [] as ChaosItem[];
      const { data, error } = await supabase
        .from("chaos_items")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const order: Record<ChaosPriority, number> = { red: 0, orange: 1, green: 2 };
      return (data as unknown as ChaosItem[]).sort((a, b) => {
        const p = order[a.priority] - order[b.priority];
        if (p !== 0) return p;
        return (b.panic_score ?? 0) - (a.panic_score ?? 0);
      });
    },
    enabled: !!orgId,
  });

  const recoveryPlan = useQuery({
    queryKey: ["chaos-recovery-plan", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("chaos_recovery_plans")
        .select("*")
        .eq("organization_id", orgId)
        .eq("status", "active")
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as RecoveryPlan | null;
    },
    enabled: !!orgId,
  });

  const preventionRules = useQuery({
    queryKey: ["chaos-prevention-rules", orgId],
    queryFn: async () => {
      if (!orgId) return [] as PreventionRule[];
      const { data, error } = await supabase
        .from("chaos_prevention_rules")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PreventionRule[];
    },
    enabled: !!orgId,
  });

  const uploadFiles = useMutation({
    mutationFn: async (files: File[]) => {
      if (!orgId) throw new Error("Geen organisatie geselecteerd");
      const created: string[] = [];
      for (const file of files) {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${orgId}/${crypto.randomUUID()}-${cleanName}`;
        const { error: upErr } = await supabase.storage
          .from("chaos-docs")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;

        const { data: row, error: insErr } = await supabase
          .from("chaos_uploads")
          .insert({
            organization_id: orgId,
            file_name: file.name,
            file_path: path,
            file_size: file.size,
            mime_type: file.type,
            status: "pending",
          })
          .select("id")
          .single();
        if (insErr) throw insErr;

        supabase.functions
          .invoke("analyze-chaos-document", { body: { upload_id: row.id } })
          .catch((e) => console.error("analyze invoke failed", e));

        created.push(row.id);
      }
      return created;
    },
    onSuccess: (ids) => {
      queryClient.invalidateQueries({ queryKey: ["chaos-uploads", orgId] });
      toast({
        title: `${ids.length} document${ids.length === 1 ? "" : "en"} geüpload`,
        description: "AI analyseert nu — verschijnt automatisch in dashboard.",
      });
    },
    onError: (e: Error) => {
      toast({ title: "Upload mislukt", description: e.message, variant: "destructive" });
    },
  });

  const retryUpload = useMutation({
    mutationFn: async (upload_id: string) => {
      await supabase.from("chaos_uploads").update({ status: "pending", error_message: null }).eq("id", upload_id);
      await supabase.functions.invoke("analyze-chaos-document", { body: { upload_id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chaos-uploads", orgId] });
      toast({ title: "Analyse opnieuw gestart" });
    },
  });

  const resolveItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chaos_items")
        .update({ is_resolved: true, resolved_at: new Date().toISOString(), daily_anchor: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chaos-items", orgId] });
      toast({ title: "Gemarkeerd als afgehandeld" });
    },
  });

  const reopenItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chaos_items")
        .update({ is_resolved: false, resolved_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chaos-items", orgId] }),
  });

  const deleteUpload = useMutation({
    mutationFn: async (upload: ChaosUpload) => {
      await supabase.storage.from("chaos-docs").remove([upload.file_path]);
      const { error } = await supabase.from("chaos_uploads").delete().eq("id", upload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chaos-uploads", orgId] });
      queryClient.invalidateQueries({ queryKey: ["chaos-items", orgId] });
    },
  });

  const logAction = useMutation({
    mutationFn: async (input: { itemId: string; type: ActionType; notes?: string; status?: "open" | "in_progress" | "done" }) => {
      if (!orgId) throw new Error("Geen organisatie");
      const { data, error } = await supabase
        .from("chaos_actions")
        .insert({
          organization_id: orgId,
          chaos_item_id: input.itemId,
          action_type: input.type,
          status: input.status ?? "done",
          notes: input.notes ?? null,
          performed_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, input) => {
      queryClient.invalidateQueries({ queryKey: ["chaos-actions", input.itemId] });
      toast({ title: "Actie geregistreerd" });
    },
  });

  const uploadProof = useMutation({
    mutationFn: async (input: { actionId: string; file: File }) => {
      if (!orgId) throw new Error("Geen organisatie");
      const cleanName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `proofs/${orgId}/${input.actionId}/${crypto.randomUUID()}-${cleanName}`;
      const { error: upErr } = await supabase.storage
        .from("chaos-docs")
        .upload(path, input.file, { contentType: input.file.type, upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("chaos_action_proofs").insert({
        organization_id: orgId,
        action_id: input.actionId,
        file_path: path,
        file_name: input.file.name,
        mime_type: input.file.type,
        file_size: input.file.size,
      });
      if (insErr) throw insErr;
    },
    onSuccess: (_d, input) => {
      queryClient.invalidateQueries({ queryKey: ["chaos-action-proofs", input.actionId] });
      toast({ title: "Bewijs opgeslagen" });
    },
  });

  const generateRecoveryPlan = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Geen organisatie");
      const { data, error } = await supabase.functions.invoke("generate-recovery-plan", {
        body: { organization_id: orgId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chaos-recovery-plan", orgId] });
      toast({ title: "Je 7-daags herstelplan staat klaar" });
    },
    onError: (e: Error) => toast({ title: "Plan niet gelukt", description: e.message, variant: "destructive" }),
  });

  const generateHandoverPack = useMutation({
    mutationFn: async (): Promise<{ signed_url?: string; file_path?: string }> => {
      if (!orgId) throw new Error("Geen organisatie");
      const { data, error } = await supabase.functions.invoke("generate-handover-pack", {
        body: { organization_id: orgId },
      });
      if (error) throw error;
      return data as { signed_url?: string; file_path?: string };
    },
    onSuccess: (data) => {
      toast({ title: "Pakket klaar voor je boekhouder" });
      if (data?.signed_url) {
        window.open(data.signed_url, "_blank");
      }
    },
    onError: (e: Error) => toast({ title: "Genereren mislukt", description: e.message, variant: "destructive" }),
  });

  const togglePreventionRule = useMutation({
    mutationFn: async (input: { rule_type: string; label: string; cadence?: string; is_active: boolean; existing_id?: string }) => {
      if (!orgId) throw new Error("Geen organisatie");
      if (input.existing_id) {
        const { error } = await supabase
          .from("chaos_prevention_rules")
          .update({ is_active: input.is_active })
          .eq("id", input.existing_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("chaos_prevention_rules").insert({
          organization_id: orgId,
          rule_type: input.rule_type,
          label: input.label,
          cadence: input.cadence ?? null,
          channel: "in_app",
          is_active: input.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chaos-prevention-rules", orgId] }),
  });

  const updateRecoveryPlanDay = useMutation({
    mutationFn: async (input: { plan_id: string; day: number; done: boolean }) => {
      const current = recoveryPlan.data;
      if (!current || current.id !== input.plan_id) return;
      const newDays = current.days.map((d) => (d.day === input.day ? { ...d, done: input.done } : d));
      const allDone = newDays.every((d) => d.done);
      const { error } = await supabase
        .from("chaos_recovery_plans")
        .update({ days: newDays as unknown as never, status: allDone ? "completed" : "active" })
        .eq("id", input.plan_id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chaos-recovery-plan", orgId] }),
  });

  const list = items.data ?? [];
  const open = list.filter((i) => !i.is_resolved);

  const lanes = {
    today: open.filter((i) => i.urgency_lane === "today"),
    this_week: open.filter((i) => i.urgency_lane === "this_week"),
    later: open.filter((i) => i.urgency_lane === "later" || !i.urgency_lane),
  };

  const dailyAnchor = open.find((i) => i.daily_anchor) ?? open[0] ?? null;
  const topPanic = Math.max(0, ...open.map((i) => i.panic_score ?? 0));
  const avgPanic = open.length > 0 ? Math.round(open.reduce((s, i) => s + (i.panic_score ?? 0), 0) / open.length) : 0;

  const stats = {
    total: list.length,
    open: open.length,
    red: open.filter((i) => i.priority === "red").length,
    orange: open.filter((i) => i.priority === "orange").length,
    green: open.filter((i) => i.priority === "green").length,
    totalDue: open.reduce((s, i) => s + (Number(i.amount_due) || 0), 0),
    analyzing: (uploads.data ?? []).filter(
      (u) => u.status === "pending" || u.status === "analyzing"
    ).length,
    topPanic,
    avgPanic,
    confidenceLowCount: open.filter((i) => i.confidence_band === "low").length,
  };

  return {
    uploads,
    items,
    recoveryPlan,
    preventionRules,
    uploadFiles,
    retryUpload,
    resolveItem,
    reopenItem,
    deleteUpload,
    logAction,
    uploadProof,
    generateRecoveryPlan,
    generateHandoverPack,
    togglePreventionRule,
    updateRecoveryPlanDay,
    stats,
    lanes,
    dailyAnchor,
  };
}

export function useChaosActions(itemId: string | null) {
  return useQuery({
    queryKey: ["chaos-actions", itemId],
    queryFn: async () => {
      if (!itemId) return [] as ChaosAction[];
      const { data, error } = await supabase
        .from("chaos_actions")
        .select("*")
        .eq("chaos_item_id", itemId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ChaosAction[];
    },
    enabled: !!itemId,
  });
}

export function useChaosActionProofs(actionIds: string[]) {
  return useQuery({
    queryKey: ["chaos-action-proofs", actionIds.sort().join(",")],
    queryFn: async () => {
      if (actionIds.length === 0) return [] as ChaosActionProof[];
      const { data, error } = await supabase
        .from("chaos_action_proofs")
        .select("*")
        .in("action_id", actionIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ChaosActionProof[];
    },
    enabled: actionIds.length > 0,
  });
}
