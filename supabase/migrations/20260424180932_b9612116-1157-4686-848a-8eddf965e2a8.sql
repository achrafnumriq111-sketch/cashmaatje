CREATE OR REPLACE FUNCTION public.handle_super_admin_seed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IN ('info@mydotts.nl', 'info@mydotts.com') THEN
    INSERT INTO public.platform_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

INSERT INTO public.platform_roles (user_id, role)
SELECT id, 'super_admin'::platform_role
FROM auth.users
WHERE email IN ('info@mydotts.nl', 'info@mydotts.com')
ON CONFLICT (user_id, role) DO NOTHING;