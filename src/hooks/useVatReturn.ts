import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { useToast } from "./use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";

export interface VatBoxValues {
  box_1a_base: number; box_1a_vat: number;
  box_1b_base: number; box_1b_vat: number;
  box_1c_base: number; box_1c_vat: number;
  box_1d_base: number; box_1d_vat: number;
  box_1e_base: number; box_1e_vat: number;
  box_2a_base: number; box_2a_vat: number;
  box_3a_base: number;
  box_3b_base: number;
  box_3c_base: number;
  box_4a_base: number; box_4a_vat: number;
  box_4b_base: number; box_4b_vat: number;
  box_5a_vat: number;
  box_5b_vat: number;
  box_5c_vat: number;
  box_5d_vat: number;
  box_5e_vat: number;
  box_5f_vat: number;
}

export interface VatReturn extends VatBoxValues {
  id: string;
  organization_id: string;
  year: number;
  period_type: string;
  period_number: number;
  period_start: string;
  period_end: string;
  status: string;
  filed_at: string | null;
  filed_by: string | null;
  filing_reference: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  calculation_details: unknown;
  warnings: string[] | null;
  errors: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface VatReturnLine {
  id: string;
  vat_return_id: string;
  journal_entry_id: string | null;
  journal_line_id: string | null;
  invoice_id: string | null;
  vat_rate_type: string;
  vat_percentage: number;
  vat_box: string;
  base_amount: number;
  vat_amount: number;
  contact_id: string | null;
  contact_vat_number: string | null;
  contact_country: string | null;
  description: string | null;
}

const emptyBoxes: VatBoxValues = {
  box_1a_base: 0, box_1a_vat: 0, box_1b_base: 0, box_1b_vat: 0,
  box_1c_base: 0, box_1c_vat: 0, box_1d_base: 0, box_1d_vat: 0,
  box_1e_base: 0, box_1e_vat: 0, box_2a_base: 0, box_2a_vat: 0,
  box_3a_base: 0, box_3b_base: 0, box_3c_base: 0,
  box_4a_base: 0, box_4a_vat: 0, box_4b_base: 0, box_4b_vat: 0,
  box_5a_vat: 0, box_5b_vat: 0, box_5c_vat: 0,
  box_5d_vat: 0, box_5e_vat: 0, box_5f_vat: 0,
};

function getPeriodDates(year: number, periodType: string, periodNumber: number) {
  if (periodType === "quarterly") {
    const startMonth = (periodNumber - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  }
  const start = new Date(year, periodNumber - 1, 1);
  const end = new Date(year, periodNumber, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function useVatReturn() {
  const { membership } = useOrganization();
  const { toast } = useToast();
  const [year, setYear] = useState(new Date().getFullYear());
  const [periodNumber, setPeriodNumber] = useState(() => {
    const m = new Date().getMonth();
    return Math.floor(m / 3) + 1;
  });
  const [vatFrequency, setVatFrequency] = useState<string>("quarterly");
  const [vatReturn, setVatReturn] = useState<VatReturn | null>(null);
  const [boxes, setBoxes] = useState<VatBoxValues>({ ...emptyBoxes });
  const [drillLines, setDrillLines] = useState<VatReturnLine[]>([]);
  const [drillBox, setDrillBox] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const orgId = membership?.organizationId;

  // Fetch org vat frequency
  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("organizations")
      .select("vat_frequency")
      .eq("id", orgId)
      .single()
      .then(({ data }) => {
        if (data) setVatFrequency(data.vat_frequency);
      });
  }, [orgId]);

  // Load / calculate
  const loadReturn = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setDrillBox(null);
    setDrillLines([]);

    // Check if return already exists
    const { data: existing } = await supabase
      .from("vat_returns")
      .select("*")
      .eq("organization_id", orgId)
      .eq("year", year)
      .eq("period_number", periodNumber)
      .maybeSingle();

    if (existing) {
      setVatReturn(existing as unknown as VatReturn);
      const b: VatBoxValues = { ...emptyBoxes };
      for (const k of Object.keys(b) as (keyof VatBoxValues)[]) {
        b[k] = Number((existing as Record<string, unknown>)[k]) || 0;
      }
      setBoxes(b);
      setWarnings((existing.warnings as string[]) ?? []);
      setLoading(false);
      return;
    }

    // Calculate from DB function
    const dates = getPeriodDates(year, vatFrequency, periodNumber);
    const { data: calc, error } = await supabase.rpc("calculate_vat_return", {
      p_org_id: orgId,
      p_start_date: dates.start,
      p_end_date: dates.end,
    });

    if (error) {
      console.error(error);
      setBoxes({ ...emptyBoxes });
    } else if (calc) {
      const c = calc as Record<string, unknown>;
      const b: VatBoxValues = { ...emptyBoxes };
      for (const k of Object.keys(b) as (keyof VatBoxValues)[]) {
        b[k] = Number(c[k]) || 0;
      }
      // Compute 5a, 5c, 5f
      b.box_5a_vat = b.box_1a_vat + b.box_1b_vat + b.box_1c_vat + b.box_1d_vat + b.box_1e_vat + b.box_2a_vat + b.box_4a_vat + b.box_4b_vat;
      b.box_5c_vat = b.box_5a_vat - b.box_5b_vat;
      b.box_5f_vat = b.box_5c_vat - b.box_5d_vat - b.box_5e_vat;
      setBoxes(b);
    }

    // Generate warnings
    const w: string[] = [];
    const dates2 = getPeriodDates(year, vatFrequency, periodNumber);

    const { count: uncatCount } = await supabase
      .from("bank_transactions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "new")
      .gte("transaction_date", dates2.start)
      .lte("transaction_date", dates2.end);
    if (uncatCount && uncatCount > 0) w.push(`${uncatCount} ongecategoriseerde transacties in deze periode`);

    const { count: unreconCount } = await supabase
      .from("bank_transactions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", ["new", "partial_match"])
      .gte("transaction_date", dates2.start)
      .lte("transaction_date", dates2.end);
    if (unreconCount && unreconCount > 0) w.push(`${unreconCount} niet-afgestemde transacties`);

    const { count: anomalyCount } = await supabase
      .from("anomalies")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "open");
    if (anomalyCount && anomalyCount > 0) w.push(`${anomalyCount} openstaande afwijkingen`);

    setWarnings(w);
    setVatReturn(null);
    setLoading(false);
  }, [orgId, year, periodNumber, vatFrequency]);

  useEffect(() => {
    loadReturn();
  }, [loadReturn]);

  // Drill into a box
  const drillInto = useCallback(async (box: string) => {
    if (!orgId) return;
    setDrillBox(box);

    if (vatReturn) {
      const { data } = await supabase
        .from("vat_return_lines")
        .select("*")
        .eq("vat_return_id", vatReturn.id)
        .eq("vat_box", box);
      setDrillLines((data as unknown as VatReturnLine[]) ?? []);
    } else {
      // Query journal lines directly
      const dates = getPeriodDates(year, vatFrequency, periodNumber);
      const { data } = await supabase
        .from("journal_lines")
        .select("id, description, vat_box, debit_amount, credit_amount, vat_amount, vat_percentage, contact_id, journal_entry_id, journal_entries!inner(date, description, organization_id, status)")
        .eq("journal_entries.organization_id", orgId)
        .eq("journal_entries.status", "posted")
        .eq("vat_box", box)
        .gte("journal_entries.date", dates.start)
        .lte("journal_entries.date", dates.end);

      const lines: VatReturnLine[] = (data ?? []).map((d: Record<string, unknown>) => {
        const je = d.journal_entries as Record<string, unknown> | null;
        return {
          id: d.id as string,
          vat_return_id: "",
          journal_entry_id: d.journal_entry_id as string,
          journal_line_id: d.id as string,
          invoice_id: null,
          vat_rate_type: "",
          vat_percentage: Number(d.vat_percentage) || 0,
          vat_box: d.vat_box as string,
          base_amount: Number(d.debit_amount) - Number(d.credit_amount),
          vat_amount: Number(d.vat_amount) || 0,
          contact_id: d.contact_id as string | null,
          contact_vat_number: null,
          contact_country: null,
          description: (d.description as string) || (je?.description as string) || "",
        };
      });
      setDrillLines(lines);
    }
  }, [orgId, vatReturn, year, periodNumber, vatFrequency]);

  // Save as draft
  const saveAsDraft = useCallback(async () => {
    if (!orgId) return;
    setSaving(true);
    const dates = getPeriodDates(year, vatFrequency, periodNumber);
    const payload = {
      organization_id: orgId,
      year,
      period_type: vatFrequency as "quarterly" | "monthly",
      period_number: periodNumber,
      period_start: dates.start,
      period_end: dates.end,
      status: "draft",
      ...boxes,
      warnings,
    };

    if (vatReturn) {
      await supabase.from("vat_returns").update(payload).eq("id", vatReturn.id);
    } else {
      const { data } = await supabase.from("vat_returns").insert(payload).select().single();
      if (data) setVatReturn(data as unknown as VatReturn);
    }
    toast({ title: "Opgeslagen als concept" });
    setSaving(false);
  }, [orgId, year, periodNumber, vatFrequency, boxes, vatReturn, warnings, toast]);

  // Review
  const submitReview = useCallback(async () => {
    if (!vatReturn) {
      await saveAsDraft();
    }
    const id = vatReturn?.id;
    if (!id) return;
    await supabase.from("vat_returns").update({ status: "reviewed", reviewed_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Aangifte gecontroleerd en vergrendeld" });
    await loadReturn();
  }, [vatReturn, saveAsDraft, toast, loadReturn]);

  // File
  const submitFiling = useCallback(async () => {
    const id = vatReturn?.id;
    if (!id) return;
    await supabase.from("vat_returns").update({ status: "filed", filed_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Aangifte ingediend" });
    await loadReturn();
  }, [vatReturn, toast, loadReturn]);

  const updateBox = (key: keyof VatBoxValues, value: number) => {
    setBoxes((prev) => {
      const next = { ...prev, [key]: value };
      next.box_5a_vat = next.box_1a_vat + next.box_1b_vat + next.box_1c_vat + next.box_1d_vat + next.box_1e_vat + next.box_2a_vat + next.box_4a_vat + next.box_4b_vat;
      next.box_5c_vat = next.box_5a_vat - next.box_5b_vat;
      next.box_5f_vat = next.box_5c_vat - next.box_5d_vat - next.box_5e_vat;
      return next;
    });
  };

  return {
    year, setYear,
    periodNumber, setPeriodNumber,
    vatFrequency,
    boxes, updateBox,
    vatReturn,
    drillBox, drillLines, drillInto, setDrillBox,
    warnings,
    loading, saving,
    saveAsDraft, submitReview, submitFiling,
    isLocked: vatReturn?.status === "reviewed" || vatReturn?.status === "filed",
  };
}
