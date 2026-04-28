import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

export interface VpbReturn {
  id: string;
  organization_id: string;
  fiscal_year: number;
  taxable_profit: number;
  loss_carryforward: number;
  innovation_box_amount: number;
  tax_low_bracket: number;
  tax_high_bracket: number;
  total_tax: number;
  effective_rate: number;
  status: "draft" | "finalized" | "submitted";
  notes: string | null;
  filed_at: string | null;
}

// 2024+ Dutch corporate tax brackets
const LOW_RATE = 0.19;
const HIGH_RATE = 0.258;
const BRACKET_THRESHOLD = 200_000;
const INNOVATION_BOX_RATE = 0.09;

export function calcVpb(input: {
  taxable_profit: number;
  loss_carryforward?: number;
  innovation_box_amount?: number;
}) {
  const profit = Math.max(0, input.taxable_profit - (input.loss_carryforward ?? 0));
  const innovation = Math.min(input.innovation_box_amount ?? 0, profit);
  const regular = Math.max(0, profit - innovation);
  const lowBase = Math.min(regular, BRACKET_THRESHOLD);
  const highBase = Math.max(0, regular - BRACKET_THRESHOLD);
  const tax_low = lowBase * LOW_RATE;
  const tax_high = highBase * HIGH_RATE;
  const tax_innovation = innovation * INNOVATION_BOX_RATE;
  const total = tax_low + tax_high + tax_innovation;
  const eff = profit > 0 ? (total / profit) * 100 : 0;
  return {
    tax_low_bracket: Math.round(tax_low * 100) / 100,
    tax_high_bracket: Math.round((tax_high + tax_innovation) * 100) / 100,
    total_tax: Math.round(total * 100) / 100,
    effective_rate: Math.round(eff * 100) / 100,
    adjusted_profit: profit,
  };
}

export function useVpbReturns() {
  const { organization } = useOrganization();
  return useQuery({
    queryKey: ["vpb_returns", organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vpb_returns" as any)
        .select("*")
        .eq("organization_id", organization!.id)
        .order("fiscal_year", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as VpbReturn[];
    },
  });
}

export function useUpsertVpb() {
  const qc = useQueryClient();
  const { organization } = useOrganization();
  return useMutation({
    mutationFn: async (input: {
      fiscal_year: number;
      taxable_profit: number;
      loss_carryforward?: number;
      innovation_box_amount?: number;
      notes?: string;
      status?: VpbReturn["status"];
    }) => {
      if (!organization?.id) throw new Error("No org");
      const calc = calcVpb(input);
      const { data, error } = await supabase
        .from("vpb_returns" as any)
        .upsert(
          {
            organization_id: organization.id,
            fiscal_year: input.fiscal_year,
            taxable_profit: input.taxable_profit,
            loss_carryforward: input.loss_carryforward ?? 0,
            innovation_box_amount: input.innovation_box_amount ?? 0,
            tax_low_bracket: calc.tax_low_bracket,
            tax_high_bracket: calc.tax_high_bracket,
            total_tax: calc.total_tax,
            effective_rate: calc.effective_rate,
            notes: input.notes ?? null,
            status: input.status ?? "draft",
          },
          { onConflict: "organization_id,fiscal_year" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vpb_returns"] });
      toast.success("VPB-aangifte opgeslagen");
    },
    onError: (e: any) => toast.error(e?.message ?? "Fout bij opslaan"),
  });
}
