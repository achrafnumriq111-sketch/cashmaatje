import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "@/hooks/use-toast";

export type ChaosPriority = "red" | "orange" | "green";
export type ChaosStatus = "pending" | "analyzing" | "analyzed" | "failed" | "resolved";

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

export function useChaosData() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const queryClient = useQueryClient();

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
        .order("priority", { ascending: true }) // red, orange, green alphabetically -> green,orange,red
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      // sort red > orange > green
      const order: Record<ChaosPriority, number> = { red: 0, orange: 1, green: 2 };
      return (data as ChaosItem[]).sort((a, b) => order[a.priority] - order[b.priority]);
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

        // fire and forget — analyzer is async
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

  const resolveItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chaos_items")
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
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

  const list = items.data ?? [];
  const open = list.filter((i) => !i.is_resolved);
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
  };

  return {
    uploads,
    items,
    uploadFiles,
    resolveItem,
    reopenItem,
    deleteUpload,
    stats,
  };
}
