
CREATE TABLE IF NOT EXISTS public.vpb_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  fiscal_year int NOT NULL,
  taxable_profit numeric(14,2) NOT NULL DEFAULT 0,
  loss_carryforward numeric(14,2) NOT NULL DEFAULT 0,
  innovation_box_amount numeric(14,2) NOT NULL DEFAULT 0,
  tax_low_bracket numeric(14,2) NOT NULL DEFAULT 0,
  tax_high_bracket numeric(14,2) NOT NULL DEFAULT 0,
  total_tax numeric(14,2) NOT NULL DEFAULT 0,
  effective_rate numeric(5,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  filed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, fiscal_year)
);
ALTER TABLE public.vpb_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vpb_select" ON public.vpb_returns FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "vpb_insert" ON public.vpb_returns FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "vpb_update" ON public.vpb_returns FOR UPDATE USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "vpb_delete" ON public.vpb_returns FOR DELETE USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE TRIGGER vpb_returns_updated_at BEFORE UPDATE ON public.vpb_returns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  bsn text,
  iban text,
  position text,
  contract_type text NOT NULL DEFAULT 'fulltime',
  hours_per_week numeric(5,2) DEFAULT 40,
  gross_monthly numeric(12,2) NOT NULL DEFAULT 0,
  vacation_pct numeric(5,2) DEFAULT 8.0,
  payroll_tax_table text DEFAULT 'wit',
  start_date date,
  end_date date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emp_select" ON public.employees FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "emp_insert" ON public.employees FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "emp_update" ON public.employees FOR UPDATE USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "emp_delete" ON public.employees FOR DELETE USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE TRIGGER employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_year int NOT NULL,
  period_month int NOT NULL,
  total_gross numeric(14,2) NOT NULL DEFAULT 0,
  total_net numeric(14,2) NOT NULL DEFAULT 0,
  total_tax numeric(14,2) NOT NULL DEFAULT 0,
  total_social numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, period_year, period_month)
);
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prr_select" ON public.payroll_runs FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "prr_insert" ON public.payroll_runs FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "prr_update" ON public.payroll_runs FOR UPDATE USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "prr_delete" ON public.payroll_runs FOR DELETE USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE TRIGGER payroll_runs_updated_at BEFORE UPDATE ON public.payroll_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.payroll_run_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id uuid NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  gross numeric(12,2) NOT NULL DEFAULT 0,
  vacation_reserve numeric(12,2) NOT NULL DEFAULT 0,
  payroll_tax numeric(12,2) NOT NULL DEFAULT 0,
  social_premiums numeric(12,2) NOT NULL DEFAULT 0,
  net numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payroll_run_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prl_select" ON public.payroll_run_lines FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.payroll_runs r WHERE r.id = payroll_run_id AND r.organization_id IN (SELECT public.get_user_org_ids())));
CREATE POLICY "prl_insert" ON public.payroll_run_lines FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.payroll_runs r WHERE r.id = payroll_run_id AND r.organization_id IN (SELECT public.get_user_org_ids())));
CREATE POLICY "prl_update" ON public.payroll_run_lines FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.payroll_runs r WHERE r.id = payroll_run_id AND r.organization_id IN (SELECT public.get_user_org_ids())));
CREATE POLICY "prl_delete" ON public.payroll_run_lines FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.payroll_runs r WHERE r.id = payroll_run_id AND r.organization_id IN (SELECT public.get_user_org_ids())));
