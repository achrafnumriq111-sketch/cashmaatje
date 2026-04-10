import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

export interface JournalFilters {
  dateFrom: string;
  dateTo: string;
  status: "all" | "draft" | "posted" | "voided";
  search: string;
  sourceType: "all" | "invoice" | "bank_transaction" | "manual" | "system";
  vatBox: string;
  accountId: string | null;
}

export function useJournalEntries(filters: JournalFilters) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  return useQuery({
    queryKey: ["journal-entries", orgId, filters],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from("journal_entries")
        .select("*")
        .eq("organization_id", orgId!)
        .gte("date", filters.dateFrom)
        .lte("date", filters.dateTo)
        .order("date", { ascending: false })
        .order("entry_number", { ascending: false });

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.sourceType !== "all") {
        query = query.eq("source_type", filters.sourceType);
      }
      if (filters.search) {
        query = query.ilike("description", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useJournalLines(entryId: string | null) {
  return useQuery({
    queryKey: ["journal-lines", entryId],
    enabled: !!entryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_lines")
        .select("*, accounts(code, name, name_nl)")
        .eq("journal_entry_id", entryId!)
        .order("line_number");
      if (error) throw error;
      return data ?? [];
    },
  });
}
