-- Reset 2FA voor aakouk94@hotmail.com
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'aakouk94@hotmail.com' LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found';
    RETURN;
  END IF;

  -- Verwijder MFA factors (TOTP enrollments) in Supabase auth
  DELETE FROM auth.mfa_factors WHERE user_id = v_user_id;

  -- Reset 2FA settings (zet enabled uit, behoud is_required)
  UPDATE public.user_2fa_settings
  SET is_enabled = false,
      enabled_at = NULL,
      last_verified_at = NULL,
      grace_period_start = NOW(),
      updated_at = NOW()
  WHERE user_id = v_user_id;
END $$;