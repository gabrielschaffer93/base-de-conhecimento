-- Auto-create profile on signup + fallback on first login
-- Run in Supabase SQL Editor if login works but profile is missing

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'editor',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS public.profiles AS $$
DECLARE
  v_user auth.users%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_profile_count int;
BEGIN
  SELECT * INTO v_user FROM auth.users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  IF FOUND THEN
    RETURN v_profile;
  END IF;

  SELECT count(*) INTO v_profile_count FROM public.profiles;

  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    v_user.id,
    v_user.email,
    COALESCE(v_user.raw_user_meta_data->>'full_name', ''),
    CASE WHEN v_profile_count = 0 THEN 'super_admin'::public.user_role ELSE 'editor'::public.user_role END,
    true
  )
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;
