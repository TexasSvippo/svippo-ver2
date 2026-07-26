-- ============================================================
-- Migration: create reports table
--
-- Reports were previously (mis)stored as rows in `notifications`
-- with type='report' and user_id = the REPORTER's own id — meaning
-- they only ever showed up in the reporter's own notification feed,
-- never reached an admin. This gives reports a real home with admin-
-- only visibility, matching the admin-bypass pattern already used
-- for svippare_profiles (20260726d/e).
--
-- Run this in Supabase SQL Editor
-- ============================================================

create table if not exists reports (
  id          uuid        primary key default gen_random_uuid(),
  reporter_id uuid        references users(id) on delete set null,
  target_type text        not null check (target_type in ('service', 'request')),
  target_id   uuid        not null,
  reason      text        not null,
  message     text,
  status      text        not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at  timestamptz not null default now()
);

alter table reports enable row level security;

-- Vem som helst (inloggad eller utloggad) kan skapa en rapport om sig
-- själv, eller anonymt (reporter_id null)
create policy "Vem som helst kan skapa en rapport"
  on reports
  for insert
  to public
  with check (reporter_id = auth.uid() or reporter_id is null);

-- Endast admin kan se rapporter
create policy "Endast admin kan se rapporter"
  on reports
  for select
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Endast admin kan uppdatera rapporter (markera granskad/avfärdad)
create policy "Endast admin kan uppdatera rapporter"
  on reports
  for update
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );
