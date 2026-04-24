-- Add payment tracking fields to vat_returns
ALTER TABLE public.vat_returns
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_due_date date,
  ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS paid_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_notes text;

-- Constrain payment_status to known values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vat_returns_payment_status_check'
  ) THEN
    ALTER TABLE public.vat_returns
      ADD CONSTRAINT vat_returns_payment_status_check
      CHECK (payment_status IN ('unpaid','scheduled','paid','refunded','overdue','partial'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_vat_returns_payment_status
  ON public.vat_returns (organization_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_vat_returns_filed_at
  ON public.vat_returns (organization_id, filed_at DESC);