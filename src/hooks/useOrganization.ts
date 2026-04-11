import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface OrgMembership {
  organizationId: string;
  organizationName: string;
  role: UserRole;
}

export function useOrganization() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<OrgMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMembership = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("organization_members")
      .select("organization_id, role, organizations(name)")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (error) {
      console.error("Failed to fetch organization membership:", error.message);
    }

    if (data) {
      const org = data.organizations as unknown as { name: string };
      setMembership({
        organizationId: data.organization_id,
        organizationName: org?.name ?? "Organisatie",
        role: data.role,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  return { membership, loading, refetch: fetchMembership };
}
