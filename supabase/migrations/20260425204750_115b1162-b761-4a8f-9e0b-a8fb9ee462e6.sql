-- 1. Add is_demo flag to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_organizations_is_demo ON public.organizations(is_demo) WHERE is_demo = true;

-- 2. seed_demo_data: fills an org with realistic sample data so users can explore the app
CREATE OR REPLACE FUNCTION public.seed_demo_data(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_bank_account_id uuid;
  v_bank_account_acc uuid;
  v_revenue_acc uuid;
  v_ar_acc uuid;
  v_ap_acc uuid;
  v_office_exp_acc uuid;
  v_software_exp_acc uuid;
  v_vat_payable_high uuid;
  v_vat_receivable_high uuid;
  v_contact_klant1 uuid;
  v_contact_klant2 uuid;
  v_contact_lev1 uuid;
  v_contact_lev2 uuid;
  v_invoice_id uuid;
  v_je_id uuid;
  v_today date := CURRENT_DATE;
BEGIN
  -- Authorisation
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'not authorised for organisation %', p_org_id;
  END IF;

  -- Resolve commonly used accounts
  SELECT id INTO v_bank_account_acc FROM accounts WHERE organization_id = p_org_id AND code = '1120' LIMIT 1;
  SELECT id INTO v_revenue_acc FROM accounts WHERE organization_id = p_org_id AND code = '4200' LIMIT 1;
  SELECT id INTO v_ar_acc FROM accounts WHERE organization_id = p_org_id AND code = '1310' LIMIT 1;
  SELECT id INTO v_ap_acc FROM accounts WHERE organization_id = p_org_id AND code = '2110' LIMIT 1;
  SELECT id INTO v_office_exp_acc FROM accounts WHERE organization_id = p_org_id AND code = '7410' LIMIT 1;
  SELECT id INTO v_software_exp_acc FROM accounts WHERE organization_id = p_org_id AND code = '7430' LIMIT 1;
  SELECT id INTO v_vat_payable_high FROM accounts WHERE organization_id = p_org_id AND code = '2310' LIMIT 1;
  SELECT id INTO v_vat_receivable_high FROM accounts WHERE organization_id = p_org_id AND code = '1510' LIMIT 1;

  -- Bank account (only if none exists)
  SELECT id INTO v_bank_account_id FROM bank_accounts WHERE organization_id = p_org_id LIMIT 1;
  IF v_bank_account_id IS NULL THEN
    INSERT INTO bank_accounts (organization_id, name, iban, bic, bank_name, is_primary, account_id, current_balance)
    VALUES (p_org_id, 'Demo Zakelijke Rekening', 'NL00DEMO0123456789', 'DEMOBANK1', 'Demo Bank', true, v_bank_account_acc, 12500.00)
    RETURNING id INTO v_bank_account_id;
  END IF;

  -- Contacts (klanten + leveranciers)
  INSERT INTO contacts (organization_id, name, email, phone, is_customer, is_supplier, is_domestic, is_eu, address_city, address_country, payment_terms_days, default_account_id)
  VALUES
    (p_org_id, 'Acme Nederland B.V.', 'info@acme.nl', '+31 20 1234567', true, false, true, true, 'Amsterdam', 'NL', 30, v_revenue_acc),
    (p_org_id, 'Globex Trading', 'sales@globex.nl', '+31 10 7654321', true, false, true, true, 'Rotterdam', 'NL', 14, v_revenue_acc),
    (p_org_id, 'KantoorWereld B.V.', 'facturen@kantoorwereld.nl', '+31 30 9876543', false, true, true, true, 'Utrecht', 'NL', 30, v_office_exp_acc),
    (p_org_id, 'CloudHost Europe', 'billing@cloudhost.eu', '+353 1 2345678', false, true, false, true, 'Dublin', 'IE', 14, v_software_exp_acc)
  RETURNING id INTO v_contact_klant1;

  SELECT id INTO v_contact_klant1 FROM contacts WHERE organization_id = p_org_id AND name = 'Acme Nederland B.V.';
  SELECT id INTO v_contact_klant2 FROM contacts WHERE organization_id = p_org_id AND name = 'Globex Trading';
  SELECT id INTO v_contact_lev1 FROM contacts WHERE organization_id = p_org_id AND name = 'KantoorWereld B.V.';
  SELECT id INTO v_contact_lev2 FROM contacts WHERE organization_id = p_org_id AND name = 'CloudHost Europe';

  -- Sales invoices (paid + open)
  INSERT INTO invoices (organization_id, invoice_type, invoice_number, contact_id, contact_name, invoice_date, due_date, subtotal, total_vat, total_amount, amount_due, status, created_by)
  VALUES
    (p_org_id, 'sales', 'F2025-001', v_contact_klant1, 'Acme Nederland B.V.', v_today - 45, v_today - 15, 2500.00, 525.00, 3025.00, 0, 'paid', v_user_id),
    (p_org_id, 'sales', 'F2025-002', v_contact_klant2, 'Globex Trading', v_today - 30, v_today, 1800.00, 378.00, 2178.00, 0, 'paid', v_user_id),
    (p_org_id, 'sales', 'F2025-003', v_contact_klant1, 'Acme Nederland B.V.', v_today - 10, v_today + 20, 3200.00, 672.00, 3872.00, 3872.00, 'sent', v_user_id),
    (p_org_id, 'sales', 'F2025-004', v_contact_klant2, 'Globex Trading', v_today - 3, v_today + 11, 950.00, 199.50, 1149.50, 1149.50, 'sent', v_user_id);

  -- Purchase invoices
  INSERT INTO invoices (organization_id, invoice_type, invoice_number, contact_id, contact_name, invoice_date, due_date, subtotal, total_vat, total_amount, amount_due, status, created_by)
  VALUES
    (p_org_id, 'purchase', 'KW-2024-9912', v_contact_lev1, 'KantoorWereld B.V.', v_today - 25, v_today + 5, 145.00, 30.45, 175.45, 0, 'paid', v_user_id),
    (p_org_id, 'purchase', 'CH-INV-08821', v_contact_lev2, 'CloudHost Europe', v_today - 15, v_today + 15, 89.00, 0.00, 89.00, 89.00, 'received', v_user_id);

  -- Posted journal entries for the paid sales invoices (so dashboards/BTW have numbers)
  -- Sale 1: F2025-001 (€2500 + 21% BTW)
  INSERT INTO journal_entries (organization_id, date, description, status, source_type, posted_at, posted_by, created_by)
  VALUES (p_org_id, v_today - 45, 'Verkoop F2025-001 Acme', 'posted', 'sales_invoice', NOW(), v_user_id, v_user_id)
  RETURNING id INTO v_je_id;
  INSERT INTO journal_lines (journal_entry_id, line_number, account_id, description, debit_amount, credit_amount, vat_box, vat_amount, vat_percentage, vat_rate_type)
  VALUES
    (v_je_id, 1, v_ar_acc, 'Debiteur Acme', 3025.00, 0, NULL, 0, 0, 'high'),
    (v_je_id, 2, v_revenue_acc, 'Omzet diensten', 0, 2500.00, '1a', 525.00, 21, 'high'),
    (v_je_id, 3, v_vat_payable_high, 'BTW af te dragen 21%', 0, 525.00, NULL, 0, 0, 'high');

  -- Sale 2: F2025-002 (€1800 + 21% BTW)
  INSERT INTO journal_entries (organization_id, date, description, status, source_type, posted_at, posted_by, created_by)
  VALUES (p_org_id, v_today - 30, 'Verkoop F2025-002 Globex', 'posted', 'sales_invoice', NOW(), v_user_id, v_user_id)
  RETURNING id INTO v_je_id;
  INSERT INTO journal_lines (journal_entry_id, line_number, account_id, description, debit_amount, credit_amount, vat_box, vat_amount, vat_percentage, vat_rate_type)
  VALUES
    (v_je_id, 1, v_ar_acc, 'Debiteur Globex', 2178.00, 0, NULL, 0, 0, 'high'),
    (v_je_id, 2, v_revenue_acc, 'Omzet diensten', 0, 1800.00, '1a', 378.00, 21, 'high'),
    (v_je_id, 3, v_vat_payable_high, 'BTW af te dragen 21%', 0, 378.00, NULL, 0, 0, 'high');

  -- Purchase 1: KantoorWereld €145 + 21% BTW
  INSERT INTO journal_entries (organization_id, date, description, status, source_type, posted_at, posted_by, created_by)
  VALUES (p_org_id, v_today - 25, 'Inkoop KantoorWereld', 'posted', 'purchase_invoice', NOW(), v_user_id, v_user_id)
  RETURNING id INTO v_je_id;
  INSERT INTO journal_lines (journal_entry_id, line_number, account_id, description, debit_amount, credit_amount, vat_box, vat_amount, vat_percentage, vat_rate_type)
  VALUES
    (v_je_id, 1, v_office_exp_acc, 'Kantoorbenodigdheden', 145.00, 0, NULL, 0, 21, 'high'),
    (v_je_id, 2, v_vat_receivable_high, 'BTW voorbelasting 21%', 30.45, 0, '5b', 30.45, 21, 'high'),
    (v_je_id, 3, v_ap_acc, 'Crediteur KantoorWereld', 0, 175.45, NULL, 0, 0, 'high');

  -- Bank transactions (already-categorized + a few new)
  INSERT INTO bank_transactions (organization_id, bank_account_id, transaction_date, value_date, amount, currency, description, counterparty_name, counterparty_iban, status)
  VALUES
    (p_org_id, v_bank_account_id, v_today - 40, v_today - 40, 3025.00, 'EUR', 'Betaling F2025-001', 'Acme Nederland B.V.', 'NL00ACME0001', 'matched'),
    (p_org_id, v_bank_account_id, v_today - 28, v_today - 28, 2178.00, 'EUR', 'Betaling F2025-002', 'Globex Trading', 'NL00GLOB0002', 'matched'),
    (p_org_id, v_bank_account_id, v_today - 22, v_today - 22, -175.45, 'EUR', 'Betaling KantoorWereld', 'KantoorWereld B.V.', 'NL00KANT0003', 'matched'),
    (p_org_id, v_bank_account_id, v_today - 7, v_today - 7, -89.00, 'EUR', 'CloudHost maandfactuur', 'CloudHost Europe', 'IE00CLOU0004', 'new'),
    (p_org_id, v_bank_account_id, v_today - 5, v_today - 5, -245.00, 'EUR', 'Lunch klantbezoek', 'Restaurant De Beren', 'NL00BERE0005', 'new'),
    (p_org_id, v_bank_account_id, v_today - 2, v_today - 2, -45.99, 'EUR', 'Bol.com bestelling', 'Bol.com', 'NL00BOLC0006', 'new');

  -- Audit
  INSERT INTO audit_log (organization_id, user_id, action, entity_type, entity_id, change_summary)
  VALUES (p_org_id, v_user_id, 'create', 'demo_data', p_org_id, 'Demo data seeded');
END;
$$;

-- 3. Helper RPC: create a demo organization for the current user
CREATE OR REPLACE FUNCTION public.create_demo_organization(p_name text DEFAULT 'Demo BV')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_org_id := setup_new_organization(
    v_user_id,
    p_name,
    p_name,
    'eenmanszaak'::org_type,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'standard'::vat_scheme,
    'quarterly'::vat_frequency,
    1,
    false,
    '{}'::jsonb
  );

  -- Mark as demo
  UPDATE organizations SET is_demo = true WHERE id = v_org_id;

  -- Seed sample data
  PERFORM seed_demo_data(v_org_id);

  RETURN v_org_id;
END;
$$;