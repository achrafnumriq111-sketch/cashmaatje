
-- Quotes table for OfferteStudio
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  validity_days INTEGER NOT NULL DEFAULT 30,
  payment_terms TEXT,
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_vat NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  converted_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quotes_org ON public.quotes(organization_id);
CREATE INDEX idx_quotes_status ON public.quotes(organization_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view org quotes" ON public.quotes FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Members insert org quotes" ON public.quotes FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Members update org quotes" ON public.quotes FOR UPDATE
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Members delete org quotes" ON public.quotes FOR DELETE
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Automation workflows table
CREATE TABLE public.automation_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('event','schedule','condition')),
  trigger_label TEXT,
  condition_expr TEXT,
  action_expr TEXT,
  email_template_subject TEXT,
  email_template_body TEXT,
  active BOOLEAN NOT NULL DEFAULT false,
  total_runs INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_workflows_org ON public.automation_workflows(organization_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_workflows TO authenticated;
GRANT ALL ON public.automation_workflows TO service_role;

ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view org workflows" ON public.automation_workflows FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Members insert org workflows" ON public.automation_workflows FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Members update org workflows" ON public.automation_workflows FOR UPDATE
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Members delete org workflows" ON public.automation_workflows FOR DELETE
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.automation_workflows
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
