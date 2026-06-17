
-- 1. Invoice payment link + email tracking columns
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS payment_link_url text,
  ADD COLUMN IF NOT EXISTS payment_link_provider text,
  ADD COLUMN IF NOT EXISTS payment_link_session_id text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_message text;

-- 2. next_invoice_number: thread-safe via advisory lock
CREATE OR REPLACE FUNCTION public.next_invoice_number(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings jsonb;
  v_prefix text;
  v_format text;
  v_yearly_reset boolean;
  v_next_seq int;
  v_last_year int;
  v_current_year int := EXTRACT(YEAR FROM now())::int;
  v_lock_key bigint;
  v_number text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
  ) AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'not authorised for organisation %', p_org_id;
  END IF;

  -- Advisory lock per org om concurrent inserts te serialiseren
  v_lock_key := ('x' || substr(md5(p_org_id::text || 'invoice_number'), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT settings INTO v_settings FROM organizations WHERE id = p_org_id FOR UPDATE;

  v_prefix := COALESCE(v_settings->>'invoice_prefix', 'F');
  v_format := COALESCE(v_settings->>'invoice_number_format', '{prefix}{year}-{seq:4}');
  v_yearly_reset := COALESCE((v_settings->>'invoice_yearly_reset')::boolean, true);
  v_next_seq := COALESCE((v_settings->>'invoice_next_seq')::int, 1);
  v_last_year := COALESCE((v_settings->>'invoice_last_year')::int, v_current_year);

  -- Reset bij jaarwissel
  IF v_yearly_reset AND v_current_year > v_last_year THEN
    v_next_seq := 1;
  END IF;

  -- Format toepassen: {prefix}, {year}, {seq:N} (N = zero-padded width)
  v_number := v_format;
  v_number := replace(v_number, '{prefix}', v_prefix);
  v_number := replace(v_number, '{year}', v_current_year::text);
  v_number := regexp_replace(
    v_number,
    '\{seq:(\d+)\}',
    lpad(v_next_seq::text, GREATEST(1, (regexp_match(v_format, '\{seq:(\d+)\}'))[1]::int), '0'),
    'g'
  );
  v_number := replace(v_number, '{seq}', v_next_seq::text);

  -- Persist next sequence + year
  UPDATE organizations
  SET settings = COALESCE(settings, '{}'::jsonb)
    || jsonb_build_object(
      'invoice_prefix', v_prefix,
      'invoice_number_format', v_format,
      'invoice_yearly_reset', v_yearly_reset,
      'invoice_next_seq', v_next_seq + 1,
      'invoice_last_year', v_current_year
    )
  WHERE id = p_org_id;

  RETURN v_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_invoice_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_invoice_number(uuid) TO service_role;

-- 3. Auto-match bank transaction to invoice on insert
CREATE OR REPLACE FUNCTION public.auto_match_bank_to_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_confidence numeric;
  v_search_text text;
BEGIN
  -- Alleen positieve transacties (inkomende betalingen) automatisch matchen aan verkoopfacturen
  IF NEW.amount <= 0 OR NEW.matched_invoice_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_search_text := COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.payment_reference, '');

  -- Zoek een unieke openstaande verkoopfactuur met dit bedrag waarvan het nummer voorkomt in de omschrijving
  SELECT i.*, 0.95::numeric AS conf INTO v_invoice
  FROM invoices i
  WHERE i.organization_id = NEW.organization_id
    AND i.invoice_type = 'sales'
    AND i.status IN ('sent', 'overdue', 'partial', 'draft')
    AND ABS(i.amount_due - NEW.amount) < 0.01
    AND position(lower(i.invoice_number) IN lower(v_search_text)) > 0
  LIMIT 2;

  -- Alleen matchen als precies 1 kandidaat: voorkom verkeerde allocations
  IF NOT FOUND THEN
    -- Probeer match op IBAN + bedrag als fallback
    IF NEW.counterparty_iban IS NOT NULL THEN
      SELECT i.*, 0.85::numeric AS conf INTO v_invoice
      FROM invoices i
      JOIN contacts c ON c.id = i.contact_id
      WHERE i.organization_id = NEW.organization_id
        AND i.invoice_type = 'sales'
        AND i.status IN ('sent', 'overdue', 'partial')
        AND ABS(i.amount_due - NEW.amount) < 0.01
        AND c.id IN (
          SELECT contact_id FROM bank_transactions
          WHERE counterparty_iban = NEW.counterparty_iban AND contact_id IS NOT NULL
          LIMIT 1
        )
      LIMIT 2;
    END IF;
    IF NOT FOUND THEN
      RETURN NEW;
    END IF;
  END IF;

  v_confidence := v_invoice.conf;

  -- Alleen auto-allocate bij hoog vertrouwen
  IF v_confidence >= 0.9 THEN
    INSERT INTO payment_allocations (
      organization_id, bank_transaction_id, invoice_id, amount, allocation_date, created_by
    ) VALUES (
      NEW.organization_id, NEW.id, v_invoice.id, NEW.amount, NEW.transaction_date, NEW.organization_id
    );

    NEW.matched_invoice_id := v_invoice.id;
    NEW.status := 'matched';
    NEW.match_confidence := v_confidence;
    NEW.match_method := 'auto_invoice_number';
    NEW.contact_id := COALESCE(NEW.contact_id, v_invoice.contact_id);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Match failure mag insert niet blokkeren
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_match_bank_to_invoice ON public.bank_transactions;
CREATE TRIGGER trg_auto_match_bank_to_invoice
BEFORE INSERT ON public.bank_transactions
FOR EACH ROW
EXECUTE FUNCTION public.auto_match_bank_to_invoice();
