-- Lets an active super admin set another user's password without the Edge Function.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  target_user_id uuid,
  new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  IF NOT public.has_role(ARRAY['super_admin']::public.user_role[]) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF new_password IS NULL OR char_length(new_password) < 6 THEN
    RAISE EXCEPTION 'INVALID_PASSWORD';
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = crypt(new_password, gen_salt('bf', 10)),
    updated_at = now()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reset_user_password(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(uuid, text) TO authenticated;

UPDATE public.profiles
SET
  role = 'super_admin',
  is_active = true
WHERE lower(email) = 'gabriel.oliveira@vistasoft.com.br';
