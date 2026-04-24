
-- Feature flags: global rollout control
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  enabled_globally BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  enabled_for_test_orgs BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_feature_flags_key ON public.feature_flags(key);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_flags" ON public.feature_flags
  FOR ALL
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "authenticated_read_flags" ON public.feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER trg_feature_flags_updated
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-org override
CREATE TABLE public.org_feature_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE (organization_id, feature_key)
);

CREATE INDEX idx_org_feature_overrides_org ON public.org_feature_overrides(organization_id);
CREATE INDEX idx_org_feature_overrides_key ON public.org_feature_overrides(feature_key);

ALTER TABLE public.org_feature_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_overrides" ON public.org_feature_overrides
  FOR ALL
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "members_read_own_org_overrides" ON public.org_feature_overrides
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_org_ids()));

-- Release notes
CREATE TABLE public.release_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  highlights JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_release_notes_published ON public.release_notes(is_published, published_at DESC);

ALTER TABLE public.release_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_release_notes" ON public.release_notes
  FOR ALL
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "authenticated_read_published_notes" ON public.release_notes
  FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE TRIGGER trg_release_notes_updated
  BEFORE UPDATE ON public.release_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Internal test org flag
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_internal_test_org BOOLEAN NOT NULL DEFAULT FALSE;

-- Allow super admins to read ALL organizations (for admin panel)
CREATE POLICY "super_admin_read_all_orgs" ON public.organizations
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "super_admin_update_orgs" ON public.organizations
  FOR UPDATE
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Super admin sees all members
CREATE POLICY "super_admin_read_all_members" ON public.organization_members
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

-- Super admin sees all subscriptions and module entitlements
CREATE POLICY "super_admin_read_all_subscriptions" ON public.subscriptions
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "super_admin_all_entitlements" ON public.module_entitlements
  FOR ALL
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Helper function for client-side feature flag resolution
CREATE OR REPLACE FUNCTION public.is_feature_enabled(_feature_key TEXT, _org_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_override BOOLEAN;
  v_flag RECORD;
  v_is_test BOOLEAN := FALSE;
  v_hash INTEGER;
BEGIN
  -- 1) Per-org override takes priority
  IF _org_id IS NOT NULL THEN
    SELECT enabled INTO v_override
    FROM org_feature_overrides
    WHERE organization_id = _org_id AND feature_key = _feature_key
    LIMIT 1;
    IF FOUND THEN RETURN v_override; END IF;

    SELECT is_internal_test_org INTO v_is_test
    FROM organizations WHERE id = _org_id;
  END IF;

  -- 2) Look up flag
  SELECT * INTO v_flag FROM feature_flags WHERE key = _feature_key;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- 3) Internal test orgs get all features when allowed
  IF v_is_test AND v_flag.enabled_for_test_orgs THEN RETURN TRUE; END IF;

  -- 4) Global enable
  IF v_flag.enabled_globally THEN RETURN TRUE; END IF;

  -- 5) Rollout percentage based on org id hash
  IF _org_id IS NOT NULL AND v_flag.rollout_percentage > 0 THEN
    v_hash := abs(hashtext(_org_id::text || _feature_key)) % 100;
    RETURN v_hash < v_flag.rollout_percentage;
  END IF;

  RETURN FALSE;
END;
$$;
