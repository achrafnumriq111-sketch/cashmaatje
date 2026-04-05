
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUMS
CREATE TYPE user_role AS ENUM ('entrepreneur', 'bookkeeper', 'accountant', 'admin');
CREATE TYPE org_type AS ENUM ('eenmanszaak', 'vof', 'bv', 'nv', 'stichting', 'maatschap', 'cv');
CREATE TYPE vat_scheme AS ENUM ('standard', 'kor');
CREATE TYPE vat_frequency AS ENUM ('monthly', 'quarterly', 'yearly');
CREATE TYPE vat_rate_type AS ENUM ('high', 'low', 'zero', 'exempt', 'reverse_charge', 'icp', 'export', 'import', 'margin');
CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
CREATE TYPE account_subtype AS ENUM (
  'cash', 'bank', 'accounts_receivable', 'inventory', 'prepaid', 'fixed_asset', 'accumulated_depreciation', 'other_asset',
  'accounts_payable', 'credit_card', 'vat_payable', 'vat_receivable', 'payroll_liability', 'loan', 'other_liability',
  'owner_equity', 'retained_earnings', 'owner_draw', 'other_equity',
  'sales_revenue', 'service_revenue', 'other_income', 'interest_income',
  'cost_of_goods', 'operating_expense', 'payroll_expense', 'rent', 'utilities', 'insurance',
  'office_supplies', 'travel', 'marketing', 'professional_fees', 'depreciation_expense',
  'interest_expense', 'tax_expense', 'other_expense'
);
CREATE TYPE journal_status AS ENUM ('draft', 'posted', 'voided');
CREATE TYPE invoice_type AS ENUM ('sales', 'purchase', 'credit_note_sales', 'credit_note_purchase');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'credited');
CREATE TYPE payment_status AS ENUM ('pending', 'matched', 'partial', 'unmatched', 'excluded');
CREATE TYPE document_type AS ENUM ('invoice', 'receipt', 'bank_statement', 'contract', 'tax_filing', 'other');
CREATE TYPE ai_action_type AS ENUM ('categorize', 'match', 'detect_anomaly', 'detect_duplicate', 'extract_ocr', 'suggest_entry', 'validate_vat');
CREATE TYPE period_status AS ENUM ('open', 'closing', 'closed', 'locked');
CREATE TYPE transaction_direction AS ENUM ('debit', 'credit');
CREATE TYPE bank_tx_status AS ENUM ('new', 'matched', 'partial_match', 'manually_matched', 'excluded', 'reconciled');
CREATE TYPE notification_severity AS ENUM ('info', 'warning', 'error', 'critical');

-- ORGANIZATIONS
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  legal_name TEXT,
  org_type org_type NOT NULL DEFAULT 'eenmanszaak',
  kvk_number VARCHAR(8),
  btw_number VARCHAR(14),
  iban VARCHAR(34),
  address_street TEXT,
  address_postal_code VARCHAR(7),
  address_city TEXT,
  address_country VARCHAR(2) DEFAULT 'NL',
  phone TEXT,
  email TEXT,
  website TEXT,
  fiscal_year_start_month INTEGER DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  vat_scheme vat_scheme NOT NULL DEFAULT 'standard',
  vat_frequency vat_frequency NOT NULL DEFAULT 'quarterly',
  kor_eligible BOOLEAN DEFAULT FALSE,
  kor_threshold_amount NUMERIC(12,2) DEFAULT 20000.00,
  default_currency VARCHAR(3) DEFAULT 'EUR',
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER_PROFILES: Add missing columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- ORGANIZATION MEMBERS
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'entrepreneur',
  is_owner BOOLEAN DEFAULT FALSE,
  permissions JSONB DEFAULT '{}',
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- FISCAL PERIODS
CREATE TABLE fiscal_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  quarter INTEGER GENERATED ALWAYS AS (CEIL(month::NUMERIC / 3)::INTEGER) STORED,
  status period_status NOT NULL DEFAULT 'open',
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES user_profiles(id),
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES user_profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, year, month)
);

-- ACCOUNTS
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name TEXT NOT NULL,
  name_nl TEXT,
  description TEXT,
  account_type account_type NOT NULL,
  account_subtype account_subtype,
  parent_id UUID REFERENCES accounts(id),
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_header BOOLEAN DEFAULT FALSE,
  default_vat_rate_type vat_rate_type,
  default_vat_percentage NUMERIC(5,2),
  vat_box_mapping VARCHAR(5),
  rgs_code VARCHAR(20),
  normal_balance transaction_direction NOT NULL DEFAULT 'debit',
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

CREATE INDEX idx_accounts_org_type ON accounts(organization_id, account_type);
CREATE INDEX idx_accounts_org_code ON accounts(organization_id, code);

-- CONTACTS
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  legal_name TEXT,
  is_customer BOOLEAN DEFAULT FALSE,
  is_supplier BOOLEAN DEFAULT FALSE,
  email TEXT,
  phone TEXT,
  website TEXT,
  btw_number VARCHAR(20),
  btw_number_verified BOOLEAN DEFAULT FALSE,
  btw_number_verified_at TIMESTAMPTZ,
  kvk_number VARCHAR(20),
  address_street TEXT,
  address_postal_code VARCHAR(10),
  address_city TEXT,
  address_country VARCHAR(2) DEFAULT 'NL',
  is_eu BOOLEAN GENERATED ALWAYS AS (
    address_country IN ('AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE')
  ) STORED,
  is_domestic BOOLEAN GENERATED ALWAYS AS (address_country = 'NL') STORED,
  default_account_id UUID REFERENCES accounts(id),
  default_vat_rate_type vat_rate_type,
  payment_terms_days INTEGER DEFAULT 30,
  default_currency VARCHAR(3) DEFAULT 'EUR',
  iban VARCHAR(34),
  bic VARCHAR(11),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_btw ON contacts(btw_number) WHERE btw_number IS NOT NULL;

-- JOURNAL ENTRIES
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entry_number SERIAL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  status journal_status NOT NULL DEFAULT 'draft',
  source_type TEXT,
  source_id UUID,
  fiscal_period_id UUID REFERENCES fiscal_periods(id),
  is_reversal BOOLEAN DEFAULT FALSE,
  reverses_entry_id UUID REFERENCES journal_entries(id),
  reversed_by_entry_id UUID REFERENCES journal_entries(id),
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES user_profiles(id),
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES user_profiles(id),
  void_reason TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_confidence NUMERIC(3,2),
  ai_reasoning TEXT,
  tags TEXT[] DEFAULT '{}',
  attachments UUID[] DEFAULT '{}',
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_org_date ON journal_entries(organization_id, date);
CREATE INDEX idx_journal_org_status ON journal_entries(organization_id, status);
CREATE INDEX idx_journal_source ON journal_entries(source_type, source_id);

-- JOURNAL LINES
CREATE TABLE journal_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id),
  description TEXT,
  debit_amount NUMERIC(14,2) DEFAULT 0.00 CHECK (debit_amount >= 0),
  credit_amount NUMERIC(14,2) DEFAULT 0.00 CHECK (credit_amount >= 0),
  vat_rate_type vat_rate_type,
  vat_percentage NUMERIC(5,2),
  vat_amount NUMERIC(14,2) DEFAULT 0.00,
  vat_account_id UUID REFERENCES accounts(id),
  vat_box VARCHAR(5),
  contact_id UUID REFERENCES contacts(id),
  cost_center TEXT,
  project TEXT,
  bank_transaction_id UUID,
  invoice_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_debit_or_credit CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR
    (credit_amount > 0 AND debit_amount = 0) OR
    (debit_amount = 0 AND credit_amount = 0)
  )
);

CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);

-- BALANCE VALIDATION TRIGGER
CREATE OR REPLACE FUNCTION validate_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debits NUMERIC(14,2);
  total_credits NUMERIC(14,2);
  entry_status journal_status;
BEGIN
  SELECT status INTO entry_status FROM journal_entries WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  IF entry_status = 'posted' THEN
    SELECT COALESCE(SUM(debit_amount), 0), COALESCE(SUM(credit_amount), 0)
    INTO total_debits, total_credits
    FROM journal_lines WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
    IF ABS(total_debits - total_credits) > 0.01 THEN
      RAISE EXCEPTION 'Journal entry does not balance. Debits: %, Credits: %', total_debits, total_credits;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_journal_balance
  AFTER INSERT OR UPDATE ON journal_lines FOR EACH ROW EXECUTE FUNCTION validate_journal_balance();

-- PERIOD LOCK
CREATE OR REPLACE FUNCTION enforce_period_lock()
RETURNS TRIGGER AS $$
DECLARE period_rec RECORD;
BEGIN
  SELECT fp.status INTO period_rec FROM fiscal_periods fp WHERE fp.id = NEW.fiscal_period_id;
  IF period_rec.status IN ('closed', 'locked') THEN
    RAISE EXCEPTION 'Cannot modify entries in a closed or locked fiscal period';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_period_lock
  BEFORE INSERT OR UPDATE ON journal_entries FOR EACH ROW
  WHEN (NEW.fiscal_period_id IS NOT NULL) EXECUTE FUNCTION enforce_period_lock();

-- INVOICES
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_type invoice_type NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  invoice_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,
  contact_id UUID REFERENCES contacts(id),
  contact_name TEXT,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  total_vat NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(14,2) DEFAULT 0.00,
  amount_due NUMERIC(14,2) GENERATED ALWAYS AS (total_amount - COALESCE(amount_paid, 0)) STORED,
  currency VARCHAR(3) DEFAULT 'EUR',
  exchange_rate NUMERIC(10,6) DEFAULT 1.000000,
  vat_summary JSONB DEFAULT '[]',
  payment_reference TEXT,
  payment_method TEXT,
  document_id UUID,
  journal_entry_id UUID REFERENCES journal_entries(id),
  ocr_data JSONB,
  ai_confidence NUMERIC(3,2),
  ai_reasoning TEXT,
  duplicate_hash TEXT,
  potential_duplicate_of UUID REFERENCES invoices(id),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, invoice_number, invoice_type, contact_id)
);

CREATE INDEX idx_invoices_org_status ON invoices(organization_id, status);
CREATE INDEX idx_invoices_org_date ON invoices(organization_id, invoice_date);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);
CREATE INDEX idx_invoices_dup_hash ON invoices(duplicate_hash) WHERE duplicate_hash IS NOT NULL;

-- INVOICE LINES
CREATE TABLE invoice_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,4) DEFAULT 1,
  unit_price NUMERIC(14,4) NOT NULL,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL,
  vat_rate_type vat_rate_type NOT NULL DEFAULT 'high',
  vat_percentage NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  vat_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  account_id UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);

-- BANK ACCOUNTS
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  iban VARCHAR(34) NOT NULL,
  bic VARCHAR(11),
  bank_name TEXT,
  currency VARCHAR(3) DEFAULT 'EUR',
  account_id UUID REFERENCES accounts(id),
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  current_balance NUMERIC(14,2) DEFAULT 0.00,
  balance_date DATE,
  connection_provider TEXT,
  connection_id TEXT,
  connection_status TEXT DEFAULT 'manual',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, iban)
);

-- BANK TRANSACTIONS
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  value_date DATE,
  amount NUMERIC(14,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  description TEXT,
  counterparty_name TEXT,
  counterparty_iban VARCHAR(34),
  payment_reference TEXT,
  status bank_tx_status NOT NULL DEFAULT 'new',
  account_id UUID REFERENCES accounts(id),
  contact_id UUID REFERENCES contacts(id),
  matched_invoice_id UUID REFERENCES invoices(id),
  journal_entry_id UUID REFERENCES journal_entries(id),
  match_confidence NUMERIC(3,2),
  match_method TEXT,
  ai_category_suggestion UUID REFERENCES accounts(id),
  ai_contact_suggestion UUID REFERENCES contacts(id),
  ai_confidence NUMERIC(3,2),
  ai_reasoning TEXT,
  transaction_hash TEXT,
  external_id TEXT,
  raw_data JSONB,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bank_tx_org_date ON bank_transactions(organization_id, transaction_date);
CREATE INDEX idx_bank_tx_status ON bank_transactions(organization_id, status);
CREATE INDEX idx_bank_tx_account ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_tx_hash ON bank_transactions(transaction_hash) WHERE transaction_hash IS NOT NULL;
CREATE INDEX idx_bank_tx_counterparty ON bank_transactions USING gin (counterparty_name gin_trgm_ops);

-- RECONCILIATION RULES
CREATE TABLE reconciliation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  match_counterparty TEXT,
  match_description TEXT,
  match_amount_min NUMERIC(14,2),
  match_amount_max NUMERIC(14,2),
  match_direction TEXT CHECK (match_direction IN ('inflow', 'outflow', 'any')),
  assign_account_id UUID REFERENCES accounts(id),
  assign_contact_id UUID REFERENCES contacts(id),
  assign_vat_rate_type vat_rate_type,
  assign_vat_percentage NUMERIC(5,2),
  assign_description TEXT,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  times_applied INTEGER DEFAULT 0,
  last_applied_at TIMESTAMPTZ,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENT ALLOCATIONS
CREATE TABLE payment_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bank_transaction_id UUID REFERENCES bank_transactions(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  allocation_date DATE NOT NULL,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_alloc_invoice ON payment_allocations(invoice_id);
CREATE INDEX idx_payment_alloc_tx ON payment_allocations(bank_transaction_id);

-- AUTO-UPDATE invoice paid amount
CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices SET
    amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM payment_allocations WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)),
    status = CASE
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM payment_allocations WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)) >= total_amount THEN 'paid'
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM payment_allocations WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)) > 0 THEN 'partial'
      ELSE status END,
    paid_date = CASE
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM payment_allocations WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)) >= total_amount THEN COALESCE(NEW.allocation_date, NOW()::DATE)
      ELSE NULL END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_invoice_paid
  AFTER INSERT OR UPDATE OR DELETE ON payment_allocations FOR EACH ROW EXECUTE FUNCTION update_invoice_paid_amount();

-- VAT RATES
CREATE TABLE vat_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rate_type vat_rate_type NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  description TEXT NOT NULL,
  description_nl TEXT,
  valid_from DATE NOT NULL DEFAULT '2000-01-01',
  valid_until DATE DEFAULT '9999-12-31',
  sales_box VARCHAR(5),
  sales_base_box VARCHAR(5),
  purchase_box VARCHAR(5),
  purchase_base_box VARCHAR(5),
  icp_box VARCHAR(5),
  import_box VARCHAR(5),
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VAT RETURNS
CREATE TABLE vat_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  period_type vat_frequency NOT NULL,
  period_number INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'filed', 'amended', 'accepted')),
  box_1a_base NUMERIC(14,2) DEFAULT 0.00, box_1a_vat NUMERIC(14,2) DEFAULT 0.00,
  box_1b_base NUMERIC(14,2) DEFAULT 0.00, box_1b_vat NUMERIC(14,2) DEFAULT 0.00,
  box_1c_base NUMERIC(14,2) DEFAULT 0.00, box_1c_vat NUMERIC(14,2) DEFAULT 0.00,
  box_1d_base NUMERIC(14,2) DEFAULT 0.00, box_1d_vat NUMERIC(14,2) DEFAULT 0.00,
  box_1e_base NUMERIC(14,2) DEFAULT 0.00, box_1e_vat NUMERIC(14,2) DEFAULT 0.00,
  box_2a_base NUMERIC(14,2) DEFAULT 0.00, box_2a_vat NUMERIC(14,2) DEFAULT 0.00,
  box_3a_base NUMERIC(14,2) DEFAULT 0.00,
  box_3b_base NUMERIC(14,2) DEFAULT 0.00,
  box_3c_base NUMERIC(14,2) DEFAULT 0.00,
  box_4a_base NUMERIC(14,2) DEFAULT 0.00, box_4a_vat NUMERIC(14,2) DEFAULT 0.00,
  box_4b_base NUMERIC(14,2) DEFAULT 0.00, box_4b_vat NUMERIC(14,2) DEFAULT 0.00,
  box_5a_vat NUMERIC(14,2) DEFAULT 0.00,
  box_5b_vat NUMERIC(14,2) DEFAULT 0.00,
  box_5c_vat NUMERIC(14,2) DEFAULT 0.00,
  box_5d_vat NUMERIC(14,2) DEFAULT 0.00,
  box_5e_vat NUMERIC(14,2) DEFAULT 0.00,
  box_5f_vat NUMERIC(14,2) DEFAULT 0.00,
  filed_at TIMESTAMPTZ,
  filed_by UUID REFERENCES user_profiles(id),
  filing_reference TEXT,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  calculation_details JSONB,
  warnings TEXT[],
  errors TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, year, period_type, period_number)
);

-- VAT RETURN LINES
CREATE TABLE vat_return_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vat_return_id UUID NOT NULL REFERENCES vat_returns(id) ON DELETE CASCADE,
  journal_entry_id UUID REFERENCES journal_entries(id),
  journal_line_id UUID REFERENCES journal_lines(id),
  invoice_id UUID REFERENCES invoices(id),
  vat_rate_type vat_rate_type NOT NULL,
  vat_percentage NUMERIC(5,2) NOT NULL,
  vat_box VARCHAR(5) NOT NULL,
  base_amount NUMERIC(14,2) NOT NULL,
  vat_amount NUMERIC(14,2) NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  contact_vat_number TEXT,
  contact_country VARCHAR(2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vat_return_lines_return ON vat_return_lines(vat_return_id);

-- ICP REPORTS
CREATE TABLE icp_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  period_type vat_frequency NOT NULL,
  period_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'filed')),
  filed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE icp_report_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  icp_report_id UUID NOT NULL REFERENCES icp_reports(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  contact_vat_number TEXT NOT NULL,
  contact_country VARCHAR(2) NOT NULL,
  contact_name TEXT,
  goods_amount NUMERIC(14,2) DEFAULT 0.00,
  services_amount NUMERIC(14,2) DEFAULT 0.00,
  abc_amount NUMERIC(14,2) DEFAULT 0.00,
  total_amount NUMERIC(14,2) GENERATED ALWAYS AS (COALESCE(goods_amount, 0) + COALESCE(services_amount, 0) + COALESCE(abc_amount, 0)) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VAT CALCULATION FUNCTION
CREATE OR REPLACE FUNCTION calculate_vat_return(p_org_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS JSONB AS $$
DECLARE result JSONB;
BEGIN
  WITH vat_data AS (
    SELECT jl.vat_box, jl.vat_rate_type, jl.vat_percentage,
      SUM(CASE WHEN jl.vat_box IN ('1a','1b','1c','1d','1e','2a','3a','3b','3c','4a','4b') THEN (jl.debit_amount - jl.credit_amount) ELSE 0 END) AS base_amount,
      SUM(jl.vat_amount) AS vat_amount
    FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_entry_id
    WHERE je.organization_id = p_org_id AND je.date BETWEEN p_start_date AND p_end_date AND je.status = 'posted' AND jl.vat_box IS NOT NULL
    GROUP BY jl.vat_box, jl.vat_rate_type, jl.vat_percentage
  )
  SELECT jsonb_build_object(
    'period_start', p_start_date, 'period_end', p_end_date,
    'box_1a_base', COALESCE((SELECT SUM(base_amount) FROM vat_data WHERE vat_box = '1a'), 0),
    'box_1a_vat', COALESCE((SELECT SUM(vat_amount) FROM vat_data WHERE vat_box = '1a'), 0),
    'box_1b_base', COALESCE((SELECT SUM(base_amount) FROM vat_data WHERE vat_box = '1b'), 0),
    'box_1b_vat', COALESCE((SELECT SUM(vat_amount) FROM vat_data WHERE vat_box = '1b'), 0),
    'box_1c_base', COALESCE((SELECT SUM(base_amount) FROM vat_data WHERE vat_box = '1c'), 0),
    'box_1c_vat', COALESCE((SELECT SUM(vat_amount) FROM vat_data WHERE vat_box = '1c'), 0),
    'box_1d_base', COALESCE((SELECT SUM(base_amount) FROM vat_data WHERE vat_box = '1d'), 0),
    'box_1d_vat', COALESCE((SELECT SUM(vat_amount) FROM vat_data WHERE vat_box = '1d'), 0),
    'box_1e_base', COALESCE((SELECT SUM(base_amount) FROM vat_data WHERE vat_box = '1e'), 0),
    'box_1e_vat', COALESCE((SELECT SUM(vat_amount) FROM vat_data WHERE vat_box = '1e'), 0),
    'box_2a_base', COALESCE((SELECT SUM(base_amount) FROM vat_data WHERE vat_box = '2a'), 0),
    'box_2a_vat', COALESCE((SELECT SUM(vat_amount) FROM vat_data WHERE vat_box = '2a'), 0),
    'box_3a_base', COALESCE((SELECT SUM(base_amount) FROM vat_data WHERE vat_box = '3a'), 0),
    'box_3b_base', COALESCE((SELECT SUM(base_amount) FROM vat_data WHERE vat_box = '3b'), 0),
    'box_3c_base', COALESCE((SELECT SUM(base_amount) FROM vat_data WHERE vat_box = '3c'), 0),
    'box_4a_base', COALESCE((SELECT SUM(base_amount) FROM vat_data WHERE vat_box = '4a'), 0),
    'box_4a_vat', COALESCE((SELECT SUM(vat_amount) FROM vat_data WHERE vat_box = '4a'), 0),
    'box_4b_base', COALESCE((SELECT SUM(base_amount) FROM vat_data WHERE vat_box = '4b'), 0),
    'box_4b_vat', COALESCE((SELECT SUM(vat_amount) FROM vat_data WHERE vat_box = '4b'), 0),
    'details', (SELECT jsonb_agg(row_to_json(vat_data)) FROM vat_data)
  ) INTO result;
  result := result || jsonb_build_object(
    'box_5a_vat', (result->>'box_1a_vat')::NUMERIC + (result->>'box_1b_vat')::NUMERIC + (result->>'box_1c_vat')::NUMERIC + (result->>'box_1d_vat')::NUMERIC + (result->>'box_2a_vat')::NUMERIC + (result->>'box_4a_vat')::NUMERIC + (result->>'box_4b_vat')::NUMERIC,
    'box_5b_vat', COALESCE((SELECT SUM(vat_amount) FROM vat_data WHERE vat_box = '5b'), 0)
  );
  result := result || jsonb_build_object('box_5c_vat', (result->>'box_5a_vat')::NUMERIC - (result->>'box_5b_vat')::NUMERIC);
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- TAX RESERVES
CREATE TABLE tax_reserves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reserve_type TEXT NOT NULL CHECK (reserve_type IN ('vat', 'income_tax', 'corporate_tax', 'payroll_tax')),
  period_year INTEGER NOT NULL,
  period_month INTEGER,
  calculated_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(14,2) DEFAULT 0.00,
  remaining_amount NUMERIC(14,2) GENERATED ALWAYS AS (calculated_amount - COALESCE(paid_amount, 0)) STORED,
  status TEXT DEFAULT 'estimated' CHECK (status IN ('estimated', 'confirmed', 'paid', 'overpaid')),
  calculation_details JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_path TEXT NOT NULL,
  storage_bucket TEXT DEFAULT 'documents',
  document_type document_type NOT NULL DEFAULT 'other',
  invoice_id UUID REFERENCES invoices(id),
  journal_entry_id UUID REFERENCES journal_entries(id),
  contact_id UUID REFERENCES contacts(id),
  bank_transaction_id UUID REFERENCES bank_transactions(id),
  ocr_status TEXT DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  ocr_text TEXT,
  ocr_data JSONB,
  ocr_confidence NUMERIC(3,2),
  extracted_supplier_name TEXT,
  extracted_invoice_number TEXT,
  extracted_vat_number TEXT,
  extracted_date DATE,
  extracted_amount NUMERIC(14,2),
  extracted_vat_amount NUMERIC(14,2),
  extracted_currency VARCHAR(3),
  extracted_iban TEXT,
  is_validated BOOLEAN DEFAULT FALSE,
  validated_by UUID REFERENCES user_profiles(id),
  validated_at TIMESTAMPTZ,
  document_hash TEXT,
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of UUID REFERENCES documents(id),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  uploaded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_type ON documents(organization_id, document_type);
CREATE INDEX idx_documents_hash ON documents(document_hash) WHERE document_hash IS NOT NULL;
CREATE INDEX idx_documents_invoice ON documents(invoice_id) WHERE invoice_id IS NOT NULL;

-- AI DECISIONS
CREATE TABLE ai_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action_type ai_action_type NOT NULL,
  input_type TEXT NOT NULL,
  input_id UUID NOT NULL,
  input_summary TEXT,
  decision JSONB NOT NULL,
  confidence NUMERIC(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  reasoning TEXT NOT NULL,
  reasoning_nl TEXT,
  factors JSONB,
  alternatives JSONB,
  was_accepted BOOLEAN,
  was_overridden BOOLEAN DEFAULT FALSE,
  override_value JSONB,
  override_reason TEXT,
  overridden_by UUID REFERENCES user_profiles(id),
  overridden_at TIMESTAMPTZ,
  model_version TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_decisions_org ON ai_decisions(organization_id);
CREATE INDEX idx_ai_decisions_input ON ai_decisions(input_type, input_id);
CREATE INDEX idx_ai_decisions_type ON ai_decisions(action_type);
CREATE INDEX idx_ai_decisions_confidence ON ai_decisions(confidence);

-- AUDIT LOG
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  user_email TEXT,
  user_role user_role,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  change_summary TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_date ON audit_log(created_at);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  message_nl TEXT,
  severity notification_severity NOT NULL DEFAULT 'info',
  category TEXT,
  action_url TEXT,
  action_label TEXT,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_org ON notifications(organization_id);

-- ANOMALIES
CREATE TABLE anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL,
  severity notification_severity NOT NULL DEFAULT 'warning',
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  description_nl TEXT,
  suggestion TEXT,
  suggestion_nl TEXT,
  confidence NUMERIC(3,2),
  ai_decision_id UUID REFERENCES ai_decisions(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed', 'false_positive')),
  resolved_by UUID REFERENCES user_profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anomalies_org_status ON anomalies(organization_id, status);
CREATE INDEX idx_anomalies_entity ON anomalies(entity_type, entity_id);

-- CASHFLOW ENTRIES
CREATE TABLE cashflow_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('actual', 'predicted_in', 'predicted_out', 'recurring', 'tax_reserve')),
  date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  source_type TEXT,
  source_id UUID,
  description TEXT,
  category TEXT,
  contact_id UUID REFERENCES contacts(id),
  confidence NUMERIC(3,2),
  prediction_model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cashflow_org_date ON cashflow_entries(organization_id, date);

-- FINANCIAL HEALTH SNAPSHOTS
CREATE TABLE financial_health_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  cash_balance NUMERIC(14,2),
  accounts_receivable NUMERIC(14,2),
  accounts_payable NUMERIC(14,2),
  net_working_capital NUMERIC(14,2),
  revenue_mtd NUMERIC(14,2),
  expenses_mtd NUMERIC(14,2),
  profit_mtd NUMERIC(14,2),
  revenue_ytd NUMERIC(14,2),
  expenses_ytd NUMERIC(14,2),
  profit_ytd NUMERIC(14,2),
  vat_reserve NUMERIC(14,2),
  income_tax_reserve NUMERIC(14,2),
  total_tax_reserve NUMERIC(14,2),
  current_ratio NUMERIC(8,4),
  quick_ratio NUMERIC(8,4),
  debt_ratio NUMERIC(8,4),
  health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
  health_factors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, snapshot_date)
);

-- RECURRING PATTERNS
CREATE TABLE recurring_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  counterparty_name TEXT,
  contact_id UUID REFERENCES contacts(id),
  typical_amount NUMERIC(14,2),
  amount_variance NUMERIC(5,2),
  frequency TEXT CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  expected_day INTEGER,
  account_id UUID REFERENCES accounts(id),
  vat_rate_type vat_rate_type,
  detected_by TEXT DEFAULT 'ai',
  confidence NUMERIC(3,2),
  sample_transactions UUID[],
  is_active BOOLEAN DEFAULT TRUE,
  next_expected_date DATE,
  last_seen_date DATE,
  times_matched INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_return_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE icp_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE icp_report_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_reserves ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_patterns ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role_in_org(p_org_id UUID)
RETURNS user_role AS $$
  SELECT role FROM organization_members WHERE user_id = auth.uid() AND organization_id = p_org_id LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ORGANIZATIONS POLICIES
CREATE POLICY "Users can view their organizations" ON organizations FOR SELECT USING (id IN (SELECT get_user_org_ids()));
CREATE POLICY "Owners can update their organizations" ON organizations FOR UPDATE USING (id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND (is_owner = TRUE OR role IN ('admin', 'accountant'))));

-- USER PROFILES POLICIES
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can view org members profiles" ON user_profiles FOR SELECT USING (id IN (SELECT user_id FROM organization_members WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());

-- ORG-SCOPED POLICIES (bulk)
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'fiscal_periods', 'accounts', 'contacts', 'journal_entries',
    'invoices', 'bank_accounts', 'bank_transactions', 'reconciliation_rules',
    'payment_allocations', 'vat_rates', 'vat_returns', 'tax_reserves',
    'documents', 'ai_decisions', 'notifications', 'anomalies',
    'cashflow_entries', 'financial_health_snapshots', 'recurring_patterns',
    'icp_reports'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY "Org members can view %1$s" ON %1$s FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()))', tbl);
    EXECUTE format('CREATE POLICY "Org members can insert %1$s" ON %1$s FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()))', tbl);
    EXECUTE format('CREATE POLICY "Bookkeeper+ can update %1$s" ON %1$s FOR UPDATE USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN (''bookkeeper'', ''accountant'', ''admin'')))', tbl);
  END LOOP;
END $$;

-- SPECIAL POLICIES
CREATE POLICY "No one can update audit_log" ON audit_log FOR UPDATE USING (FALSE);
CREATE POLICY "No one can delete audit_log" ON audit_log FOR DELETE USING (FALSE);

CREATE POLICY "View journal lines via entry" ON journal_lines FOR SELECT USING (journal_entry_id IN (SELECT id FROM journal_entries WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Insert journal lines via entry" ON journal_lines FOR INSERT WITH CHECK (journal_entry_id IN (SELECT id FROM journal_entries WHERE organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "View invoice lines via invoice" ON invoice_lines FOR SELECT USING (invoice_id IN (SELECT id FROM invoices WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Insert invoice lines via invoice" ON invoice_lines FOR INSERT WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE organization_id IN (SELECT get_user_org_ids())));

CREATE POLICY "View vat_return_lines via return" ON vat_return_lines FOR SELECT USING (vat_return_id IN (SELECT id FROM vat_returns WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "View icp_report_lines via report" ON icp_report_lines FOR SELECT USING (icp_report_id IN (SELECT id FROM icp_reports WHERE organization_id IN (SELECT get_user_org_ids())));

-- ORG MEMBERS POLICIES
CREATE POLICY "Members can view org members" ON organization_members FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Owners/admins can manage members" ON organization_members FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND (is_owner = TRUE OR role = 'admin')));

-- ============================================================
-- SEED FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION seed_chart_of_accounts(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO accounts (organization_id, code, name, name_nl, account_type, account_subtype, is_system, normal_balance, sort_order) VALUES
  (p_org_id, '0000', 'Vaste activa', 'Vaste activa', 'asset', 'fixed_asset', TRUE, 'debit', 0),
  (p_org_id, '0100', 'Immateriële vaste activa', 'Immateriële vaste activa', 'asset', 'fixed_asset', TRUE, 'debit', 10),
  (p_org_id, '0110', 'Goodwill', 'Goodwill', 'asset', 'fixed_asset', FALSE, 'debit', 11),
  (p_org_id, '0120', 'Software', 'Software', 'asset', 'fixed_asset', FALSE, 'debit', 12),
  (p_org_id, '0200', 'Materiële vaste activa', 'Materiële vaste activa', 'asset', 'fixed_asset', TRUE, 'debit', 20),
  (p_org_id, '0210', 'Bedrijfsgebouwen', 'Bedrijfsgebouwen', 'asset', 'fixed_asset', FALSE, 'debit', 21),
  (p_org_id, '0220', 'Machines en installaties', 'Machines en installaties', 'asset', 'fixed_asset', FALSE, 'debit', 22),
  (p_org_id, '0230', 'Inventaris en inrichting', 'Inventaris en inrichting', 'asset', 'fixed_asset', FALSE, 'debit', 23),
  (p_org_id, '0240', 'Computers en elektronica', 'Computers en elektronica', 'asset', 'fixed_asset', FALSE, 'debit', 24),
  (p_org_id, '0250', 'Vervoermiddelen', 'Vervoermiddelen', 'asset', 'fixed_asset', FALSE, 'debit', 25),
  (p_org_id, '0290', 'Afschrijving vaste activa', 'Afschrijving vaste activa', 'asset', 'accumulated_depreciation', TRUE, 'credit', 29),
  (p_org_id, '1000', 'Vlottende activa', 'Vlottende activa', 'asset', 'other_asset', TRUE, 'debit', 100),
  (p_org_id, '1100', 'Liquide middelen', 'Liquide middelen', 'asset', 'cash', TRUE, 'debit', 110),
  (p_org_id, '1110', 'Kas', 'Kas', 'asset', 'cash', TRUE, 'debit', 111),
  (p_org_id, '1120', 'Bank (hoofdrekening)', 'Bank (hoofdrekening)', 'asset', 'bank', TRUE, 'debit', 112),
  (p_org_id, '1130', 'Bank (spaarrekening)', 'Bank (spaarrekening)', 'asset', 'bank', FALSE, 'debit', 113),
  (p_org_id, '1140', 'Bank (extra rekening)', 'Bank (extra rekening)', 'asset', 'bank', FALSE, 'debit', 114),
  (p_org_id, '1200', 'Kruisposten', 'Kruisposten', 'asset', 'other_asset', TRUE, 'debit', 120),
  (p_org_id, '1300', 'Debiteuren', 'Debiteuren', 'asset', 'accounts_receivable', TRUE, 'debit', 130),
  (p_org_id, '1310', 'Debiteuren binnenland', 'Debiteuren binnenland', 'asset', 'accounts_receivable', FALSE, 'debit', 131),
  (p_org_id, '1320', 'Debiteuren buitenland', 'Debiteuren buitenland', 'asset', 'accounts_receivable', FALSE, 'debit', 132),
  (p_org_id, '1350', 'Dubieuze debiteuren', 'Dubieuze debiteuren', 'asset', 'accounts_receivable', FALSE, 'debit', 135),
  (p_org_id, '1400', 'Voorraad', 'Voorraad', 'asset', 'inventory', FALSE, 'debit', 140),
  (p_org_id, '1450', 'Vooruitbetaalde kosten', 'Vooruitbetaalde kosten', 'asset', 'prepaid', FALSE, 'debit', 145),
  (p_org_id, '1500', 'BTW te vorderen', 'BTW te vorderen', 'asset', 'vat_receivable', TRUE, 'debit', 150),
  (p_org_id, '1510', 'BTW voorbelasting hoog tarief', 'BTW voorbelasting 21%', 'asset', 'vat_receivable', TRUE, 'debit', 151),
  (p_org_id, '1520', 'BTW voorbelasting laag tarief', 'BTW voorbelasting 9%', 'asset', 'vat_receivable', TRUE, 'debit', 152),
  (p_org_id, '1530', 'BTW voorbelasting verlegd', 'BTW voorbelasting verlegd', 'asset', 'vat_receivable', TRUE, 'debit', 153),
  (p_org_id, '1540', 'BTW voorbelasting invoer', 'BTW voorbelasting invoer', 'asset', 'vat_receivable', TRUE, 'debit', 154),
  (p_org_id, '1590', 'BTW nog te verrekenen', 'BTW nog te verrekenen', 'asset', 'vat_receivable', TRUE, 'debit', 159),
  (p_org_id, '1600', 'Nog te ontvangen bedragen', 'Nog te ontvangen bedragen', 'asset', 'other_asset', FALSE, 'debit', 160),
  (p_org_id, '2000', 'Kortlopende schulden', 'Kortlopende schulden', 'liability', 'other_liability', TRUE, 'credit', 200),
  (p_org_id, '2100', 'Crediteuren', 'Crediteuren', 'liability', 'accounts_payable', TRUE, 'credit', 210),
  (p_org_id, '2110', 'Crediteuren binnenland', 'Crediteuren binnenland', 'liability', 'accounts_payable', FALSE, 'credit', 211),
  (p_org_id, '2120', 'Crediteuren buitenland', 'Crediteuren buitenland', 'liability', 'accounts_payable', FALSE, 'credit', 212),
  (p_org_id, '2200', 'Creditcard', 'Creditcard', 'liability', 'credit_card', FALSE, 'credit', 220),
  (p_org_id, '2300', 'BTW schulden', 'BTW schulden', 'liability', 'vat_payable', TRUE, 'credit', 230),
  (p_org_id, '2310', 'BTW af te dragen hoog tarief', 'BTW af te dragen 21%', 'liability', 'vat_payable', TRUE, 'credit', 231),
  (p_org_id, '2320', 'BTW af te dragen laag tarief', 'BTW af te dragen 9%', 'liability', 'vat_payable', TRUE, 'credit', 232),
  (p_org_id, '2330', 'BTW af te dragen verlegd', 'BTW af te dragen verlegd', 'liability', 'vat_payable', TRUE, 'credit', 233),
  (p_org_id, '2340', 'BTW afdracht', 'BTW afdracht', 'liability', 'vat_payable', TRUE, 'credit', 234),
  (p_org_id, '2400', 'Loonheffingen', 'Loonheffingen', 'liability', 'payroll_liability', FALSE, 'credit', 240),
  (p_org_id, '2500', 'Nog te betalen kosten', 'Nog te betalen kosten', 'liability', 'other_liability', FALSE, 'credit', 250),
  (p_org_id, '2600', 'Vooruit ontvangen', 'Vooruit ontvangen', 'liability', 'other_liability', FALSE, 'credit', 260),
  (p_org_id, '2700', 'Leningen', 'Leningen', 'liability', 'loan', FALSE, 'credit', 270),
  (p_org_id, '2800', 'Langlopende schulden', 'Langlopende schulden', 'liability', 'loan', FALSE, 'credit', 280),
  (p_org_id, '3000', 'Eigen vermogen', 'Eigen vermogen', 'equity', 'owner_equity', TRUE, 'credit', 300),
  (p_org_id, '3100', 'Kapitaal / aandelenkapitaal', 'Kapitaal', 'equity', 'owner_equity', TRUE, 'credit', 310),
  (p_org_id, '3200', 'Privé-stortingen', 'Privé-stortingen', 'equity', 'owner_equity', FALSE, 'credit', 320),
  (p_org_id, '3300', 'Privé-opnames', 'Privé-opnames', 'equity', 'owner_draw', FALSE, 'debit', 330),
  (p_org_id, '3400', 'Winstreserve', 'Winstreserve', 'equity', 'retained_earnings', TRUE, 'credit', 340),
  (p_org_id, '3500', 'Resultaat lopend boekjaar', 'Resultaat lopend boekjaar', 'equity', 'retained_earnings', TRUE, 'credit', 350),
  (p_org_id, '4000', 'Omzet', 'Omzet', 'revenue', 'sales_revenue', TRUE, 'credit', 400),
  (p_org_id, '4100', 'Omzet producten binnenland', 'Omzet producten binnenland', 'revenue', 'sales_revenue', FALSE, 'credit', 410),
  (p_org_id, '4200', 'Omzet diensten binnenland', 'Omzet diensten binnenland', 'revenue', 'service_revenue', FALSE, 'credit', 420),
  (p_org_id, '4300', 'Omzet export EU (ICP)', 'Omzet export EU (ICP)', 'revenue', 'sales_revenue', FALSE, 'credit', 430),
  (p_org_id, '4400', 'Omzet export buiten EU', 'Omzet export buiten EU', 'revenue', 'sales_revenue', FALSE, 'credit', 440),
  (p_org_id, '4500', 'Omzet verlegd', 'Omzet verlegd', 'revenue', 'sales_revenue', FALSE, 'credit', 450),
  (p_org_id, '4900', 'Overige opbrengsten', 'Overige opbrengsten', 'revenue', 'other_income', FALSE, 'credit', 490),
  (p_org_id, '7000', 'Bedrijfskosten', 'Bedrijfskosten', 'expense', 'operating_expense', TRUE, 'debit', 700),
  (p_org_id, '7010', 'Inkoopkosten', 'Inkoopkosten', 'expense', 'cost_of_goods', TRUE, 'debit', 701),
  (p_org_id, '7020', 'Inkoopkosten grondstoffen', 'Inkoopkosten grondstoffen', 'expense', 'cost_of_goods', FALSE, 'debit', 702),
  (p_org_id, '7100', 'Huisvestingskosten', 'Huisvestingskosten', 'expense', 'rent', FALSE, 'debit', 710),
  (p_org_id, '7110', 'Huur bedrijfsruimte', 'Huur bedrijfsruimte', 'expense', 'rent', FALSE, 'debit', 711),
  (p_org_id, '7120', 'Energie en water', 'Energie en water', 'expense', 'utilities', FALSE, 'debit', 712),
  (p_org_id, '7130', 'Onderhoud bedrijfsruimte', 'Onderhoud bedrijfsruimte', 'expense', 'operating_expense', FALSE, 'debit', 713),
  (p_org_id, '7200', 'Verkoopkosten', 'Verkoopkosten', 'expense', 'marketing', FALSE, 'debit', 720),
  (p_org_id, '7210', 'Reclame en marketing', 'Reclame en marketing', 'expense', 'marketing', FALSE, 'debit', 721),
  (p_org_id, '7220', 'Representatiekosten', 'Representatiekosten', 'expense', 'marketing', FALSE, 'debit', 722),
  (p_org_id, '7300', 'Autokosten', 'Autokosten', 'expense', 'travel', FALSE, 'debit', 730),
  (p_org_id, '7310', 'Brandstofkosten', 'Brandstofkosten', 'expense', 'travel', FALSE, 'debit', 731),
  (p_org_id, '7320', 'Leasekosten', 'Leasekosten', 'expense', 'travel', FALSE, 'debit', 732),
  (p_org_id, '7330', 'Onderhoud vervoermiddelen', 'Onderhoud vervoermiddelen', 'expense', 'travel', FALSE, 'debit', 733),
  (p_org_id, '7340', 'Reiskosten', 'Reiskosten', 'expense', 'travel', FALSE, 'debit', 734),
  (p_org_id, '7400', 'Kantoorkosten', 'Kantoorkosten', 'expense', 'office_supplies', FALSE, 'debit', 740),
  (p_org_id, '7410', 'Kantoorbenodigdheden', 'Kantoorbenodigdheden', 'expense', 'office_supplies', FALSE, 'debit', 741),
  (p_org_id, '7420', 'Telefoon en internet', 'Telefoon en internet', 'expense', 'utilities', FALSE, 'debit', 742),
  (p_org_id, '7430', 'Software en abonnementen', 'Software en abonnementen', 'expense', 'operating_expense', FALSE, 'debit', 743),
  (p_org_id, '7440', 'Porti en verzendkosten', 'Porti en verzendkosten', 'expense', 'operating_expense', FALSE, 'debit', 744),
  (p_org_id, '7500', 'Personeelskosten', 'Personeelskosten', 'expense', 'payroll_expense', FALSE, 'debit', 750),
  (p_org_id, '7510', 'Brutolonen', 'Brutolonen', 'expense', 'payroll_expense', FALSE, 'debit', 751),
  (p_org_id, '7520', 'Sociale lasten', 'Sociale lasten', 'expense', 'payroll_expense', FALSE, 'debit', 752),
  (p_org_id, '7530', 'Pensioenkosten', 'Pensioenkosten', 'expense', 'payroll_expense', FALSE, 'debit', 753),
  (p_org_id, '7600', 'Algemene kosten', 'Algemene kosten', 'expense', 'operating_expense', FALSE, 'debit', 760),
  (p_org_id, '7610', 'Accountantskosten', 'Accountantskosten', 'expense', 'professional_fees', FALSE, 'debit', 761),
  (p_org_id, '7620', 'Advieskosten', 'Advieskosten', 'expense', 'professional_fees', FALSE, 'debit', 762),
  (p_org_id, '7630', 'Verzekeringen', 'Verzekeringen', 'expense', 'insurance', FALSE, 'debit', 763),
  (p_org_id, '7640', 'Bankkosten', 'Bankkosten', 'expense', 'operating_expense', FALSE, 'debit', 764),
  (p_org_id, '7650', 'Contributies en abonnementen', 'Contributies en abonnementen', 'expense', 'operating_expense', FALSE, 'debit', 765),
  (p_org_id, '7700', 'Afschrijvingskosten', 'Afschrijvingskosten', 'expense', 'depreciation_expense', FALSE, 'debit', 770),
  (p_org_id, '7800', 'Financiële lasten', 'Financiële lasten', 'expense', 'interest_expense', FALSE, 'debit', 780),
  (p_org_id, '7810', 'Rentelasten', 'Rentelasten', 'expense', 'interest_expense', FALSE, 'debit', 781),
  (p_org_id, '7900', 'Belastingen', 'Belastingen', 'expense', 'tax_expense', FALSE, 'debit', 790),
  (p_org_id, '7910', 'Vennootschapsbelasting', 'Vennootschapsbelasting', 'expense', 'tax_expense', FALSE, 'debit', 791);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION seed_vat_rates(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO vat_rates (organization_id, rate_type, percentage, description, description_nl, sales_box, purchase_box, valid_from, is_active, sort_order) VALUES
  (p_org_id, 'high', 21.00, 'Standard rate (21%)', 'Hoog tarief (21%)', '1a', '5b', '2012-10-01', TRUE, 1),
  (p_org_id, 'low', 9.00, 'Reduced rate (9%)', 'Laag tarief (9%)', '1b', '5b', '2019-01-01', TRUE, 2),
  (p_org_id, 'zero', 0.00, 'Zero rate (0%)', 'Nultarief (0%)', '1c', '5b', '2000-01-01', TRUE, 3),
  (p_org_id, 'exempt', 0.00, 'Exempt', 'Vrijgesteld', NULL, NULL, '2000-01-01', TRUE, 4),
  (p_org_id, 'reverse_charge', 0.00, 'Reverse charge', 'BTW verlegd', '1e', '5b', '2000-01-01', TRUE, 5),
  (p_org_id, 'icp', 0.00, 'Intra-community', 'Intracommunautair', '3b', NULL, '2000-01-01', TRUE, 6),
  (p_org_id, 'export', 0.00, 'Export outside EU', 'Export buiten EU', '3a', NULL, '2000-01-01', TRUE, 7),
  (p_org_id, 'import', 21.00, 'Import VAT', 'Invoer BTW', '4a', '5b', '2000-01-01', TRUE, 8),
  (p_org_id, 'margin', 0.00, 'Margin scheme', 'Margeregeling', NULL, NULL, '2000-01-01', TRUE, 9);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION setup_new_organization(p_org_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO organization_members (organization_id, user_id, role, is_owner, accepted_at) VALUES (p_org_id, p_user_id, 'entrepreneur', TRUE, NOW());
  PERFORM seed_chart_of_accounts(p_org_id);
  PERFORM seed_vat_rates(p_org_id);
  INSERT INTO fiscal_periods (organization_id, year, month) SELECT p_org_id, EXTRACT(YEAR FROM NOW())::INTEGER, generate_series(1, 12);
  INSERT INTO audit_log (organization_id, user_id, action, entity_type, entity_id, change_summary) VALUES (p_org_id, p_user_id, 'create', 'organization', p_org_id, 'Organization created and initial setup completed');
END;
$$ LANGUAGE plpgsql;

-- Update handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;
