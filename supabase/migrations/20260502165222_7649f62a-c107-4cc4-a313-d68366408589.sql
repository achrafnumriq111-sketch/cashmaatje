-- ============================================================
-- Foundation migration: roles, contracts, KVK, memoriaal,
-- uren, agenda, boekhouder share, VPB, bank uploads
-- ============================================================

-- Helper: timestamp updater bestaat al (update_updated_at_column)

-- 1) ENTITY ROLES (per-organization permissions)
CREATE TYPE public.entity_role AS ENUM ('owner','admin','editor','viewer');

CREATE TABLE public.entity_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.entity_role NOT NULL DEFAULT 'viewer',
  can_read boolean NOT NULL DEFAULT true,
  can_write boolean NOT NULL DEFAULT false,
  can_admin boolean NOT NULL DEFAULT false,
  invited_by uuid,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
CREATE INDEX idx_entity_roles_org ON public.entity_roles(organization_id);
CREATE INDEX idx_entity_roles_user ON public.entity_roles(user_id);

ALTER TABLE public.entity_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "er_select_own_or_org" ON public.entity_roles FOR SELECT
  USING (user_id = auth.uid() OR organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "er_admin_insert" ON public.entity_roles FOR INSERT
  WITH CHECK (public.can_manage_org_members(organization_id));
CREATE POLICY "er_admin_update" ON public.entity_roles FOR UPDATE
  USING (public.can_manage_org_members(organization_id));
CREATE POLICY "er_admin_delete" ON public.entity_roles FOR DELETE
  USING (public.can_manage_org_members(organization_id));

CREATE TRIGGER trg_entity_roles_updated BEFORE UPDATE ON public.entity_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) CONTRACTS
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploaded_by uuid,
  contact_id uuid,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  title text NOT NULL,
  file_path text,
  file_mime text,
  raw_text text,
  status text NOT NULL DEFAULT 'pending', -- pending | parsing | analyzing | done | failed
  error_message text,
  analysis jsonb,                          -- {wet_dba, exclusivity, fiscal_risks, payment_terms, ...}
  risk_level text,                         -- low | medium | high
  ai_model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_contracts_org ON public.contracts(organization_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ct_select" ON public.contracts FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "ct_insert" ON public.contracts FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "ct_update" ON public.contracts FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "ct_delete" ON public.contracts FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE TRIGGER trg_contracts_updated BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) KVK CACHE
CREATE TABLE public.kvk_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kvk_number text NOT NULL UNIQUE,
  handelsnaam text,
  rechtsvorm text,
  vestigingsadres jsonb,
  status text,
  raw jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX idx_kvk_expires ON public.kvk_companies(expires_at);

ALTER TABLE public.kvk_companies ENABLE ROW LEVEL SECURITY;
-- KVK lookups zijn publiek opvraagbaar; wel auth required
CREATE POLICY "kvk_select_authenticated" ON public.kvk_companies FOR SELECT
  TO authenticated USING (true);
-- Schrijven alleen via service role (edge function)

-- 4) MEMORIAAL JOURNAL ENTRIES
CREATE TABLE public.memorial_journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  description text NOT NULL,
  reference text,
  total_debit numeric(14,2) NOT NULL DEFAULT 0,
  total_credit numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft', -- draft | posted
  posted_journal_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mje_org ON public.memorial_journal_entries(organization_id);

CREATE TABLE public.memorial_journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_entry_id uuid NOT NULL REFERENCES public.memorial_journal_entries(id) ON DELETE CASCADE,
  line_number int NOT NULL,
  account_id uuid NOT NULL REFERENCES public.accounts(id),
  description text,
  debit_amount numeric(14,2) NOT NULL DEFAULT 0,
  credit_amount numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mjl_entry ON public.memorial_journal_lines(memorial_entry_id);

ALTER TABLE public.memorial_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorial_journal_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mje_all" ON public.memorial_journal_entries FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "mjl_all" ON public.memorial_journal_lines FOR ALL
  USING (EXISTS (SELECT 1 FROM public.memorial_journal_entries m
    WHERE m.id = memorial_journal_lines.memorial_entry_id
      AND m.organization_id IN (SELECT get_user_org_ids())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.memorial_journal_entries m
    WHERE m.id = memorial_journal_lines.memorial_entry_id
      AND m.organization_id IN (SELECT get_user_org_ids())));

CREATE TRIGGER trg_mje_updated BEFORE UPDATE ON public.memorial_journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) TIME ENTRIES (urenregistratie)
CREATE TABLE public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  entry_date date NOT NULL,
  hours numeric(6,2) NOT NULL,
  hourly_rate_eur numeric(10,2),
  description text,
  is_billable boolean NOT NULL DEFAULT true,
  is_invoiced boolean NOT NULL DEFAULT false,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  agenda_event_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_te_org_date ON public.time_entries(organization_id, entry_date);
CREATE INDEX idx_te_contact ON public.time_entries(contact_id);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "te_all" ON public.time_entries FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE TRIGGER trg_te_updated BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) AGENDA EVENTS
CREATE TABLE public.agenda_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  is_billable boolean NOT NULL DEFAULT false,
  hourly_rate_eur numeric(10,2),
  status text NOT NULL DEFAULT 'planned', -- planned | done | cancelled
  time_entry_id uuid REFERENCES public.time_entries(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ae_org_start ON public.agenda_events(organization_id, start_at);

ALTER TABLE public.agenda_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ae_all" ON public.agenda_events FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE TRIGGER trg_ae_updated BEFORE UPDATE ON public.agenda_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) ACCOUNTANT SHARES
CREATE TABLE public.accountant_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_name text,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  permissions jsonb NOT NULL DEFAULT '{"read":true,"download":true}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending | active | revoked
  expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_as_org ON public.accountant_shares(organization_id);
CREATE INDEX idx_as_token ON public.accountant_shares(share_token);

ALTER TABLE public.accountant_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "as_select" ON public.accountant_shares FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "as_admin_write" ON public.accountant_shares FOR INSERT
  WITH CHECK (public.can_manage_org_members(organization_id));
CREATE POLICY "as_admin_update" ON public.accountant_shares FOR UPDATE
  USING (public.can_manage_org_members(organization_id));
CREATE POLICY "as_admin_delete" ON public.accountant_shares FOR DELETE
  USING (public.can_manage_org_members(organization_id));

CREATE TRIGGER trg_as_updated BEFORE UPDATE ON public.accountant_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8) VPB CALCULATIONS
CREATE TABLE public.vpb_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  fiscal_year int NOT NULL,
  belastbare_winst numeric(14,2) NOT NULL DEFAULT 0,
  schijf_1_grens_eur numeric(14,2) NOT NULL DEFAULT 200000,
  schijf_1_tarief numeric(5,2) NOT NULL DEFAULT 19.0,
  schijf_2_tarief numeric(5,2) NOT NULL DEFAULT 25.8,
  vpb_schijf_1 numeric(14,2) NOT NULL DEFAULT 0,
  vpb_schijf_2 numeric(14,2) NOT NULL DEFAULT 0,
  vpb_total numeric(14,2) NOT NULL DEFAULT 0,
  rates_used jsonb,
  ai_reasoning text,
  ai_model text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, fiscal_year)
);

ALTER TABLE public.vpb_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vpb_all" ON public.vpb_calculations FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE TRIGGER trg_vpb_updated BEFORE UPDATE ON public.vpb_calculations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9) BANK UPLOADS (status tracking voor CSV/MT940 imports)
CREATE TABLE public.bank_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  uploaded_by uuid,
  filename text NOT NULL,
  file_size int,
  format text, -- csv | mt940 | camt
  status text NOT NULL DEFAULT 'pending', -- pending | parsing | parsed | failed
  rows_total int DEFAULT 0,
  rows_imported int DEFAULT 0,
  rows_skipped int DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bu_org ON public.bank_uploads(organization_id);

ALTER TABLE public.bank_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bu_all" ON public.bank_uploads FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE TRIGGER trg_bu_updated BEFORE UPDATE ON public.bank_uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10) Memoriaal post helper: zet draft om naar posted journal_entry
CREATE OR REPLACE FUNCTION public.post_memorial_journal(p_memorial_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mem RECORD;
  v_je_id uuid;
  v_total_debit numeric(14,2) := 0;
  v_total_credit numeric(14,2) := 0;
  v_line RECORD;
  v_line_no int := 0;
BEGIN
  SELECT * INTO v_mem FROM memorial_journal_entries WHERE id = p_memorial_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'memorial entry not found'; END IF;

  IF NOT EXISTS (SELECT 1 FROM organization_members WHERE organization_id = v_mem.organization_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not authorised';
  END IF;

  IF v_mem.status = 'posted' THEN RAISE EXCEPTION 'already posted'; END IF;

  SELECT COALESCE(SUM(debit_amount),0), COALESCE(SUM(credit_amount),0)
    INTO v_total_debit, v_total_credit
    FROM memorial_journal_lines WHERE memorial_entry_id = p_memorial_id;

  IF ABS(v_total_debit - v_total_credit) > 0.01 THEN
    RAISE EXCEPTION 'Debet (%) en credit (%) zijn niet in balans', v_total_debit, v_total_credit;
  END IF;

  INSERT INTO journal_entries (organization_id, date, description, status, source_type, posted_at, posted_by, created_by)
  VALUES (v_mem.organization_id, v_mem.entry_date, COALESCE(v_mem.description, 'Memoriaalboeking'),
          'posted', 'memorial', now(), auth.uid(), auth.uid())
  RETURNING id INTO v_je_id;

  FOR v_line IN
    SELECT * FROM memorial_journal_lines
    WHERE memorial_entry_id = p_memorial_id ORDER BY line_number
  LOOP
    v_line_no := v_line_no + 1;
    INSERT INTO journal_lines (journal_entry_id, line_number, account_id, description, debit_amount, credit_amount)
    VALUES (v_je_id, v_line_no, v_line.account_id, v_line.description, v_line.debit_amount, v_line.credit_amount);
  END LOOP;

  UPDATE memorial_journal_entries
    SET status = 'posted', posted_journal_entry_id = v_je_id,
        total_debit = v_total_debit, total_credit = v_total_credit
    WHERE id = p_memorial_id;

  RETURN v_je_id;
END;
$$;