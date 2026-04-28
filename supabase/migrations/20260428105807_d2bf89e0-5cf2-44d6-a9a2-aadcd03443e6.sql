
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Branding files publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

CREATE POLICY "Org members can upload branding"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'branding'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_org_ids())
);

CREATE POLICY "Org members can update branding"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'branding'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_org_ids())
);

CREATE POLICY "Org members can delete branding"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'branding'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.get_user_org_ids())
);
