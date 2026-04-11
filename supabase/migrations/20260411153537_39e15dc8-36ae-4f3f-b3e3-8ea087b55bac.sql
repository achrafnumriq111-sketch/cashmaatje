-- Drop the 2-param overload that conflicts with the full-param version
DROP FUNCTION IF EXISTS public.setup_new_organization(uuid, uuid);
