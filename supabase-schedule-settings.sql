alter table public.site_settings
  add column if not exists ceremony_time time,
  add column if not exists ceremony_location text,
  add column if not exists celebration_time time,
  add column if not exists celebration_location text;

grant update (
  upload_unlock_at,
  ceremony_time,
  ceremony_location,
  celebration_time,
  celebration_location,
  updated_at
) on public.site_settings to authenticated;

notify pgrst, 'reload schema';
