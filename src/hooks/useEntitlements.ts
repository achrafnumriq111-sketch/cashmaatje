import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

// Module catalogus — bron van waarheid voor module-gating
export interface ModuleDefinition {
  key: string;
  name: string;
  description: string;
  category: "core" | "intelligence" | "automation" | "platform";
  unlockMethod: "free" | "referral" | "subscription";
  requiredReferrals?: number;
  icon?: string;
}

export const MODULE_CATALOG: ModuleDefinition[] = [
  // Core — altijd vrij
  { key: "dashboard", name: "Dashboard", description: "Overzicht & KPI's", category: "core", unlockMethod: "free" },
  { key: "transactions", name: "Transacties", description: "Bank & kas", category: "core", unlockMethod: "free" },
  { key: "invoices", name: "Facturen", description: "Verkoop & inkoop", category: "core", unlockMethod: "free" },
  { key: "documents", name: "Documenten", description: "Bonnen & bestanden", category: "core", unlockMethod: "free" },
  { key: "vat", name: "BTW aangifte", description: "Aangiftes & ICP", category: "core", unlockMethod: "free" },
  { key: "reports_basic", name: "Basisrapporten", description: "Winst-/verlies, balans", category: "core", unlockMethod: "free" },

  // Intelligence — referral unlock
  { key: "financial_intelligence", name: "Financial Intelligence", description: "AI inzichten & forecasts", category: "intelligence", unlockMethod: "referral", requiredReferrals: 1 },
  { key: "annual_report", name: "Jaarrekening", description: "Volledige jaarafsluiting", category: "intelligence", unlockMethod: "referral", requiredReferrals: 2 },
  { key: "audit_dossier", name: "Audit dossier", description: "Compleet auditdossier", category: "intelligence", unlockMethod: "referral", requiredReferrals: 3 },

  // Automation
  { key: "automation_center", name: "Automation Center", description: "Workflows & rules engine", category: "automation", unlockMethod: "referral", requiredReferrals: 3 },
  { key: "contract_intelligence", name: "Contract Intelligence", description: "AI contract review", category: "automation", unlockMethod: "subscription" },
  { key: "compliance_check", name: "Compliance Check", description: "AVG/wet conformiteit", category: "automation", unlockMethod: "subscription" },

  // Platform
  { key: "stakeholder_crm", name: "Stakeholder CRM", description: "Investor relations", category: "platform", unlockMethod: "subscription" },
  { key: "corporate_structure", name: "Corporate Structure", description: "Holding & entiteiten", category: "platform", unlockMethod: "subscription" },
  { key: "process_flows", name: "Process Flows", description: "BPMN procesdiagrammen", category: "platform", unlockMethod: "subscription" },
  { key: "theme_studio", name: "Theme Studio", description: "Whitelabel branding", category: "platform", unlockMethod: "subscription" },
];

export function useEntitlements() {
  const { membership } = useOrganization();
  const qc = useQueryClient();
  const orgId = membership?.organizationId;

  const query = useQuery({
    queryKey: ["module_entitlements", orgId],
    queryFn: async () => {
      if (!orgId) return [] as string[];
      const { data, error } = await supabase
        .from("module_entitlements")
        .select("module_key, expires_at")
        .eq("organization_id", orgId);
      if (error) throw error;
      const now = new Date();
      return (data ?? [])
        .filter((d) => !d.expires_at || new Date(d.expires_at) > now)
        .map((d) => d.module_key);
    },
    enabled: !!orgId,
  });

  const unlocked = new Set(query.data ?? []);

  const isUnlocked = (key: string): boolean => {
    const def = MODULE_CATALOG.find((m) => m.key === key);
    if (!def) return true; // onbekende keys = vrij
    if (def.unlockMethod === "free") return true;
    return unlocked.has(key);
  };

  const grant = useMutation({
    mutationFn: async ({ moduleKey, source = "admin" }: { moduleKey: string; source?: string }) => {
      if (!orgId) throw new Error("Geen actieve organisatie");
      const { error } = await supabase
        .from("module_entitlements")
        .upsert({ organization_id: orgId, module_key: moduleKey, source }, { onConflict: "organization_id,module_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["module_entitlements", orgId] });
      toast.success("Module ontgrendeld");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async (moduleKey: string) => {
      if (!orgId) throw new Error("Geen actieve organisatie");
      const { error } = await supabase
        .from("module_entitlements")
        .delete()
        .eq("organization_id", orgId)
        .eq("module_key", moduleKey);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["module_entitlements", orgId] });
      toast.success("Module gedeactiveerd");
    },
  });

  return { unlockedKeys: query.data ?? [], isUnlocked, isLoading: query.isLoading, grant, revoke, catalog: MODULE_CATALOG };
}
