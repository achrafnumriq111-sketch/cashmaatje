
CREATE TABLE public.tax_deductions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  year integer NOT NULL,
  
  -- Zelfstandigenaftrek
  zelfstandigenaftrek_enabled boolean NOT NULL DEFAULT true,
  zelfstandigenaftrek_amount numeric(10,2) NOT NULL DEFAULT 3750.00,
  
  -- Startersaftrek
  startersaftrek_enabled boolean NOT NULL DEFAULT false,
  startersaftrek_amount numeric(10,2) NOT NULL DEFAULT 2123.00,
  
  -- MKB-winstvrijstelling (14%)
  mkb_winstvrijstelling_enabled boolean NOT NULL DEFAULT true,
  mkb_winstvrijstelling_percentage numeric(5,2) NOT NULL DEFAULT 13.31,
  
  -- Meewerkaftrek
  meewerkaftrek_enabled boolean NOT NULL DEFAULT false,
  meewerkaftrek_amount numeric(10,2) NOT NULL DEFAULT 0.00,
  
  -- Stakingsaftrek
  stakingsaftrek_enabled boolean NOT NULL DEFAULT false,
  stakingsaftrek_amount numeric(10,2) NOT NULL DEFAULT 3630.00,
  
  -- FOR (Fiscale Oudedagsreserve)
  for_enabled boolean NOT NULL DEFAULT false,
  for_percentage numeric(5,2) NOT NULL DEFAULT 9.44,
  for_max_amount numeric(10,2) NOT NULL DEFAULT 9632.00,
  
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id, year)
);

ALTER TABLE public.tax_deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view tax_deductions"
ON public.tax_deductions FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Org members can insert tax_deductions"
ON public.tax_deductions FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Bookkeeper+ can update tax_deductions"
ON public.tax_deductions FOR UPDATE TO authenticated
USING (organization_id IN (
  SELECT om.organization_id FROM organization_members om
  WHERE om.user_id = auth.uid()
    AND om.role = ANY(ARRAY['bookkeeper'::user_role,'accountant'::user_role,'admin'::user_role,'entrepreneur'::user_role])
));

CREATE POLICY "No delete on tax_deductions"
ON public.tax_deductions FOR DELETE TO authenticated
USING (false);

CREATE TRIGGER update_tax_deductions_updated_at
BEFORE UPDATE ON public.tax_deductions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
