import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePlatformRole } from "@/hooks/usePlatformRole";

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  kind: "info" | "warning" | "success" | "announcement";
  audience: string;
  cta_label: string | null;
  cta_url: string | null;
  show_as_banner: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  read?: boolean;
  dismissed?: boolean;
}

export function useBroadcasts() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["broadcasts", user?.id],
    queryFn: async (): Promise<Broadcast[]> => {
      if (!user) return [];
      const { data: broadcasts, error } = await supabase
        .from("broadcasts")
        .select("*")
        .order("starts_at", { ascending: false })
        .limit(50);
      if (error) {
        console.error("broadcasts fetch", error);
        return [];
      }
      const { data: reads } = await supabase
        .from("broadcast_reads")
        .select("broadcast_id, dismissed")
        .eq("user_id", user.id);
      const readMap = new Map((reads ?? []).map((r) => [r.broadcast_id, r.dismissed]));
      return (broadcasts ?? []).map((b: any) => ({
        ...b,
        read: readMap.has(b.id),
        dismissed: readMap.get(b.id) === true,
      }));
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`broadcasts-list-${user.id}-${Math.random().toString(36).slice(2)}`);
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "broadcasts" }, () =>
        qc.invalidateQueries({ queryKey: ["broadcasts", user.id] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  const markRead = useMutation({
    mutationFn: async ({ id, dismiss = false }: { id: string; dismiss?: boolean }) => {
      if (!user) return;
      await supabase
        .from("broadcast_reads")
        .upsert(
          { broadcast_id: id, user_id: user.id, dismissed: dismiss, read_at: new Date().toISOString() },
          { onConflict: "broadcast_id,user_id" }
        );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broadcasts", user?.id] }),
  });

  const items = query.data ?? [];
  return {
    broadcasts: items,
    activeBanner: items.find((b) => b.show_as_banner && !b.dismissed) ?? null,
    unreadCount: items.filter((b) => !b.read).length,
    markRead,
    isLoading: query.isLoading,
  };
}

export interface SupportThread {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  last_message_at: string;
  unread_for_user: boolean;
  unread_for_admin: boolean;
  created_at: string;
}

export interface SupportMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_is_admin: boolean;
  body: string;
  created_at: string;
}

export function useSupportThreads(adminView = false) {
  const { user } = useAuth();
  const { data: roleData } = usePlatformRole();
  const isAdmin = !!roleData?.isSuperAdmin;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["support_threads", adminView, user?.id, isAdmin],
    queryFn: async (): Promise<SupportThread[]> => {
      if (!user) return [];
      let q = supabase.from("support_threads").select("*").order("last_message_at", { ascending: false });
      if (!adminView || !isAdmin) q = q.eq("user_id", user.id);
      const { data, error } = await q;
      if (error) {
        console.error("threads fetch", error);
        return [];
      }
      return (data as SupportThread[]) ?? [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`threads-${adminView ? "admin" : "user"}-${user.id}-${Math.random().toString(36).slice(2)}`);
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "support_threads" }, () =>
        qc.invalidateQueries({ queryKey: ["support_threads", adminView, user.id] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, adminView, qc]);

  const createThread = useMutation({
    mutationFn: async ({ subject, body }: { subject: string; body: string }) => {
      if (!user) throw new Error("Niet ingelogd");
      const { data: thread, error: tErr } = await supabase
        .from("support_threads")
        .insert({ user_id: user.id, subject, status: "open" })
        .select()
        .single();
      if (tErr) throw tErr;
      const { error: mErr } = await supabase
        .from("support_messages")
        .insert({ thread_id: thread.id, sender_id: user.id, sender_is_admin: false, body });
      if (mErr) throw mErr;
      return thread;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support_threads"] }),
  });

  return {
    threads: query.data ?? [],
    unreadForUser: (query.data ?? []).filter((t) => t.unread_for_user).length,
    unreadForAdmin: (query.data ?? []).filter((t) => t.unread_for_admin).length,
    isLoading: query.isLoading,
    createThread,
  };
}

export function useSupportMessages(threadId: string | null) {
  const { user } = useAuth();
  const { data: roleData } = usePlatformRole();
  const isAdmin = !!roleData?.isSuperAdmin;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["support_messages", threadId],
    queryFn: async (): Promise<SupportMessage[]> => {
      if (!threadId) return [];
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("messages fetch", error);
        return [];
      }
      // Mark thread as read
      if (user) {
        const patch = isAdmin ? { unread_for_admin: false } : { unread_for_user: false };
        await supabase.from("support_threads").update(patch).eq("id", threadId);
      }
      return (data as SupportMessage[]) ?? [];
    },
    enabled: !!threadId,
  });

  useEffect(() => {
    if (!threadId) return;
    const channel = supabase.channel(`messages-${threadId}-${Math.random().toString(36).slice(2)}`);
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `thread_id=eq.${threadId}` },
        () => qc.invalidateQueries({ queryKey: ["support_messages", threadId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, qc]);

  const sendMessage = useMutation({
    mutationFn: async (body: string) => {
      if (!user || !threadId) throw new Error("Niet ingelogd of geen thread");
      const { error } = await supabase
        .from("support_messages")
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          sender_is_admin: isAdmin,
          body,
        });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support_messages", threadId] }),
  });

  return { messages: query.data ?? [], sendMessage, isLoading: query.isLoading };
}
