
-- Fix icp_report_lines
DROP POLICY IF EXISTS "No delete on icp_report_lines" ON public.icp_report_lines;
CREATE POLICY "No delete on icp_report_lines" ON public.icp_report_lines FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS "Insert icp_report_lines via report" ON public.icp_report_lines;
CREATE POLICY "Insert icp_report_lines via report" ON public.icp_report_lines FOR INSERT TO authenticated
WITH CHECK (icp_report_id IN (SELECT id FROM icp_reports WHERE organization_id IN (SELECT get_user_org_ids())));

-- Fix invoice_lines UPDATE
DROP POLICY IF EXISTS "Bookkeeper+ can update invoice_lines" ON public.invoice_lines;
CREATE POLICY "Bookkeeper+ can update invoice_lines" ON public.invoice_lines FOR UPDATE TO authenticated
USING (invoice_id IN (SELECT id FROM invoices WHERE organization_id IN (
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)
)));

-- Fix user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "No delete on user_profiles" ON public.user_profiles;
CREATE POLICY "No delete on user_profiles" ON public.user_profiles FOR DELETE TO authenticated USING (false);

-- Fix vat_return_lines
DROP POLICY IF EXISTS "View vat_return_lines via return" ON public.vat_return_lines;
CREATE POLICY "View vat_return_lines via return" ON public.vat_return_lines FOR SELECT TO authenticated
USING (vat_return_id IN (SELECT id FROM vat_returns WHERE organization_id IN (SELECT get_user_org_ids())));

DROP POLICY IF EXISTS "Insert vat_return_lines via return" ON public.vat_return_lines;
CREATE POLICY "Insert vat_return_lines via return" ON public.vat_return_lines FOR INSERT TO authenticated
WITH CHECK (vat_return_id IN (SELECT id FROM vat_returns WHERE organization_id IN (SELECT get_user_org_ids())));

DROP POLICY IF EXISTS "Update vat_return_lines via return" ON public.vat_return_lines;
CREATE POLICY "Update vat_return_lines via return" ON public.vat_return_lines FOR UPDATE TO authenticated
USING (vat_return_id IN (SELECT id FROM vat_returns WHERE organization_id IN (SELECT get_user_org_ids())));

DROP POLICY IF EXISTS "No delete on vat_return_lines" ON public.vat_return_lines;
CREATE POLICY "No delete on vat_return_lines" ON public.vat_return_lines FOR DELETE TO authenticated USING (false);

-- Fix supplier_patterns
DROP POLICY IF EXISTS "Org members can view supplier_patterns" ON public.supplier_patterns;
CREATE POLICY "Org members can view supplier_patterns" ON public.supplier_patterns FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert supplier_patterns" ON public.supplier_patterns;
CREATE POLICY "Org members can insert supplier_patterns" ON public.supplier_patterns FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update supplier_patterns" ON public.supplier_patterns;
CREATE POLICY "Bookkeeper+ can update supplier_patterns" ON public.supplier_patterns FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

DROP POLICY IF EXISTS "No delete on supplier_patterns" ON public.supplier_patterns;
CREATE POLICY "No delete on supplier_patterns" ON public.supplier_patterns FOR DELETE TO authenticated USING (false);
