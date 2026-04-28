import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

export interface Employee {
  id: string;
  organization_id: string;
  full_name: string;
  email: string | null;
  bsn: string | null;
  iban: string | null;
  position: string | null;
  contract_type: "fulltime" | "parttime" | "freelance" | "dga";
  hours_per_week: number | null;
  gross_monthly: number;
  vacation_pct: number | null;
  payroll_tax_table: "wit" | "groen" | null;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
}

export interface PayrollRun {
  id: string;
  organization_id: string;
  period_year: number;
  period_month: number;
  total_gross: number;
  total_net: number;
  total_tax: number;
  total_social: number;
  status: "draft" | "finalized" | "paid";
  finalized_at: string | null;
  created_at: string;
}

export interface PayrollLine {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  gross: number;
  vacation_reserve: number;
  payroll_tax: number;
  social_premiums: number;
  net: number;
}

// Simplified Dutch payroll calculator (indicatief, niet authoritative).
export function calcPayrollLine(emp: Employee) {
  const gross = Number(emp.gross_monthly) || 0;
  const vac = gross * ((Number(emp.vacation_pct) || 0) / 100);
  // Simplified loonheffing: progressive monthly approximation
  const annual = gross * 12;
  let payrollTaxAnnual = 0;
  if (annual <= 38_441) payrollTaxAnnual = annual * 0.357;
  else if (annual <= 76_817) payrollTaxAnnual = 38_441 * 0.357 + (annual - 38_441) * 0.3697;
  else payrollTaxAnnual = 38_441 * 0.357 + (76_817 - 38_441) * 0.3697 + (annual - 76_817) * 0.495;
  const payrollTax = payrollTaxAnnual / 12;
  // Sociale premies werkgever (zvw + ww + wia ~ 18% over gross, voor DGA 0)
  const social = emp.contract_type === "dga" || emp.contract_type === "freelance" ? 0 : gross * 0.18;
  const net = gross - payrollTax;
  return {
    gross: Math.round(gross * 100) / 100,
    vacation_reserve: Math.round(vac * 100) / 100,
    payroll_tax: Math.round(payrollTax * 100) / 100,
    social_premiums: Math.round(social * 100) / 100,
    net: Math.round(net * 100) / 100,
  };
}

export function useEmployees() {
  const { membership } = useOrganization(); const orgId = membership?.organization_id;
  return useQuery({
    queryKey: ["employees", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees" as any)
        .select("*")
        .eq("organization_id", orgId!)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as unknown as Employee[];
    },
  });
}

export function useUpsertEmployee() {
  const qc = useQueryClient();
  const { membership } = useOrganization(); const orgId = membership?.organization_id;
  return useMutation({
    mutationFn: async (e: Partial<Employee> & { full_name: string }) => {
      if (!orgId) throw new Error("No org");
      const payload: any = { ...e, organization_id: orgId! };
      const { data, error } = await supabase
        .from("employees" as any)
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Medewerker opgeslagen");
    },
    onError: (err: any) => toast.error(err?.message ?? "Fout"),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Verwijderd");
    },
  });
}

export function usePayrollRuns() {
  const { membership } = useOrganization(); const orgId = membership?.organization_id;
  return useQuery({
    queryKey: ["payroll_runs", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_runs" as any)
        .select("*")
        .eq("organization_id", orgId!)
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PayrollRun[];
    },
  });
}

export function usePayrollLines(runId: string | null) {
  return useQuery({
    queryKey: ["payroll_lines", runId],
    enabled: !!runId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_run_lines" as any)
        .select("*")
        .eq("payroll_run_id", runId!);
      if (error) throw error;
      return (data ?? []) as unknown as PayrollLine[];
    },
  });
}

export function useGeneratePayrollRun() {
  const qc = useQueryClient();
  const { membership } = useOrganization(); const orgId = membership?.organization_id;
  return useMutation({
    mutationFn: async (input: { year: number; month: number }) => {
      if (!orgId) throw new Error("No org");
      // 1. Get active employees
      const { data: emps, error: ee } = await supabase
        .from("employees" as any)
        .select("*")
        .eq("organization_id", orgId!)
        .eq("active", true);
      if (ee) throw ee;
      const employees = (emps ?? []) as unknown as Employee[];
      if (employees.length === 0) throw new Error("Geen actieve medewerkers");

      // 2. Compute lines
      const lines = employees.map((e) => ({ employee: e, calc: calcPayrollLine(e) }));
      const total_gross = lines.reduce((s, l) => s + l.calc.gross, 0);
      const total_net = lines.reduce((s, l) => s + l.calc.net, 0);
      const total_tax = lines.reduce((s, l) => s + l.calc.payroll_tax, 0);
      const total_social = lines.reduce((s, l) => s + l.calc.social_premiums, 0);

      // 3. Upsert run
      const { data: run, error: re } = await supabase
        .from("payroll_runs" as any)
        .upsert(
          {
            organization_id: orgId!,
            period_year: input.year,
            period_month: input.month,
            total_gross,
            total_net,
            total_tax,
            total_social,
            status: "draft",
          },
          { onConflict: "organization_id,period_year,period_month" }
        )
        .select()
        .single();
      if (re) throw re;

      // 4. Replace lines
      await supabase.from("payroll_run_lines" as any).delete().eq("payroll_run_id", (run as any).id);
      const linesPayload = lines.map((l) => ({
        payroll_run_id: (run as any).id,
        employee_id: l.employee.id,
        ...l.calc,
      }));
      const { error: le } = await supabase.from("payroll_run_lines" as any).insert(linesPayload);
      if (le) throw le;
      return run;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll_runs"] });
      qc.invalidateQueries({ queryKey: ["payroll_lines"] });
      toast.success("Salarisrun gegenereerd");
    },
    onError: (err: any) => toast.error(err?.message ?? "Kon run niet genereren"),
  });
}

export function useFinalizePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payroll_runs" as any)
        .update({ status: "finalized", finalized_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll_runs"] });
      toast.success("Definitief gemaakt");
    },
  });
}
