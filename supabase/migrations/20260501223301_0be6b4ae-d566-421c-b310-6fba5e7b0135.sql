-- Add parent linking + ownership pct to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS parent_organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS entity_ownership_pct numeric(5,2) DEFAULT 100.00;

CREATE INDEX IF NOT EXISTS idx_organizations_parent ON public.organizations(parent_organization_id);

-- Entity add-ons table
CREATE TABLE IF NOT EXISTS public.entity_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  child_organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_subscription_item_id text,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'incomplete',
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entity_addons_parent ON public.entity_addons(parent_organization_id);
CREATE INDEX IF NOT EXISTS idx_entity_addons_status ON public.entity_addons(status);

ALTER TABLE public.entity_addons ENABLE ROW LEVEL SECURITY;

-- Members of parent org can read
CREATE POLICY "Parent org members can read entity addons"
  ON public.entity_addons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = entity_addons.parent_organization_id
        AND om.user_id = auth.uid()
    )
    OR public.is_platform_admin(auth.uid())
  );

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_entity_addons_updated_at ON public.entity_addons;
CREATE TRIGGER update_entity_addons_updated_at
  BEFORE UPDATE ON public.entity_addons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
