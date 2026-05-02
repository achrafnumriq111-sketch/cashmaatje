import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/hooks/useOrganization";
import type { EntityRole } from "@/lib/roles";

export interface EntityAccess {
  canRead: boolean;
  canWrite: boolean;
  canAdmin: boolean;
  role: EntityRole | null;
  isOwner: boolean;
  loading: boolean;
}

/**
 * Returns the current user's permissions for the active (or specified) organization.
 * Falls back to organization_members.is_owner / role when no entity_roles row exists,
 * so existing organisations keep working.
 */
export function useEntityAccess(organizationId?: string): EntityAccess {
  const { user } = useAuth();
  const { membership } = useOrganization();
  const orgId = organizationId ?? membership?.organizationId ?? null;

  const query = useQuery({
    queryKey: ["entity_access", user?.id, orgId],
    enabled: !!user && !!orgId,
    staleTime: 60_000,
    queryFn: async () => {
      // 1) Check entity_roles (preferred)
      const { data: roleRow } = await supabase
        .from("entity_roles" as any)
        .select("role, can_read, can_write, can_admin")
        .eq("organization_id", orgId!)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (roleRow) {
        return {
          role: (roleRow as any).role as EntityRole,
          can_read: !!(roleRow as any).can_read,
          can_write: !!(roleRow as any).can_write,
          can_admin: !!(roleRow as any).can_admin,
        };
      }

      // 2) Fallback to organization_members
      const { data: member } = await supabase
        .from("organization_members")
        .select("is_owner, role")
        .eq("organization_id", orgId!)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!member) return null;

      const isOwner = !!member.is_owner;
      const isAdmin = isOwner || member.role === "admin";
      return {
        role: (isOwner ? "owner" : isAdmin ? "admin" : "editor") as EntityRole,
        can_read: true,
        can_write: true,
        can_admin: isAdmin,
      };
    },
  });

  return {
    canRead: query.data?.can_read ?? false,
    canWrite: query.data?.can_write ?? false,
    canAdmin: query.data?.can_admin ?? false,
    role: query.data?.role ?? null,
    isOwner: query.data?.role === "owner",
    loading: query.isLoading,
  };
}
