-- Drop the overly broad ALL policy and replace with explicit narrow ones
DROP POLICY IF EXISTS "Service role can manage subscribers" ON public.subscribers;

CREATE POLICY "Platform admins can update subscribers"
  ON public.subscribers FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can delete subscribers"
  ON public.subscribers FOR DELETE
  USING (public.is_platform_admin());

-- Inserts only via service-role (edge functions); no client INSERT policy needed.