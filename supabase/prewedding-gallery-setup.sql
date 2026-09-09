-- Run once after the existing storage setup.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wedding-prewedding', 'wedding-prewedding', true, 15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set public = true;

drop policy if exists "Wedding admins can upload prewedding images" on storage.objects;
create policy "Wedding admins can upload prewedding images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'wedding-prewedding'
  and (storage.foldername(name))[1] = 'prewedding'
  and lower((select auth.jwt()->>'email')) = 'anatoliybar@gmail.com'
);

drop policy if exists "Anyone can list prewedding images" on storage.objects;
create policy "Anyone can list prewedding images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'wedding-prewedding');
