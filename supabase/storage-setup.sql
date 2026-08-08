-- Run this once in the SQL editor of the self-hosted Supabase dashboard.
-- Anyone may add images without being able to list, read, replace, or delete
-- them. Signed-in guests use their account ID so the private gallery can match
-- their photos to an RSVP; other uploads remain anonymous.

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
drop policy if exists "Anonymous wedding guests can upload photos" on storage.objects;
drop policy if exists "Signed-in wedding guests can upload photos" on storage.objects;

create policy "Anonymous wedding guests can upload photos"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'wedding-uploads'
  and (storage.foldername(name))[1] = 'guest'
  and (storage.foldername(name))[2] = 'anonymous'
);

create policy "Signed-in wedding guests can upload photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'wedding-uploads'
  and (storage.foldername(name))[1] = 'guest'
  and (storage.foldername(name))[2] = (select auth.uid())::text
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
