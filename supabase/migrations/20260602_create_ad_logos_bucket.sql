-- ============================================================
-- Migration: create ad-logos storage bucket with RLS
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Skapa publik bucket
insert into storage.buckets (id, name, public)
values ('ad-logos', 'ad-logos', true)
on conflict (id) do nothing;

-- 2. SELECT – alla kan läsa filer i bucketen
create policy "ad-logos: alla kan läsa"
  on storage.objects
  for select
  using (bucket_id = 'ad-logos');

-- 3. INSERT – endast admin kan ladda upp
create policy "ad-logos: admin kan ladda upp"
  on storage.objects
  for insert
  with check (
    bucket_id = 'ad-logos'
    and exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- 4. DELETE – endast admin kan ta bort
create policy "ad-logos: admin kan ta bort"
  on storage.objects
  for delete
  using (
    bucket_id = 'ad-logos'
    and exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );
