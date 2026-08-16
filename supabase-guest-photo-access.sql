drop policy if exists "Guests can view their own uploads" on storage.objects;
create policy "Guests can view their own uploads"
on storage.objects for select
to authenticated
using (
  bucket_id = 'wedding-uploads'
  and (storage.foldername(name))[1] = 'guest'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

notify pgrst, 'reload schema';
