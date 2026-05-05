
CREATE TABLE IF NOT EXISTS public.tester_credentials (
  user_id uuid PRIMARY KEY,
  organization_id uuid,
  email text NOT NULL,
  password text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tester_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super admins read tester creds" ON public.tester_credentials;
CREATE POLICY "super admins read tester creds"
  ON public.tester_credentials FOR SELECT
  TO authenticated
  USING (public.has_platform_role(auth.uid(), 'super_admin'));
