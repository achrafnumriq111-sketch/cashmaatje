-- 2FA settings per user
CREATE TABLE public.user_2fa_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  enabled_at TIMESTAMPTZ,
  grace_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exempted_until TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own 2fa settings"
  ON public.user_2fa_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own 2fa settings"
  ON public.user_2fa_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own 2fa settings"
  ON public.user_2fa_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_2fa_settings_updated_at
  BEFORE UPDATE ON public.user_2fa_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recovery requests (email reset flow)
CREATE TABLE public.two_factor_recovery_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.two_factor_recovery_requests ENABLE ROW LEVEL SECURITY;

-- No public policies — only service role (edge functions) interacts with this table

CREATE INDEX idx_2fa_recovery_token ON public.two_factor_recovery_requests(token_hash);
CREATE INDEX idx_2fa_recovery_user ON public.two_factor_recovery_requests(user_id);

-- Auto-create 2fa settings row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_2fa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_2fa_settings (user_id, is_required, grace_period_start)
  VALUES (NEW.id, TRUE, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_2fa
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_2fa();

-- Backfill existing users
INSERT INTO public.user_2fa_settings (user_id, is_required, grace_period_start)
SELECT id, TRUE, NOW() FROM auth.users
ON CONFLICT (user_id) DO NOTHING;