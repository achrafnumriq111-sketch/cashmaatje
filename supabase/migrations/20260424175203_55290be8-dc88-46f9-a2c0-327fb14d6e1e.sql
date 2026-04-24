CREATE OR REPLACE FUNCTION public.handle_super_admin_seed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email = 'info@mydotts.com' THEN
    INSERT INTO public.platform_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Grant super_admin to existing user if already signed up
INSERT INTO public.platform_roles (user_id, role)
SELECT id, 'super_admin'::platform_role FROM auth.users WHERE email = 'info@mydotts.com'
ON CONFLICT (user_id, role) DO NOTHING;