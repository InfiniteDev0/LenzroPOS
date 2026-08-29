-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Item photos live in the "PosImages" Storage bucket (already created,
-- public). This column just stores the resulting public URL. Uploads are
-- written to `{account_id}/{filename}` so the policies below can scope
-- who's allowed to write where — reads don't need a policy at all since
-- the bucket is public (getPublicUrl bypasses RLS for reads).

alter table public.items add column if not exists image_url text;

drop policy if exists "Account can upload own item images" on storage.objects;
create policy "Account can upload own item images"
  on storage.objects for insert
  with check (
    bucket_id = 'PosImages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Account can update own item images" on storage.objects;
create policy "Account can update own item images"
  on storage.objects for update
  using (
    bucket_id = 'PosImages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Account can delete own item images" on storage.objects;
create policy "Account can delete own item images"
  on storage.objects for delete
  using (
    bucket_id = 'PosImages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
