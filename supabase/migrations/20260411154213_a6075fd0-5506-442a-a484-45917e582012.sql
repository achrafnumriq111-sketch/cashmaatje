
-- 1. Remove leftover broad storage policy
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents files" ON storage.objects;

-- 2. Fix all RLS policies from public to authenticated role
-- We'll do this per table systematically

-- accounts
DROP POLICY IF EXISTS "Org members can view accounts" ON public.accounts;
CREATE POLICY "Org members can view accounts" ON public.accounts FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert accounts" ON public.accounts;
CREATE POLICY "Org members can insert accounts" ON public.accounts FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update accounts" ON public.accounts;
CREATE POLICY "Bookkeeper+ can update accounts" ON public.accounts FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- ai_decisions
DROP POLICY IF EXISTS "Org members can view ai_decisions" ON public.ai_decisions;
CREATE POLICY "Org members can view ai_decisions" ON public.ai_decisions FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert ai_decisions" ON public.ai_decisions;
CREATE POLICY "Org members can insert ai_decisions" ON public.ai_decisions FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update ai_decisions" ON public.ai_decisions;
CREATE POLICY "Bookkeeper+ can update ai_decisions" ON public.ai_decisions FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- anomalies
DROP POLICY IF EXISTS "Org members can view anomalies" ON public.anomalies;
CREATE POLICY "Org members can view anomalies" ON public.anomalies FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert anomalies" ON public.anomalies;
CREATE POLICY "Org members can insert anomalies" ON public.anomalies FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update anomalies" ON public.anomalies;
CREATE POLICY "Bookkeeper+ can update anomalies" ON public.anomalies FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- audit_log (already fixed, just ensure role)
DROP POLICY IF EXISTS "No one can delete audit_log" ON public.audit_log;
CREATE POLICY "No one can delete audit_log" ON public.audit_log FOR DELETE TO authenticated USING (false);
DROP POLICY IF EXISTS "No one can update audit_log" ON public.audit_log;
CREATE POLICY "No one can update audit_log" ON public.audit_log FOR UPDATE TO authenticated USING (false);

-- bank_accounts
DROP POLICY IF EXISTS "Org members can view bank_accounts" ON public.bank_accounts;
CREATE POLICY "Org members can view bank_accounts" ON public.bank_accounts FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert bank_accounts" ON public.bank_accounts;
CREATE POLICY "Org members can insert bank_accounts" ON public.bank_accounts FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update bank_accounts" ON public.bank_accounts;
CREATE POLICY "Bookkeeper+ can update bank_accounts" ON public.bank_accounts FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- bank_transactions
DROP POLICY IF EXISTS "Org members can view bank_transactions" ON public.bank_transactions;
CREATE POLICY "Org members can view bank_transactions" ON public.bank_transactions FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert bank_transactions" ON public.bank_transactions;
CREATE POLICY "Org members can insert bank_transactions" ON public.bank_transactions FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update bank_transactions" ON public.bank_transactions;
CREATE POLICY "Bookkeeper+ can update bank_transactions" ON public.bank_transactions FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- cashflow_entries
DROP POLICY IF EXISTS "Org members can view cashflow_entries" ON public.cashflow_entries;
CREATE POLICY "Org members can view cashflow_entries" ON public.cashflow_entries FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert cashflow_entries" ON public.cashflow_entries;
CREATE POLICY "Org members can insert cashflow_entries" ON public.cashflow_entries FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update cashflow_entries" ON public.cashflow_entries;
CREATE POLICY "Bookkeeper+ can update cashflow_entries" ON public.cashflow_entries FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- contacts
DROP POLICY IF EXISTS "Org members can view contacts" ON public.contacts;
CREATE POLICY "Org members can view contacts" ON public.contacts FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert contacts" ON public.contacts;
CREATE POLICY "Org members can insert contacts" ON public.contacts FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update contacts" ON public.contacts;
CREATE POLICY "Bookkeeper+ can update contacts" ON public.contacts FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- documents
DROP POLICY IF EXISTS "Org members can view documents" ON public.documents;
CREATE POLICY "Org members can view documents" ON public.documents FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert documents" ON public.documents;
CREATE POLICY "Org members can insert documents" ON public.documents FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update documents" ON public.documents;
CREATE POLICY "Bookkeeper+ can update documents" ON public.documents FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- financial_health_snapshots
DROP POLICY IF EXISTS "Org members can view financial_health_snapshots" ON public.financial_health_snapshots;
CREATE POLICY "Org members can view financial_health_snapshots" ON public.financial_health_snapshots FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert financial_health_snapshots" ON public.financial_health_snapshots;
CREATE POLICY "Org members can insert financial_health_snapshots" ON public.financial_health_snapshots FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update financial_health_snapshots" ON public.financial_health_snapshots;
CREATE POLICY "Bookkeeper+ can update financial_health_snapshots" ON public.financial_health_snapshots FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- fiscal_periods
DROP POLICY IF EXISTS "Org members can view fiscal_periods" ON public.fiscal_periods;
CREATE POLICY "Org members can view fiscal_periods" ON public.fiscal_periods FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert fiscal_periods" ON public.fiscal_periods;
CREATE POLICY "Org members can insert fiscal_periods" ON public.fiscal_periods FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update fiscal_periods" ON public.fiscal_periods;
CREATE POLICY "Bookkeeper+ can update fiscal_periods" ON public.fiscal_periods FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- icp_reports
DROP POLICY IF EXISTS "Org members can view icp_reports" ON public.icp_reports;
CREATE POLICY "Org members can view icp_reports" ON public.icp_reports FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert icp_reports" ON public.icp_reports;
CREATE POLICY "Org members can insert icp_reports" ON public.icp_reports FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update icp_reports" ON public.icp_reports;
CREATE POLICY "Bookkeeper+ can update icp_reports" ON public.icp_reports FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- icp_report_lines
DROP POLICY IF EXISTS "View icp_report_lines via report" ON public.icp_report_lines;
CREATE POLICY "View icp_report_lines via report" ON public.icp_report_lines FOR SELECT TO authenticated
USING (icp_report_id IN (SELECT id FROM icp_reports WHERE organization_id IN (SELECT get_user_org_ids())));

-- invoices
DROP POLICY IF EXISTS "Org members can view invoices" ON public.invoices;
CREATE POLICY "Org members can view invoices" ON public.invoices FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert invoices" ON public.invoices;
CREATE POLICY "Org members can insert invoices" ON public.invoices FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update invoices" ON public.invoices;
CREATE POLICY "Bookkeeper+ can update invoices" ON public.invoices FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- invoice_lines
DROP POLICY IF EXISTS "View invoice lines via invoice" ON public.invoice_lines;
CREATE POLICY "View invoice lines via invoice" ON public.invoice_lines FOR SELECT TO authenticated
USING (invoice_id IN (SELECT id FROM invoices WHERE organization_id IN (SELECT get_user_org_ids())));

DROP POLICY IF EXISTS "Insert invoice lines via invoice" ON public.invoice_lines;
CREATE POLICY "Insert invoice lines via invoice" ON public.invoice_lines FOR INSERT TO authenticated
WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE organization_id IN (SELECT get_user_org_ids())));

-- journal_entries
DROP POLICY IF EXISTS "Org members can view journal_entries" ON public.journal_entries;
CREATE POLICY "Org members can view journal_entries" ON public.journal_entries FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert journal_entries" ON public.journal_entries;
CREATE POLICY "Org members can insert journal_entries" ON public.journal_entries FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update journal_entries" ON public.journal_entries;
CREATE POLICY "Bookkeeper+ can update journal_entries" ON public.journal_entries FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- journal_lines
DROP POLICY IF EXISTS "View journal lines via entry" ON public.journal_lines;
CREATE POLICY "View journal lines via entry" ON public.journal_lines FOR SELECT TO authenticated
USING (journal_entry_id IN (SELECT id FROM journal_entries WHERE organization_id IN (SELECT get_user_org_ids())));

DROP POLICY IF EXISTS "Insert journal lines via entry" ON public.journal_lines;
CREATE POLICY "Insert journal lines via entry" ON public.journal_lines FOR INSERT TO authenticated
WITH CHECK (journal_entry_id IN (SELECT id FROM journal_entries WHERE organization_id IN (SELECT get_user_org_ids())));

-- notifications
DROP POLICY IF EXISTS "Org members can view notifications" ON public.notifications;
CREATE POLICY "Org members can view notifications" ON public.notifications FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert notifications" ON public.notifications;
CREATE POLICY "Org members can insert notifications" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update notifications" ON public.notifications;
CREATE POLICY "Bookkeeper+ can update notifications" ON public.notifications FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- organizations
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
CREATE POLICY "Users can view their organizations" ON public.organizations FOR SELECT TO authenticated
USING (id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Owners can update their organizations" ON public.organizations;
CREATE POLICY "Owners can update their organizations" ON public.organizations FOR UPDATE TO authenticated
USING (id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND (is_owner = true OR role IN ('admin'::user_role, 'accountant'::user_role))));

-- organization_members
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
CREATE POLICY "Members can view org members" ON public.organization_members FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

-- payment_allocations
DROP POLICY IF EXISTS "Org members can view payment_allocations" ON public.payment_allocations;
CREATE POLICY "Org members can view payment_allocations" ON public.payment_allocations FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can insert payment_allocations" ON public.payment_allocations;
CREATE POLICY "Org members can insert payment_allocations" ON public.payment_allocations FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Bookkeeper+ can update payment_allocations" ON public.payment_allocations;
CREATE POLICY "Bookkeeper+ can update payment_allocations" ON public.payment_allocations FOR UPDATE TO authenticated
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)));

-- 3. Add explicit DELETE deny policies on all sensitive financial tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'accounts', 'ai_decisions', 'anomalies', 'bank_accounts', 'bank_transactions',
    'cashflow_entries', 'contacts', 'documents', 'financial_health_snapshots',
    'fiscal_periods', 'icp_report_lines', 'icp_reports', 'invoice_lines', 'invoices',
    'journal_entries', 'journal_lines', 'notifications', 'payment_allocations'
  ]) LOOP
    EXECUTE format('CREATE POLICY "No delete on %s" ON public.%I FOR DELETE TO authenticated USING (false)', tbl, tbl);
  END LOOP;
END $$;
