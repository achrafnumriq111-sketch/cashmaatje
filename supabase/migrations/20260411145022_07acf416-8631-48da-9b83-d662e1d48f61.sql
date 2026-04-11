CREATE TABLE public.bank_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  match_field TEXT NOT NULL CHECK (match_field IN ('counterparty_name', 'description', 'counterparty_iban', 'payment_reference')),
  match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'contains', 'starts_with', 'regex')),
  match_value TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id),
  contact_id UUID REFERENCES public.contacts(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  times_applied INTEGER NOT NULL DEFAULT 0,
  last_applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org bank rules"
  ON public.bank_rules FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Members can create org bank rules"
  ON public.bank_rules FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Members can update org bank rules"
  ON public.bank_rules FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Members can delete org bank rules"
  ON public.bank_rules FOR DELETE TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE TRIGGER update_bank_rules_updated_at
  BEFORE UPDATE ON public.bank_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_bank_rules_org ON public.bank_rules(organization_id, is_active, priority);