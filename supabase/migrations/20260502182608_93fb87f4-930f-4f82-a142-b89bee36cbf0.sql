-- Herstel toegang tot is_platform_admin (was geblokkeerd door eerdere REVOKE)
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_platform_role(uuid, platform_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_in_org(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_org_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_feature_enabled(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_referral_discount(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_referral_link(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_demo_organization(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_opening_balance(uuid, date, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_industry_preset(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_memorial_journal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_payroll_journal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_inbox_address(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tier_from_price(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_new_organization(uuid, text, text, org_type, text, text, text, text, text, text, text, text, vat_scheme, vat_frequency, integer, boolean, jsonb) TO authenticated;