-- Atomic increment functions for ad tracking
-- Run this in Supabase SQL Editor

create or replace function increment_ad_clicks(ad_id uuid)
returns void
language sql
security definer
as $$
  update ads set click_count = click_count + 1 where id = ad_id;
$$;

create or replace function increment_ad_impression(ad_id uuid)
returns void
language sql
security definer
as $$
  update ads set impression_count = impression_count + 1 where id = ad_id;
$$;
