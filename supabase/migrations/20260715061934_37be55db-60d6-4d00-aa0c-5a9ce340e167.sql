ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_invoices_org_archived ON public.invoices(organization_id, archived);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS auto_archive_months integer;