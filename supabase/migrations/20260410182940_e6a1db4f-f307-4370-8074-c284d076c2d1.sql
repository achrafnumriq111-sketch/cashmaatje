CREATE OR REPLACE FUNCTION public.can_manage_org_members(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = auth.uid()
      AND (om.is_owner = true OR om.role = 'admin'::user_role)
  );
$$;

DROP POLICY IF EXISTS "Owners/admins can manage members" ON public.organization_members;

CREATE POLICY "Owners/admins can add members"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_org_members(organization_id));

CREATE POLICY "Owners/admins can update members"
ON public.organization_members
FOR UPDATE
TO authenticated
USING (public.can_manage_org_members(organization_id))
WITH CHECK (public.can_manage_org_members(organization_id));

CREATE POLICY "Owners/admins can delete members"
ON public.organization_members
FOR DELETE
TO authenticated
USING (public.can_manage_org_members(organization_id));