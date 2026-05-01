CREATE OR REPLACE FUNCTION public.claim_referral(
  p_code text,
  p_ip_hash text DEFAULT NULL,
  p_device_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_link public.referral_links;
  v_existing public.referrals;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Bepaal de org van de huidige gebruiker (eerste lidmaatschap)
  SELECT organization_id INTO v_org_id
  FROM public.organization_members
  WHERE user_id = v_user_id
  ORDER BY joined_at ASC NULLS LAST
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_organisation');
  END IF;

  -- Zoek de actieve referral-link
  SELECT * INTO v_link
  FROM public.referral_links
  WHERE code = p_code AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
  END IF;

  -- Anti-self-referral
  IF v_link.organization_id = v_org_id THEN
    INSERT INTO public.referrals (
      referrer_organization_id, referred_organization_id, referred_user_id,
      referral_code, status, rejection_reason, ip_hash, device_hash
    )
    VALUES (
      v_link.organization_id, v_org_id, v_user_id,
      p_code, 'rejected', 'self_referral', p_ip_hash, p_device_hash
    )
    ON CONFLICT DO NOTHING;
    RETURN jsonb_build_object('ok', false, 'reason', 'self_referral');
  END IF;

  -- Bestaande referral voor deze referred org of user?
  SELECT * INTO v_existing FROM public.referrals
  WHERE referred_organization_id = v_org_id OR referred_user_id = v_user_id
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_referred');
  END IF;

  INSERT INTO public.referrals (
    referrer_organization_id, referred_organization_id, referred_user_id,
    referral_code, status, ip_hash, device_hash
  )
  VALUES (
    v_link.organization_id, v_org_id, v_user_id,
    p_code, 'pending', p_ip_hash, p_device_hash
  );

  RETURN jsonb_build_object('ok', true, 'reason', 'pending_first_payment');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_referral(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral(text, text, text) TO authenticated;