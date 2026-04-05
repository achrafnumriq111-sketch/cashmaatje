
ALTER FUNCTION validate_journal_balance() SET search_path = public;
ALTER FUNCTION enforce_period_lock() SET search_path = public;
ALTER FUNCTION update_invoice_paid_amount() SET search_path = public;
ALTER FUNCTION calculate_vat_return(UUID, DATE, DATE) SET search_path = public;
ALTER FUNCTION get_user_org_ids() SET search_path = public;
ALTER FUNCTION get_user_role_in_org(UUID) SET search_path = public;
ALTER FUNCTION seed_chart_of_accounts(UUID) SET search_path = public;
ALTER FUNCTION seed_vat_rates(UUID) SET search_path = public;
ALTER FUNCTION setup_new_organization(UUID, UUID) SET search_path = public;
