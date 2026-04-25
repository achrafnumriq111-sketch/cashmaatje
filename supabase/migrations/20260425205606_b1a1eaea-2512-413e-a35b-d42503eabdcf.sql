-- 1. Tester flag op organisaties
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_tester boolean NOT NULL DEFAULT false;

-- 2. Feedback tabel
CREATE TABLE IF NOT EXISTS public.app_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  page_path text,
  feedback_type text NOT NULL DEFAULT 'general',
  message text NOT NULL,
  rating int,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_insert_own_feedback"
  ON public.app_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_view_own_feedback"
  ON public.app_feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_admin(auth.uid()));

CREATE POLICY "platform_admin_update_feedback"
  ON public.app_feedback FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_app_feedback_created_at ON public.app_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_feedback_user ON public.app_feedback (user_id);