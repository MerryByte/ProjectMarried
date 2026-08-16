create table if not exists public.site_settings (
  id text primary key,
  upload_unlock_at timestamptz not null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, upload_unlock_at)
values ('wedding', '2026-12-14 00:00:00-08')
on conflict (id) do nothing;

alter table public.site_settings enable row level security;
grant select on public.site_settings to anon, authenticated;
grant update (upload_unlock_at, updated_at) on public.site_settings to authenticated;

drop policy if exists "Wedding settings are public" on public.site_settings;
create policy "Wedding settings are public"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "Wedding admins can update settings" on public.site_settings;
create policy "Wedding admins can update settings"
on public.site_settings for update
to authenticated
using ((select auth.jwt()->>'email') = 'anatoliybar@gmail.com')
with check ((select auth.jwt()->>'email') = 'anatoliybar@gmail.com');

drop policy if exists "Uploads open on wedding date" on storage.objects;
create policy "Uploads open on wedding date"
on storage.objects as restrictive for insert
to anon, authenticated
with check (
  bucket_id = 'wedding-uploads'
  and now() >= (select upload_unlock_at from public.site_settings where id = 'wedding')
);
