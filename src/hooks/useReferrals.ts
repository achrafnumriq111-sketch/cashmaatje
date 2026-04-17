import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

function generateCode(seed: string): string {
  const base = seed.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "USER";
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${base}-${random}`;
}

export function useReferralCode() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useQuery({
    queryKey: ["referral_code", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const existing = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing.data) return existing.data;
      const code = generateCode(user.email ?? user.id);
      const { data, error } = await supabase
        .from("referral_codes")
        .insert({ user_id: user.id, code })
        .select()
        .single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["referral_code", user.id] });
      return data;
    },
    enabled: !!user,
  });
}

export function useReferralInvites() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["referral_invites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("referral_invites")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async ({ code, email, name }: { code: string; email: string; name?: string }) => {
      if (!user) throw new Error("Niet ingelogd");
      const { error } = await supabase.from("referral_invites").insert({
        referrer_user_id: user.id,
        referral_code: code,
        invited_email: email,
        invited_name: name ?? null,
        status: "invited",
      });
      if (error) throw error;
      // Update teller
      await supabase.rpc("set_limit", { value: 0.5 }).then(() => {}, () => {});
      const { data: codeRow } = await supabase
        .from("referral_codes")
        .select("total_invites")
        .eq("user_id", user.id)
        .maybeSingle();
      if (codeRow) {
        await supabase
          .from("referral_codes")
          .update({ total_invites: (codeRow.total_invites ?? 0) + 1 })
          .eq("user_id", user.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral_invites", user?.id] });
      qc.invalidateQueries({ queryKey: ["referral_code", user?.id] });
      toast.success("Uitnodiging vastgelegd");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { invites: list.data ?? [], isLoading: list.isLoading, create };
}
