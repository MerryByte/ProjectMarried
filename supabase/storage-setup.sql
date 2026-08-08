-- Run this once in the SQL editor of the self-hosted Supabase dashboard.
-- Guests may upload images, but cannot list, read, replace, or delete them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wedding-uploads',
  'wedding-uploads',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Wedding guests can upload photos" on storage.objects;

create policy "Wedding guests can upload photos"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'wedding-uploads'
  and (storage.foldername(name))[1] = 'guest'
);

drop policy if exists "Wedding gallery admin can view photos" on storage.objects;

create policy "Wedding gallery admin can view photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'wedding-uploads'
  and coalesce((auth.jwt() -> 'app_metadata' ->> 'gallery_admin')::boolean, false)
);
