
CREATE OR REPLACE FUNCTION public.setup_new_organization(p_org_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO organization_members (organization_id, user_id, role, is_owner, accepted_at)
  VALUES (p_org_id, p_user_id, 'entrepreneur', TRUE, NOW());

  PERFORM seed_chart_of_accounts(p_org_id);
  PERFORM seed_vat_rates(p_org_id);

  INSERT INTO fiscal_periods (organization_id, year, month)
  SELECT p_org_id, EXTRACT(YEAR FROM NOW())::INTEGER, generate_series(1, 12);

  INSERT INTO audit_log (organization_id, user_id, action, entity_type, entity_id, change_summary)
  VALUES (p_org_id, p_user_id, 'create', 'organization', p_org_id, 'Organization created and initial setup completed');
END;
$function$;
