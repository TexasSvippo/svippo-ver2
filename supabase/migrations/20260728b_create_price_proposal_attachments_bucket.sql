-- ============================================================
-- Migration: create price-proposal-attachments storage bucket with RLS
--
-- Same public-read / restricted-write shape as ad-logos, avatars, etc.
-- Files are uploaded under a path of `{order_id}/{timestamp}-{filename}`,
-- so the insert policy checks that the uploader is the seller of that
-- specific order (parsed from the path via storage.foldername).
--
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Skapa publik bucket
insert into storage.buckets (id, name, public)
values ('price-proposal-attachments', 'price-proposal-attachments', true)
on conflict (id) do nothing;

-- 2. SELECT – alla kan läsa filer i bucketen
create policy "price-proposal-attachments: alla kan läsa"
  on storage.objects
  for select
  using (bucket_id = 'price-proposal-attachments');

-- 3. INSERT – endast säljaren av den order som mappnamnet (order_id) pekar på
create policy "price-proposal-attachments: säljaren kan ladda upp"
  on storage.objects
  for insert
  with check (
    bucket_id = 'price-proposal-attachments'
    and exists (
      select 1 from orders
      where orders.id::text = (storage.foldername(name))[1]
      and orders.seller_id = auth.uid()
    )
  );
