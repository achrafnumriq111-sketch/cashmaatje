-- Drop the old "no delete" policy
DROP POLICY IF EXISTS "No delete on documents" ON public.documents;

-- Allow bookkeeper+ to delete documents
CREATE POLICY "Bookkeeper+ can delete documents"
ON public.documents
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_members.organization_id
    FROM organization_members
    WHERE organization_members.user_id = auth.uid()
      AND organization_members.role = ANY (ARRAY['bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role, 'entrepreneur'::user_role])
  )
);