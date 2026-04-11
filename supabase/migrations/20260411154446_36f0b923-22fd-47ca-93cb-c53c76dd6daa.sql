
-- reconciliation_rules
DROP POLICY "Bookkeeper+ can update reconciliation_rules" ON public.reconciliation_rules;
DROP POLICY "Org members can insert reconciliation_rules" ON public.reconciliation_rules;
DROP POLICY "Org members can view reconciliation_rules" ON public.reconciliation_rules;

-- recurring_patterns
DROP POLICY "Bookkeeper+ can update recurring_patterns" ON public.recurring_patterns;
DROP POLICY "Org members can insert recurring_patterns" ON public.recurring_patterns;
DROP POLICY "Org members can view recurring_patterns" ON public.recurring_patterns;

-- tax_reserves
DROP POLICY "Bookkeeper+ can update tax_reserves" ON public.tax_reserves;
DROP POLICY "Org members can insert tax_reserves" ON public.tax_reserves;
DROP POLICY "Org members can view tax_reserves" ON public.tax_reserves;

-- user_profiles
DROP POLICY "Users can view org members profiles" ON public.user_profiles;

-- vat_rates
DROP POLICY "Bookkeeper+ can update vat_rates" ON public.vat_rates;
DROP POLICY "Org members can insert vat_rates" ON public.vat_rates;
DROP POLICY "Org members can view vat_rates" ON public.vat_rates;

-- vat_returns
DROP POLICY "Bookkeeper+ can update vat_returns" ON public.vat_returns;
DROP POLICY "Org members can insert vat_returns" ON public.vat_returns;
DROP POLICY "Org members can view vat_returns" ON public.vat_returns;

-- Re-create them all with authenticated role
CREATE POLICY "Org members can view reconciliation_rules" ON public.reconciliation_rules FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Org members can insert reconciliation_rules" ON public.reconciliation_rules FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Bookkeeper+ can update reconciliation_rules" ON public.reconciliation_rules FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

CREATE POLICY "Org members can view recurring_patterns" ON public.recurring_patterns FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Org members can insert recurring_patterns" ON public.recurring_patterns FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Bookkeeper+ can update recurring_patterns" ON public.recurring_patterns FOR UPDATE TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Org members can view tax_reserves" ON public.tax_reserves FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Org members can insert tax_reserves" ON public.tax_reserves FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Bookkeeper+ can update tax_reserves" ON public.tax_reserves FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

CREATE POLICY "Org members can view vat_rates" ON public.vat_rates FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Org members can insert vat_rates" ON public.vat_rates FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Bookkeeper+ can update vat_rates" ON public.vat_rates FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

CREATE POLICY "Org members can view vat_returns" ON public.vat_returns FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Org members can insert vat_returns" ON public.vat_returns FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Bookkeeper+ can update vat_returns" ON public.vat_returns FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));
