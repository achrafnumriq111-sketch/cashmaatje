import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function usePlatformRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["platform_role", user?.id],
    queryFn: async () => {
      if (!user) return { isSuperAdmin: false, isSupportAgent: false };
      const { data, error } = await supabase
        .from("platform_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) {
        console.error("platform_role error", error);
        return { isSuperAdmin: false, isSupportAgent: false };
      }
      const roles = (data ?? []).map((r) => r.role);
      return {
        isSuperAdmin: roles.includes("super_admin"),
        isSupportAgent: roles.includes("support_agent") || roles.includes("super_admin"),
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
