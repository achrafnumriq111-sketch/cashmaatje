
-- reconciliation_rules: drop old public-role policies
DROP POLICY IF EXISTS "Org members can view their reconciliation_rules" ON public.reconciliation_rules;
DROP POLICY IF EXISTS "Org members can insert their reconciliation_rules" ON public.reconciliation_rules;
DROP POLICY IF EXISTS "Bookkeeper+ can update their reconciliation_rules" ON public.reconciliation_rules;

-- recurring_patterns: drop old public-role policies  
DROP POLICY IF EXISTS "Members can view recurring patterns" ON public.recurring_patterns;
DROP POLICY IF EXISTS "Members can create recurring patterns" ON public.recurring_patterns;
DROP POLICY IF EXISTS "Members can update recurring patterns" ON public.recurring_patterns;

-- tax_reserves: drop old public-role policies
DROP POLICY IF EXISTS "Org members can view their tax_reserves" ON public.tax_reserves;
DROP POLICY IF EXISTS "Org members can insert their tax_reserves" ON public.tax_reserves;
DROP POLICY IF EXISTS "Bookkeeper+ can update their tax_reserves" ON public.tax_reserves;

-- vat_rates: drop old public-role policies
DROP POLICY IF EXISTS "Org members can view their vat_rates" ON public.vat_rates;
DROP POLICY IF EXISTS "Org members can insert their vat_rates" ON public.vat_rates;
DROP POLICY IF EXISTS "Bookkeeper+ can update their vat_rates" ON public.vat_rates;

-- vat_returns: drop old public-role policies
DROP POLICY IF EXISTS "Org members can view their vat_returns" ON public.vat_returns;
DROP POLICY IF EXISTS "Org members can insert their vat_returns" ON public.vat_returns;
DROP POLICY IF EXISTS "Bookkeeper+ can update their vat_returns" ON public.vat_returns;

-- supplier_patterns: there might be a leftover "Org members can update supplier_patterns" on public
-- Let me query exact names via a broader approach
DROP POLICY IF EXISTS "Org members can update supplier_patterns" ON public.supplier_patterns;

-- user_profiles: drop old public-role policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
