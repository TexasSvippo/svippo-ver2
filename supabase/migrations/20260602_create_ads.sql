-- ============================================================
-- Migration: create ads table
-- Run this in Supabase SQL Editor
-- ============================================================

create table if not exists ads (
  id               uuid        primary key default gen_random_uuid(),
  company_name     text        not null,
  logo_url         text        not null,
  headline         text        not null check (char_length(headline) <= 60),
  description      text        not null check (char_length(description) <= 120),
  cta_label        text        not null default 'Läs mer' check (char_length(cta_label) <= 20),
  cta_url          text        not null,
  is_active        boolean     not null default false,
  starts_at        timestamptz,
  ends_at          timestamptz,
  click_count      integer     not null default 0,
  impression_count integer     not null default 0,
  created_at       timestamptz not null default now()
);

-- RLS
alter table ads enable row level security;

-- Alla kan läsa aktiva annonser inom giltig tidsperiod
create policy "Aktiva annonser är publikt läsbara"
  on ads
  for select
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >= now())
  );

-- Endast admin kan skapa annonser
create policy "Endast admin kan skapa annonser"
  on ads
  for insert
  with check (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Endast admin kan uppdatera annonser
create policy "Endast admin kan uppdatera annonser"
  on ads
  for update
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Endast admin kan ta bort annonser
create policy "Endast admin kan ta bort annonser"
  on ads
  for delete
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );
