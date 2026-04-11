
-- Business expenses
CREATE TABLE public.business_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  year integer NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'overig',
  frequency text NOT NULL DEFAULT 'maandelijks',
  amount numeric(14,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view business_expenses" ON public.business_expenses FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Org members can insert business_expenses" ON public.business_expenses FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Bookkeeper+ can update business_expenses" ON public.business_expenses FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['bookkeeper','accountant','admin','entrepreneur']::user_role[])));
CREATE POLICY "Bookkeeper+ can delete business_expenses" ON public.business_expenses FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['bookkeeper','accountant','admin','entrepreneur']::user_role[])));

CREATE TRIGGER update_business_expenses_updated_at BEFORE UPDATE ON public.business_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Depreciations
CREATE TABLE public.depreciations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  purchase_date date NOT NULL,
  purchase_amount numeric(14,2) NOT NULL,
  residual_value numeric(14,2) NOT NULL DEFAULT 0,
  useful_life_years integer NOT NULL DEFAULT 5,
  depreciation_method text NOT NULL DEFAULT 'linear',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.depreciations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view depreciations" ON public.depreciations FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Org members can insert depreciations" ON public.depreciations FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Bookkeeper+ can update depreciations" ON public.depreciations FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['bookkeeper','accountant','admin','entrepreneur']::user_role[])));
CREATE POLICY "Bookkeeper+ can delete depreciations" ON public.depreciations FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['bookkeeper','accountant','admin','entrepreneur']::user_role[])));

CREATE TRIGGER update_depreciations_updated_at BEFORE UPDATE ON public.depreciations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Deductible premiums
CREATE TABLE public.deductible_premiums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  year integer NOT NULL,
  premium_type text NOT NULL DEFAULT 'aov',
  name text NOT NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.deductible_premiums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view deductible_premiums" ON public.deductible_premiums FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Org members can insert deductible_premiums" ON public.deductible_premiums FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Bookkeeper+ can update deductible_premiums" ON public.deductible_premiums FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['bookkeeper','accountant','admin','entrepreneur']::user_role[])));
CREATE POLICY "Bookkeeper+ can delete deductible_premiums" ON public.deductible_premiums FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['bookkeeper','accountant','admin','entrepreneur']::user_role[])));

CREATE TRIGGER update_deductible_premiums_updated_at BEFORE UPDATE ON public.deductible_premiums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Company car
CREATE TABLE public.company_car (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  year integer NOT NULL,
  car_name text NOT NULL,
  catalog_value numeric(14,2) NOT NULL DEFAULT 0,
  addition_percentage numeric(5,2) NOT NULL DEFAULT 22,
  use_km_allowance boolean NOT NULL DEFAULT false,
  km_per_year integer DEFAULT 0,
  km_rate numeric(5,2) DEFAULT 0.23,
  fixed_costs numeric(14,2) NOT NULL DEFAULT 0,
  maintenance_costs numeric(14,2) NOT NULL DEFAULT 0,
  fuel_costs numeric(14,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.company_car ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view company_car" ON public.company_car FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Org members can insert company_car" ON public.company_car FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Bookkeeper+ can update company_car" ON public.company_car FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['bookkeeper','accountant','admin','entrepreneur']::user_role[])));
CREATE POLICY "Bookkeeper+ can delete company_car" ON public.company_car FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['bookkeeper','accountant','admin','entrepreneur']::user_role[])));

CREATE TRIGGER update_company_car_updated_at BEFORE UPDATE ON public.company_car FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mortgage deduction
CREATE TABLE public.mortgage_deduction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  year integer NOT NULL,
  mortgage_interest_annual numeric(14,2) NOT NULL DEFAULT 0,
  financing_costs numeric(14,2) NOT NULL DEFAULT 0,
  ground_lease_annual numeric(14,2) NOT NULL DEFAULT 0,
  woz_value numeric(14,2) DEFAULT 0,
  eigenwoningforfait_percentage numeric(5,4) DEFAULT 0.0035,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.mortgage_deduction ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view mortgage_deduction" ON public.mortgage_deduction FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Org members can insert mortgage_deduction" ON public.mortgage_deduction FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Bookkeeper+ can update mortgage_deduction" ON public.mortgage_deduction FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['bookkeeper','accountant','admin','entrepreneur']::user_role[])));
CREATE POLICY "Bookkeeper+ can delete mortgage_deduction" ON public.mortgage_deduction FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() AND organization_members.role = ANY(ARRAY['bookkeeper','accountant','admin','entrepreneur']::user_role[])));

CREATE TRIGGER update_mortgage_deduction_updated_at BEFORE UPDATE ON public.mortgage_deduction FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
