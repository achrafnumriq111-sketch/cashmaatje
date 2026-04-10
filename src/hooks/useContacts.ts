import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export interface ContactFilters {
  search: string;
  type: "all" | "supplier" | "customer";
  country: string;
  riskStatus: "all" | "trusted" | "review" | "risk";
}

export function useContacts(filters: ContactFilters) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["contacts", orgId, filters],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", orgId!)
        .eq("is_active", true)
        .order("name");

      if (filters.type === "supplier") query = query.eq("is_supplier", true);
      if (filters.type === "customer") query = query.eq("is_customer", true);
      if (filters.country && filters.country !== "all") query = query.eq("address_country", filters.country);
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,btw_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useContactStats(contactId: string | null) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["contact-stats", contactId, orgId],
    enabled: !!contactId && !!orgId,
    queryFn: async () => {
      // Get transaction count and volume
      const { data: txData } = await supabase
        .from("bank_transactions")
        .select("amount")
        .eq("organization_id", orgId!)
        .eq("contact_id", contactId!);

      const { data: invoiceData } = await supabase
        .from("invoices")
        .select("total_amount, total_vat, invoice_type, invoice_date")
        .eq("organization_id", orgId!)
        .eq("contact_id", contactId!)
        .order("invoice_date", { ascending: false });

      const { data: docData } = await supabase
        .from("documents")
        .select("id")
        .eq("organization_id", orgId!)
        .eq("contact_id", contactId!);

      const txCount = txData?.length ?? 0;
      const totalVolume = txData?.reduce((s, t) => s + Math.abs(t.amount), 0) ?? 0;
      const totalVat = invoiceData?.reduce((s, i) => s + (i.total_vat ?? 0), 0) ?? 0;
      const lastActivity = invoiceData?.[0]?.invoice_date ?? null;

      return {
        transactionCount: txCount,
        totalVolume,
        totalVat,
        invoiceCount: invoiceData?.length ?? 0,
        documentCount: docData?.length ?? 0,
        lastActivity,
      };
    },
  });
}
