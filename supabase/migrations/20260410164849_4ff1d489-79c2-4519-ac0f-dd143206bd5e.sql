-- Add tax pipeline columns to documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS vat_rate_type_detected text,
  ADD COLUMN IF NOT EXISTS tax_box_mapping text,
  ADD COLUMN IF NOT EXISTS is_business_expense boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'inbox',
  ADD COLUMN IF NOT EXISTS country_of_origin varchar DEFAULT 'NL',
  ADD COLUMN IF NOT EXISTS ai_category_confidence numeric,
  ADD COLUMN IF NOT EXISTS supplier_pattern_id uuid;

-- Create supplier patterns table for AI learning loop
CREATE TABLE IF NOT EXISTS public.supplier_patterns (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_name text NOT NULL,
  normalized_name text NOT NULL,
  default_category text,
  default_vat_rate_type text,
  default_tax_box text,
  default_account_id uuid REFERENCES public.accounts(id),
  is_business boolean DEFAULT true,
  country varchar DEFAULT 'NL',
  times_seen integer DEFAULT 1,
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, normalized_name)
);

ALTER TABLE public.supplier_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view supplier_patterns"
ON public.supplier_patterns FOR SELECT
USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Org members can insert supplier_patterns"
ON public.supplier_patterns FOR INSERT
WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Org members can update supplier_patterns"
ON public.supplier_patterns FOR UPDATE
USING (organization_id IN (SELECT get_user_org_ids()));

-- Add foreign key from documents to supplier_patterns
ALTER TABLE public.documents
  ADD CONSTRAINT documents_supplier_pattern_id_fkey
  FOREIGN KEY (supplier_pattern_id) REFERENCES public.supplier_patterns(id);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON public.documents(organization_id, processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_supplier_patterns_org_name ON public.supplier_patterns(organization_id, normalized_name);