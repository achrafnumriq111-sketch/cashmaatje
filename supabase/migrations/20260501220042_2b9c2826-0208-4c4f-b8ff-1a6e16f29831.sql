-- Lock down execute rights on new SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_or_create_referral_link(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_referral_discount(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_org_referral_link() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_or_create_referral_link(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calculate_referral_discount(uuid) TO authenticated, service_role;

-- generate_referral_code is een interne helper -- alleen service role
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO service_role;

-- Set search_path expliciet (voorkomt mutable search_path warning)
ALTER FUNCTION public.generate_referral_code() SET search_path = public;