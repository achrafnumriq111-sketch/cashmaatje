-- ============================================================
-- 1. PLATFORM ROLES (super_admin, support_agent)
-- ============================================================
CREATE TYPE public.platform_role AS ENUM ('super_admin', 'support_agent');

CREATE TABLE public.platform_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.platform_role NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- Security definer helper to avoid recursion
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_platform_role(_user_id uuid, _role public.platform_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Users can view their own platform roles"
  ON public.platform_roles FOR SELECT
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "Only super_admins can grant platform roles"
  ON public.platform_roles FOR INSERT
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Only super_admins can revoke platform roles"
  ON public.platform_roles FOR DELETE
  USING (public.is_platform_admin());

-- Auto-grant super_admin to info@cashmaatje.com on signup/login
CREATE OR REPLACE FUNCTION public.handle_super_admin_seed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'info@cashmaatje.com' THEN
    INSERT INTO public.platform_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_super_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_super_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_super_admin_seed();

-- Backfill if user already exists
INSERT INTO public.platform_roles (user_id, role)
SELECT id, 'super_admin' FROM auth.users
WHERE email = 'info@cashmaatje.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================
-- 2. SUBSCRIPTION PLANS + SUBSCRIBERS
-- ============================================================
CREATE TYPE public.plan_tier AS ENUM ('start', 'smart', 'pro');
CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'incomplete');

CREATE TABLE public.subscription_plans (
  tier public.plan_tier PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_monthly_cents integer NOT NULL,
  stripe_price_id_monthly text,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  modules text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_recommended boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are public" ON public.subscription_plans FOR SELECT USING (true);

INSERT INTO public.subscription_plans (tier, name, description, price_monthly_cents, features, limits, modules, is_recommended, sort_order) VALUES
  ('start', 'Start', 'Voor kleine ondernemingen die simpel willen boekhouden.', 3900,
   '{"ai_bookkeeping":"basic","ai_bank_matching":"limited","ai_invoice_processing":"limited","debtor_reminders":false,"integrations":"basic","approval_flows":false,"accountant_access":true}'::jsonb,
   '{"users":1,"administrations":1,"sales_invoices_per_month":50,"bank_connections":1}'::jsonb,
   ARRAY['dashboard','transactions','invoices','documents','vat','reports_basic'], false, 1),
  ('smart', 'Smart', 'Voor groeiende bedrijven die AI hun boekhouding willen laten automatiseren.', 7900,
   '{"ai_bookkeeping":"full","ai_bank_matching":"included","ai_invoice_processing":"included","debtor_reminders":true,"integrations":"most","approval_flows":"basic","accountant_access":true}'::jsonb,
   '{"users":3,"administrations":2,"sales_invoices_per_month":-1,"bank_connections":-1}'::jsonb,
   ARRAY['dashboard','transactions','invoices','documents','vat','reports_basic','financial_intelligence','annual_report','automation_center'], true, 2),
  ('pro', 'Pro', 'Voor teams die geavanceerde controle, rapporten en integraties nodig hebben.', 14900,
   '{"ai_bookkeeping":"full","ai_bank_matching":"included","ai_invoice_processing":"included","debtor_reminders":true,"integrations":"advanced_api","approval_flows":"advanced","accountant_access":true}'::jsonb,
   '{"users":10,"administrations":5,"sales_invoices_per_month":-1,"bank_connections":-1}'::jsonb,
   ARRAY['dashboard','transactions','invoices','documents','vat','reports_basic','financial_intelligence','annual_report','audit_dossier','automation_center','contract_intelligence','compliance_check','stakeholder_crm','corporate_structure','process_flows','theme_studio'], false, 3);

CREATE TABLE public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  tier public.plan_tier,
  status public.subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  trial_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX idx_subscribers_stripe_customer ON public.subscribers(stripe_customer_id);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscribers FOR SELECT
  USING (user_id = auth.uid() OR public.is_platform_admin());

-- Inserts/updates only via edge functions (service_role)
CREATE POLICY "Service role can manage subscribers"
  ON public.subscribers FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. BROADCASTS (admin -> users)
-- ============================================================
CREATE TYPE public.broadcast_audience AS ENUM ('all', 'plan_start', 'plan_smart', 'plan_pro', 'no_subscription');
CREATE TYPE public.broadcast_kind AS ENUM ('info', 'warning', 'success', 'announcement');

CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  kind public.broadcast_kind NOT NULL DEFAULT 'info',
  audience public.broadcast_audience NOT NULL DEFAULT 'all',
  cta_label text,
  cta_url text,
  show_as_banner boolean NOT NULL DEFAULT false,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_broadcasts_active ON public.broadcasts(starts_at, ends_at);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active broadcasts are visible to all authenticated users"
  ON public.broadcasts FOR SELECT
  TO authenticated
  USING (
    starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
  );

CREATE POLICY "Platform admins can manage broadcasts"
  ON public.broadcasts FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE TABLE public.broadcast_reads (
  broadcast_id uuid NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  dismissed boolean NOT NULL DEFAULT false,
  PRIMARY KEY (broadcast_id, user_id)
);

ALTER TABLE public.broadcast_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own read state"
  ON public.broadcast_reads FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 4. SUPPORT THREADS (1-on-1 user <-> admin)
-- ============================================================
CREATE TYPE public.thread_status AS ENUM ('open', 'pending', 'resolved', 'closed');

CREATE TABLE public.support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status public.thread_status NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_for_user boolean NOT NULL DEFAULT false,
  unread_for_admin boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_threads_user ON public.support_threads(user_id, last_message_at DESC);
CREATE INDEX idx_threads_admin ON public.support_threads(status, last_message_at DESC);

ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own threads"
  ON public.support_threads FOR SELECT
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "Users can create their own threads"
  ON public.support_threads FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users and admins can update their threads"
  ON public.support_threads FOR UPDATE
  USING (user_id = auth.uid() OR public.is_platform_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_platform_admin());

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  sender_is_admin boolean NOT NULL DEFAULT false,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_thread ON public.support_messages(thread_id, created_at);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see messages in their threads"
  ON public.support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = thread_id
        AND (t.user_id = auth.uid() OR public.is_platform_admin())
    )
  );

CREATE POLICY "Users and admins can post messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = thread_id
        AND (t.user_id = auth.uid() OR public.is_platform_admin())
    )
  );

-- Bump thread on new message
CREATE OR REPLACE FUNCTION public.bump_thread_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.support_threads
  SET last_message_at = NEW.created_at,
      unread_for_user = CASE WHEN NEW.sender_is_admin THEN true ELSE unread_for_user END,
      unread_for_admin = CASE WHEN NEW.sender_is_admin THEN unread_for_admin ELSE true END,
      status = CASE WHEN status = 'closed' THEN 'open' ELSE status END
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_thread
  AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_thread_on_message();

-- ============================================================
-- 5. REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscribers;

ALTER TABLE public.broadcasts REPLICA IDENTITY FULL;
ALTER TABLE public.support_threads REPLICA IDENTITY FULL;
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER TABLE public.subscribers REPLICA IDENTITY FULL;