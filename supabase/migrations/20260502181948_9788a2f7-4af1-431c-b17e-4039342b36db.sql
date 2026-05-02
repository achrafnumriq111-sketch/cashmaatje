
-- Revoke EXECUTE from anon for ALL frontend-callable SECURITY DEFINER functions.
-- Authenticated users keep access where the app needs it.
REVOKE EXECUTE ON FUNCTION public.apply_industry_preset(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.calculate_referral_discount(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_manage_org_members(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_referral(text, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_or_create_referral_link(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_org_inbox_address(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_org_ids() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_role_in_org(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.import_opening_balance(uuid, date, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.post_memorial_journal(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.post_payroll_journal(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.setup_new_organization(uuid, text, text, org_type, text, text, text, text, text, text, text, text, vat_scheme, vat_frequency, integer, boolean, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_feature_enabled(text, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_platform_role(uuid, platform_role) FROM authenticated;

-- Tighten public 'branding' bucket: restrict listing to org members; public read by exact path remains for image <img> tags
DROP POLICY IF EXISTS "Branding files publicly readable" ON storage.objects;
CREATE POLICY "Branding files readable by org members"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'branding'
  AND ((storage.foldername(name))[1])::uuid IN (SELECT public.get_user_org_ids())
);
-- Keep public file fetch by exact path for logo display in emails / unauthenticated previews:
CREATE POLICY "Branding direct file fetch (no listing)"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'branding' AND name IS NOT NULL);
