-- Verstevig RLS op organizations: voeg WITH CHECK toe zodat een UPDATE niet
-- alleen de oude rij maar ook de nieuwe rij scope-bewaakt blijft.
-- Alleen leden (owner/admin/accountant) van de organisatie mogen settings,
-- logo_url of onboarding-vlaggen wijzigen.

DROP POLICY IF EXISTS "Owners can update their organizations" ON public.organizations;

CREATE POLICY "Members can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
      AND (is_owner = true OR role IN ('admin'::user_role, 'accountant'::user_role))
  )
)
WITH CHECK (
  id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
      AND (is_owner = true OR role IN ('admin'::user_role, 'accountant'::user_role))
  )
);

COMMENT ON POLICY "Members can update their organization" ON public.organizations IS
  'Onboarding completion, settings JSONB en logo_url mogen alleen worden gewijzigd door een ingelogde owner/admin/accountant van diezelfde organisatie.';