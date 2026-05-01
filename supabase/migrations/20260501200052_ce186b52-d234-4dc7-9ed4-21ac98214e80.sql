-- Recurring Invoice Templates
CREATE TABLE public.recurring_invoice_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  invoice_type public.invoice_type NOT NULL DEFAULT 'sales',
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  contact_name text,
  description text,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  vat_rate_type public.vat_rate_type NOT NULL DEFAULT 'high',
  vat_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL DEFAULT 'EUR',
  frequency text NOT NULL CHECK (frequency IN ('monthly','quarterly','yearly')),
  day_of_month integer NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 28),
  start_date date NOT NULL,
  end_date date,
  next_run_date date NOT NULL,
  last_generated_date date,
  auto_send boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_templates_org ON public.recurring_invoice_templates(organization_id, is_active);
CREATE INDEX idx_recurring_templates_next_run ON public.recurring_invoice_templates(next_run_date) WHERE is_active = true;

ALTER TABLE public.recurring_invoice_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view recurring templates"
  ON public.recurring_invoice_templates FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Org members insert recurring templates"
  ON public.recurring_invoice_templates FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Org members update recurring templates"
  ON public.recurring_invoice_templates FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Bookkeeper+ delete recurring templates"
  ON public.recurring_invoice_templates FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('bookkeeper','accountant','admin')
  ));

CREATE TRIGGER trg_recurring_templates_updated
  BEFORE UPDATE ON public.recurring_invoice_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quarterly checklist items
CREATE TABLE public.quarterly_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  year integer NOT NULL,
  quarter integer NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  item_key text NOT NULL,
  is_checked boolean NOT NULL DEFAULT false,
  checked_at timestamptz,
  checked_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, year, quarter, item_key)
);

CREATE INDEX idx_quarterly_checklist_org ON public.quarterly_checklist_items(organization_id, year, quarter);

ALTER TABLE public.quarterly_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view checklist"
  ON public.quarterly_checklist_items FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Org members insert checklist"
  ON public.quarterly_checklist_items FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Org members update checklist"
  ON public.quarterly_checklist_items FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Bookkeeper+ delete checklist"
  ON public.quarterly_checklist_items FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('bookkeeper','accountant','admin')
  ));

CREATE TRIGGER trg_quarterly_checklist_updated
  BEFORE UPDATE ON public.quarterly_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();