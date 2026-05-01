-- =========================================================
-- REFERRAL DISCOUNT ENGINE — schema
-- =========================================================

-- Stripe coupon reference op organisaties (idempotent updaten in webhook)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stripe_coupon_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- ---------- referral_links ----------
CREATE TABLE IF NOT EXISTS public.referral_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS referral_links_one_active_per_org
  ON public.referral_links (organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS referral_links_code_idx ON public.referral_links (code);

ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read own org referral links"
  ON public.referral_links FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids()));

-- Insert/update/delete alleen via security-definer helper of service role
CREATE POLICY "service role manages referral links"
  ON public.referral_links FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ---------- referrals ----------
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  referred_organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code text NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','first_payment_received','active','inactive','cancelled','rejected')),
  first_payment_at timestamptz,
  activated_at timestamptz,
  cancelled_at timestamptz,
  rejection_reason text,
  ip_hash text,
  device_hash text,
  payment_fingerprint_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS referrals_unique_referred_org
  ON public.referrals (referred_organization_id) WHERE referred_organization_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS referrals_unique_referred_user
  ON public.referrals (referred_user_id) WHERE referred_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS referrals_unique_stripe_customer
  ON public.referrals (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS referrals_referrer_status_idx
  ON public.referrals (referrer_organization_id, status);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read referrals for own org"
  ON public.referrals FOR SELECT
  USING (
    referrer_organization_id IN (SELECT public.get_user_org_ids())
    OR referred_organization_id IN (SELECT public.get_user_org_ids())
  );

CREATE POLICY "service role manages referrals"
  ON public.referrals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- updated_at trigger hergebruiken
DROP TRIGGER IF EXISTS trg_referrals_updated_at ON public.referrals;
CREATE TRIGGER trg_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- referral_discount_snapshots ----------
CREATE TABLE IF NOT EXISTS public.referral_discount_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  active_referrals_count integer NOT NULL DEFAULT 0 CHECK (active_referrals_count >= 0),
  counted_referrals_count integer NOT NULL DEFAULT 0 CHECK (counted_referrals_count BETWEEN 0 AND 10),
  base_price_cents integer NOT NULL DEFAULT 2599,
  discount_cents integer NOT NULL DEFAULT 0 CHECK (discount_cents BETWEEN 0 AND 1000),
  final_price_cents integer NOT NULL DEFAULT 2599 CHECK (final_price_cents >= 1599),
  stripe_customer_id text,
  stripe_subscription_id text,
  notes text,
  calculated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rds_org_calc_idx
  ON public.referral_discount_snapshots (organization_id, calculated_at DESC);

ALTER TABLE public.referral_discount_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read own org discount snapshots"
  ON public.referral_discount_snapshots FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "service role writes discount snapshots"
  ON public.referral_discount_snapshots FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =========================================================
-- HELPERS
-- =========================================================

-- Genereer korte unieke code: CASH-XXXXXX
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_attempt int := 0;
BEGIN
  LOOP
    v_code := 'CASH-' || (
      SELECT string_agg(substr(v_chars, ceil(random() * length(v_chars))::int, 1), '')
      FROM generate_series(1, 6)
    );
    IF NOT EXISTS (SELECT 1 FROM public.referral_links WHERE code = v_code) THEN
      RETURN v_code;
    END IF;
    v_attempt := v_attempt + 1;
    IF v_attempt > 10 THEN
      RAISE EXCEPTION 'Could not generate unique referral code';
    END IF;
  END LOOP;
END;
$$;

-- Maakt actieve referral-link aan voor org indien die ontbreekt
CREATE OR REPLACE FUNCTION public.get_or_create_referral_link(p_org_id uuid)
RETURNS public.referral_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link public.referral_links;
BEGIN
  -- Authorisatie: alleen leden van de org of service_role
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorised for organisation %', p_org_id;
  END IF;

  SELECT * INTO v_link FROM public.referral_links
  WHERE organization_id = p_org_id AND is_active = true
  LIMIT 1;

  IF FOUND THEN
    RETURN v_link;
  END IF;

  INSERT INTO public.referral_links (organization_id, created_by, code)
  VALUES (p_org_id, auth.uid(), public.generate_referral_code())
  RETURNING * INTO v_link;

  RETURN v_link;
END;
$$;

-- Centrale berekening — pure (geen writes)
CREATE OR REPLACE FUNCTION public.calculate_referral_discount(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active int;
  v_counted int;
  v_base int := 2599;
  v_discount int;
  v_final int;
BEGIN
  SELECT COUNT(*)::int INTO v_active
  FROM public.referrals
  WHERE referrer_organization_id = p_org_id
    AND status = 'active';

  v_counted := LEAST(v_active, 10);
  v_discount := LEAST(v_counted * 100, 1000);
  v_final := GREATEST(v_base - v_discount, 1599);

  RETURN jsonb_build_object(
    'active_referrals', v_active,
    'counted_referrals', v_counted,
    'max_referrals', 10,
    'base_price_cents', v_base,
    'discount_cents', v_discount,
    'final_price_cents', v_final,
    'next_referral_price_cents', GREATEST(v_base - LEAST((v_counted + 1) * 100, 1000), 1599)
  );
END;
$$;

-- =========================================================
-- AUTO-LINK BIJ ORG-CREATION
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_org_referral_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.referral_links (organization_id, code)
  VALUES (NEW.id, public.generate_referral_code())
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_create_referral_link ON public.organizations;
CREATE TRIGGER trg_org_create_referral_link
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_org_referral_link();

-- Backfill referral-links voor bestaande orgs
INSERT INTO public.referral_links (organization_id, code)
SELECT o.id, public.generate_referral_code()
FROM public.organizations o
LEFT JOIN public.referral_links rl
  ON rl.organization_id = o.id AND rl.is_active = true
WHERE rl.id IS NULL;