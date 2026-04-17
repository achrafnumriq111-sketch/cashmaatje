-- Module entitlements per org
CREATE TABLE public.module_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  source text NOT NULL DEFAULT 'plan',
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, module_key)
);

ALTER TABLE public.module_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view module_entitlements"
  ON public.module_entitlements FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Admins can insert module_entitlements"
  ON public.module_entitlements FOR INSERT TO authenticated
  WITH CHECK (can_manage_org_members(organization_id));

CREATE POLICY "Admins can update module_entitlements"
  ON public.module_entitlements FOR UPDATE TO authenticated
  USING (can_manage_org_members(organization_id));

CREATE POLICY "Admins can delete module_entitlements"
  ON public.module_entitlements FOR DELETE TO authenticated
  USING (can_manage_org_members(organization_id));

-- Referral codes per user
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  total_invites integer NOT NULL DEFAULT 0,
  successful_invites integer NOT NULL DEFAULT 0,
  total_revenue_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code"
  ON public.referral_codes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own referral code"
  ON public.referral_codes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own referral code"
  ON public.referral_codes FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Referral invites
CREATE TABLE public.referral_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  referral_code text NOT NULL,
  invited_email text,
  invited_name text,
  status text NOT NULL DEFAULT 'invited',
  signed_up_user_id uuid,
  signed_up_at timestamptz,
  converted_at timestamptz,
  reward_granted boolean NOT NULL DEFAULT false,
  reward_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrer can view own invites"
  ON public.referral_invites FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid());

CREATE POLICY "Referrer can create own invites"
  ON public.referral_invites FOR INSERT TO authenticated
  WITH CHECK (referrer_user_id = auth.uid());

CREATE POLICY "Referrer can update own invites"
  ON public.referral_invites FOR UPDATE TO authenticated
  USING (referrer_user_id = auth.uid());

CREATE POLICY "Referrer can delete own invites"
  ON public.referral_invites FOR DELETE TO authenticated
  USING (referrer_user_id = auth.uid());

-- Auto-update timestamp
CREATE TRIGGER set_referral_codes_updated_at
  BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_referral_invites_updated_at
  BEFORE UPDATE ON public.referral_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_module_entitlements_org ON public.module_entitlements(organization_id);
CREATE INDEX idx_referral_invites_referrer ON public.referral_invites(referrer_user_id);
CREATE INDEX idx_referral_invites_code ON public.referral_invites(referral_code);