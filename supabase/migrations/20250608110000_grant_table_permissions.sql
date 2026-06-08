-- RLS policies filter rows, but roles still need table-level GRANTs.
-- Without these, authenticated users get "permission denied for table profiles".

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;

GRANT SELECT ON public.tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tags TO authenticated;

GRANT SELECT ON public.posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;

GRANT SELECT ON public.post_tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.post_tags TO authenticated;

GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(user_role[]) TO anon, authenticated;
