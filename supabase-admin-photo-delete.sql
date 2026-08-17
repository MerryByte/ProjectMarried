drop policy if exists "Wedding admin can delete uploads" on storage.objects;
create policy "Wedding admin can delete uploads"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'wedding-uploads'
  and (select auth.jwt()->>'email') = 'anatoliybar@gmail.com'
);

notify pgrst, 'reload schema';
