-- Run once in Supabase SQL Editor if not applied via migrations.
-- Updates invited user profile with super_admin privileges (avoids session race on signUp).

CREATE OR REPLACE FUNCTION public.admin_update_invited_profile(
  target_user_id uuid,
  target_full_name text,
  target_role public.user_role
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  IF NOT public.has_role(ARRAY['super_admin']::public.user_role[]) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  UPDATE public.profiles
  SET
    full_name = target_full_name,
    role = target_role,
    is_active = true
  WHERE id = target_user_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_invited_profile(uuid, text, public.user_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_invited_profile(uuid, text, public.user_role) TO authenticated;
