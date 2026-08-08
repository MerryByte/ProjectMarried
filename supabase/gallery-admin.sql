-- Run after creating the user anatoliybar@gmail.com in Supabase Studio Authentication.
-- This server-controlled app_metadata claim grants access to the private gallery.

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"gallery_admin": true}'::jsonb
where lower(email) = lower('anatoliybar@gmail.com');

do $$
begin
  if not exists (
    select 1 from auth.users
    where lower(email) = lower('anatoliybar@gmail.com')
      and raw_app_meta_data ->> 'gallery_admin' = 'true'
  ) then
    raise exception 'Gallery user was not found or could not be authorized';
  end if;
end $$;
