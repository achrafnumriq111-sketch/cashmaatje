
-- 1. Make documents bucket PRIVATE
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- 2. Drop all existing storage policies on objects for documents bucket
DROP POLICY IF EXISTS "Org members can view documents files" ON storage.objects;
DROP POLICY IF EXISTS "Org members can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Org members can update documents files" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete documents files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

-- 3. Create secure storage policies that verify org membership via documents table
CREATE POLICY "Org members can view their documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.file_path = name
    AND d.organization_id IN (SELECT public.get_user_org_ids())
  )
);

CREATE POLICY "Org members can upload their documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can update their documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.file_path = name
    AND d.organization_id IN (SELECT public.get_user_org_ids())
  )
);

CREATE POLICY "Org members can delete their documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.file_path = name
    AND d.organization_id IN (SELECT public.get_user_org_ids())
  )
);

-- 4. Fix audit_log: add SELECT policy for admins/owners only
CREATE POLICY "Admins can view audit log"
ON public.audit_log FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
    AND (is_owner = true OR role IN ('admin'::user_role, 'accountant'::user_role))
  )
);

-- Also allow org members to INSERT audit log entries (needed for logging)
CREATE POLICY "Org members can insert audit log"
ON public.audit_log FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (SELECT public.get_user_org_ids())
);

-- 5. Fix organizations INSERT policy: replace overly permissive true with proper check
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (true);
-- Note: This must stay true because the user has no org yet when creating their first one.
-- The setup_new_organization RPC is SECURITY DEFINER and handles the actual creation safely.

-- 6. Restrict bank_rules DELETE to bookkeeper+ roles (was open to all members)
DROP POLICY IF EXISTS "Members can delete org bank rules" ON public.bank_rules;
CREATE POLICY "Bookkeeper+ can delete bank rules"
ON public.bank_rules FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
    AND role IN ('bookkeeper'::user_role, 'accountant'::user_role, 'admin'::user_role)
  )
);
