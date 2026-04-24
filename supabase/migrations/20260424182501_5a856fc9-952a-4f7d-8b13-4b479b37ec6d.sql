-- Opening-balance importer used by the onboarding "Openingsbalans" CSV upload.
-- Inserts ONE balanced journal entry with N lines into the organisation's books.
CREATE OR REPLACE FUNCTION public.import_opening_balance(
  p_org_id uuid,
  p_date date,
  p_lines jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id uuid;
  v_total_debit numeric(14,2) := 0;
  v_total_credit numeric(14,2) := 0;
  v_line jsonb;
  v_account_id uuid;
  v_line_no int := 0;
BEGIN
  -- Authorisation: caller must be a member of the org
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorised for organisation %', p_org_id;
  END IF;

  -- Validate balance up front
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_total_debit  := v_total_debit  + COALESCE((v_line->>'debit')::numeric, 0);
    v_total_credit := v_total_credit + COALESCE((v_line->>'credit')::numeric, 0);
  END LOOP;

  IF ABS(v_total_debit - v_total_credit) > 0.01 THEN
    RAISE EXCEPTION 'Opening balance does not balance: debit %, credit %', v_total_debit, v_total_credit;
  END IF;

  -- Create draft entry first (validate_journal_balance trigger only enforces on posted)
  INSERT INTO journal_entries (organization_id, date, description, status, source_type, created_by)
  VALUES (p_org_id, p_date, 'Openingsbalans', 'draft', 'opening_balance', auth.uid())
  RETURNING id INTO v_entry_id;

  -- Insert lines
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_line_no := v_line_no + 1;
    SELECT id INTO v_account_id
    FROM accounts
    WHERE organization_id = p_org_id AND code = (v_line->>'account_code')
    LIMIT 1;
    IF v_account_id IS NULL THEN
      RAISE EXCEPTION 'Unknown account code: %', v_line->>'account_code';
    END IF;
    INSERT INTO journal_lines (
      journal_entry_id, line_number, account_id, description,
      debit_amount, credit_amount
    ) VALUES (
      v_entry_id, v_line_no, v_account_id, COALESCE(v_line->>'description', 'Beginsaldo'),
      COALESCE((v_line->>'debit')::numeric, 0),
      COALESCE((v_line->>'credit')::numeric, 0)
    );
  END LOOP;

  -- Post the entry now that all lines are in (trigger checks balance for posted)
  UPDATE journal_entries SET status = 'posted', posted_at = now(), posted_by = auth.uid()
  WHERE id = v_entry_id;

  RETURN v_entry_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.import_opening_balance(uuid, date, jsonb) TO authenticated;

-- Generates a stable inbox alias for an organisation, used to forward
-- supplier invoices into the documents pipeline.
CREATE OR REPLACE FUNCTION public.get_org_inbox_address(p_org_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'inbox-' || substr(replace(p_org_id::text, '-', ''), 1, 12) || '@inbox.cashmaatje.com'
  FROM organizations WHERE id = p_org_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_org_inbox_address(uuid) TO authenticated;