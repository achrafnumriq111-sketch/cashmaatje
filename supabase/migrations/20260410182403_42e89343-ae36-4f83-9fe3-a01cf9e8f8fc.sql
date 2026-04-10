
CREATE OR REPLACE FUNCTION public.setup_new_organization(
  p_user_id uuid,
  p_name text,
  p_legal_name text DEFAULT NULL,
  p_org_type org_type DEFAULT 'eenmanszaak',
  p_kvk_number text DEFAULT NULL,
  p_btw_number text DEFAULT NULL,
  p_address_street text DEFAULT NULL,
  p_address_postal_code text DEFAULT NULL,
  p_address_city text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_website text DEFAULT NULL,
  p_vat_scheme vat_scheme DEFAULT 'standard',
  p_vat_frequency vat_frequency DEFAULT 'quarterly',
  p_fiscal_year_start_month integer DEFAULT 1,
  p_kor_eligible boolean DEFAULT false,
  p_settings jsonb DEFAULT '{}'
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id uuid;
BEGIN
  -- Create organization
  INSERT INTO organizations (
    name, legal_name, org_type, kvk_number, btw_number,
    address_street, address_postal_code, address_city,
    email, phone, website, vat_scheme, vat_frequency,
    fiscal_year_start_month, kor_eligible, settings
  ) VALUES (
    p_name, COALESCE(p_legal_name, p_name), p_org_type, p_kvk_number, p_btw_number,
    p_address_street, p_address_postal_code, p_address_city,
    p_email, p_phone, p_website, p_vat_scheme, p_vat_frequency,
    p_fiscal_year_start_month, p_kor_eligible, p_settings
  ) RETURNING id INTO v_org_id;

  -- Add user as owner
  INSERT INTO organization_members (organization_id, user_id, role, is_owner, accepted_at)
  VALUES (v_org_id, p_user_id, 'entrepreneur', TRUE, NOW());

  -- Seed chart of accounts and VAT rates
  PERFORM seed_chart_of_accounts(v_org_id);
  PERFORM seed_vat_rates(v_org_id);

  -- Create fiscal periods for current year
  INSERT INTO fiscal_periods (organization_id, year, month)
  SELECT v_org_id, EXTRACT(YEAR FROM NOW())::INTEGER, generate_series(1, 12);

  -- Audit log
  INSERT INTO audit_log (organization_id, user_id, action, entity_type, entity_id, change_summary)
  VALUES (v_org_id, p_user_id, 'create', 'organization', v_org_id, 'Organization created and initial setup completed');

  RETURN v_org_id;
END;
$function$;
