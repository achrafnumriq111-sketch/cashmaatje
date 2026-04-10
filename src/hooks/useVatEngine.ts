import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

interface VatPosition {
  vatOwed: number;       // BTW af te dragen (sales)
  vatReclaimable: number; // BTW voorbelasting (purchases)
  netVat: number;         // Netto BTW positie
  quarterEstimate: number;
  riskLevel: "low" | "medium" | "high";
  riskReasons: string[];
  documentsInbox: number;
  documentsProcessed: number;
  totalDocuments: number;
}

export function useVatEngine() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;

  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
  const quarterEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);

  return useQuery<VatPosition>({
    queryKey: ["vat-engine", orgId],
    enabled: !!orgId,
    refetchInterval: 30000, // Live updates every 30s
    queryFn: async () => {
      // Get all processed documents this quarter with VAT data
      const { data: docs } = await supabase
        .from("documents")
        .select("extracted_amount, extracted_vat_amount, document_type, tax_box_mapping, vat_rate_type_detected, processing_status, is_business_expense, ocr_status")
        .eq("organization_id", orgId!)
        .gte("extracted_date", quarterStart.toISOString().split("T")[0])
        .lte("extracted_date", quarterEnd.toISOString().split("T")[0]);

      const allDocs = docs || [];

      // Count inbox vs processed
      const documentsInbox = allDocs.filter(d => d.processing_status === "inbox" || d.ocr_status === "pending" || d.ocr_status === "processing").length;
      const documentsProcessed = allDocs.filter(d => d.processing_status === "processed").length;

      // Only use completed business documents for VAT calculation
      const processedDocs = allDocs.filter(d => d.ocr_status === "completed" && d.is_business_expense !== false);

      let vatOwed = 0;
      let vatReclaimable = 0;

      for (const doc of processedDocs) {
        const vatAmount = doc.extracted_vat_amount || 0;
        const box = doc.tax_box_mapping;

        if (box === "1a" || box === "1b" || box === "1c" || box === "1d" || box === "1e") {
          // Sales VAT — owed
          vatOwed += vatAmount;
        } else if (box === "5b") {
          // Purchase VAT — reclaimable
          vatReclaimable += vatAmount;
        }
      }

      const netVat = vatOwed - vatReclaimable;

      // Estimate quarter end: extrapolate from days elapsed
      const daysInQuarter = Math.ceil((quarterEnd.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.max(1, Math.ceil((now.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24)));
      const quarterEstimate = (netVat / daysElapsed) * daysInQuarter;

      // Risk assessment
      const riskReasons: string[] = [];

      if (documentsInbox > 5) {
        riskReasons.push(`${documentsInbox} documenten wachten op verwerking`);
      }

      // Check for anomalies
      const { count: openAnomalies } = await supabase
        .from("anomalies")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId!)
        .eq("status", "open");

      if ((openAnomalies ?? 0) > 0) {
        riskReasons.push(`${openAnomalies} openstaande waarschuwingen`);
      }

      // Check for missing docs on large transactions
      const { count: missingDocs } = await supabase
        .from("bank_transactions")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId!)
        .lt("amount", -250)
        .is("journal_entry_id", null)
        .gte("transaction_date", quarterStart.toISOString().split("T")[0]);

      if ((missingDocs ?? 0) > 0) {
        riskReasons.push(`${missingDocs} transacties zonder document`);
      }

      const riskLevel = riskReasons.length >= 3 ? "high" : riskReasons.length >= 1 ? "medium" : "low";

      return {
        vatOwed,
        vatReclaimable,
        netVat,
        quarterEstimate,
        riskLevel,
        riskReasons,
        documentsInbox,
        documentsProcessed,
        totalDocuments: allDocs.length,
      };
    },
  });
}
