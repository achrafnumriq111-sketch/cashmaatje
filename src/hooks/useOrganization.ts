import { createContext, useContext, useEffect, useState, useCallback, ReactNode, createElement } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export interface OrgMembership {
  organizationId: string;
  organizationName: string;
  role: UserRole;
  isOwner: boolean;
  isDemo: boolean;
}

interface OrgContextValue {
  membership: OrgMembership | null;
  memberships: OrgMembership[];
  loading: boolean;
  switchOrganization: (organizationId: string) => void;
  refetch: () => Promise<void>;
}

const STORAGE_KEY = "active_organization_id";

const OrgContext = createContext<OrgContextValue>({
  membership: null,
  memberships: [],
  loading: true,
  switchOrganization: () => {},
  refetch: async () => {},
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [loading, setLoading] = useState(true);

  const fetchMemberships = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("organization_members")
      .select("organization_id, role, is_owner, organizations(name, is_demo)")
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to fetch organization memberships:", error.message);
      setMemberships([]);
      setLoading(false);
      return;
    }

    const list: OrgMembership[] = (data ?? []).map((d) => {
      const org = d.organizations as unknown as { name: string; is_demo?: boolean } | null;
      return {
        organizationId: d.organization_id,
        organizationName: org?.name ?? "Organisatie",
        role: d.role,
        isOwner: !!d.is_owner,
        isDemo: !!org?.is_demo,
      };
    });
    setMemberships(list);

    // Validate / pick active
    setActiveId((prev) => {
      if (prev && list.some((m) => m.organizationId === prev)) return prev;
      const next = list[0]?.organizationId ?? null;
      if (next) localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  const switchOrganization = useCallback((organizationId: string) => {
    setActiveId(organizationId);
    localStorage.setItem(STORAGE_KEY, organizationId);
  }, []);

  const membership = memberships.find((m) => m.organizationId === activeId) ?? null;

  return createElement(
    OrgContext.Provider,
    { value: { membership, memberships, loading, switchOrganization, refetch: fetchMemberships } },
    children
  );
}

export function useOrganization() {
  return useContext(OrgContext);
}
