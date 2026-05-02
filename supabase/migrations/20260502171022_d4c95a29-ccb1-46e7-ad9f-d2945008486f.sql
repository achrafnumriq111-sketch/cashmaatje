
ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS journal_entry_id uuid REFERENCES public.journal_entries(id);

CREATE OR REPLACE FUNCTION public.post_payroll_journal(p_run_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run RECORD;
  v_je_id uuid;
  v_acc_loonkosten uuid;
  v_acc_loonheffing uuid;
  v_acc_nettobetaal uuid;
  v_acc_sociaal uuid;
  v_period_date date;
BEGIN
  SELECT * INTO v_run FROM payroll_runs WHERE id = p_run_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'payroll run not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM organization_members WHERE organization_id = v_run.organization_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not authorised';
  END IF;
  IF v_run.journal_entry_id IS NOT NULL THEN
    RETURN v_run.journal_entry_id;
  END IF;

  SELECT id INTO v_acc_loonkosten FROM accounts WHERE organization_id = v_run.organization_id AND code = '7510' LIMIT 1;
  SELECT id INTO v_acc_sociaal    FROM accounts WHERE organization_id = v_run.organization_id AND code = '7520' LIMIT 1;
  SELECT id INTO v_acc_loonheffing FROM accounts WHERE organization_id = v_run.organization_id AND code = '2400' LIMIT 1;
  SELECT id INTO v_acc_nettobetaal FROM accounts WHERE organization_id = v_run.organization_id AND code = '2500' LIMIT 1;

  IF v_acc_loonkosten IS NULL OR v_acc_loonheffing IS NULL OR v_acc_nettobetaal IS NULL THEN
    RAISE EXCEPTION 'Required accounts (7510/2400/2500) missing in chart of accounts';
  END IF;

  v_period_date := make_date(v_run.period_year, v_run.period_month, 1);

  INSERT INTO journal_entries (organization_id, date, description, status, source_type, posted_at, posted_by, created_by)
  VALUES (v_run.organization_id, (v_period_date + INTERVAL '1 month - 1 day')::date,
          format('Salarisrun %s-%s', v_run.period_year, lpad(v_run.period_month::text, 2, '0')),
          'posted', 'payroll', now(), auth.uid(), auth.uid())
  RETURNING id INTO v_je_id;

  INSERT INTO journal_lines (journal_entry_id, line_number, account_id, description, debit_amount, credit_amount) VALUES
    (v_je_id, 1, v_acc_loonkosten, 'Brutolonen', COALESCE(v_run.total_gross,0), 0),
    (v_je_id, 2, v_acc_sociaal,    'Sociale lasten werkgever', COALESCE(v_run.total_social,0), 0),
    (v_je_id, 3, v_acc_loonheffing, 'Loonheffing af te dragen', 0, COALESCE(v_run.total_tax,0)),
    (v_je_id, 4, v_acc_nettobetaal, 'Netto te betalen aan medewerkers', 0,
       COALESCE(v_run.total_gross,0) + COALESCE(v_run.total_social,0) - COALESCE(v_run.total_tax,0));

  UPDATE payroll_runs SET journal_entry_id = v_je_id, status = 'finalized', finalized_at = now() WHERE id = p_run_id;
  RETURN v_je_id;
END;
$$;
