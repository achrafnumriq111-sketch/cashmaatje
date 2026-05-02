
-- 1. Fix Function Search Path Mutable for email queue helpers
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;

-- 2. Lock down internal SECURITY DEFINER functions — revoke from anon + authenticated.
-- Trigger functions (called by Postgres triggers, never by users):
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_2fa() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_org_referral_link() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_super_admin_seed() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.bump_thread_on_message() FROM anon, authenticated, public;

-- Email-queue helpers (only invoked by edge functions / cron with service role):
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;

-- Internal helper used only by other SECURITY DEFINER funcs:
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_feature_enabled(text, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_platform_role(uuid, platform_role) FROM anon, public;

-- Demo / seeding (admins only, not authenticated end-users):
REVOKE EXECUTE ON FUNCTION public.seed_demo_data(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_demo_organization(text) FROM anon, public;

-- Functions the app DOES call from the frontend keep authenticated EXECUTE:
-- apply_industry_preset, claim_referral, post_memorial_journal, post_payroll_journal,
-- import_opening_balance, get_or_create_referral_link, calculate_referral_discount,
-- get_user_org_ids, get_user_role_in_org, can_manage_org_members, get_org_inbox_address,
-- setup_new_organization, calculate_vat_return.
-- (No changes needed for these — they remain callable by signed-in users.)

-- 3. Tighten "Authenticated users can create organizations" — require auth.uid() IS NOT NULL
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Deny direct client access to two_factor_recovery_requests (handled by edge functions w/ service role)
CREATE POLICY "No direct client access"
ON public.two_factor_recovery_requests
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 5. Move pg_trgm extension out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
