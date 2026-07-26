-- ============================================================
-- Migration: admin bypass SELECT policy on svippare_profiles
--
-- Idag kan en användare bara se sin egen svippare_profiles-rad
-- (user_id = auth.uid()). Det gör att admin-panelens lista över
-- väntande ansökningar (src/app/admin/page.tsx) tyst returnerar
-- inga rader för andra användares ansökningar, trots att de finns.
--
-- Denna policy LÄGGS TILL utöver den befintliga (den befintliga
-- policyn rörs inte) — Postgres OR:ar ihop flera SELECT-policyer,
-- så användare ser fortfarande sin egen rad precis som innan, och
-- admin ser nu även allas rader. Samma mönster som ads-tabellens
-- "Endast admin kan..."-policyer.
--
-- Run this in Supabase SQL Editor
-- ============================================================

drop policy if exists "Endast admin kan se alla svippare-ansökningar" on svippare_profiles;
create policy "Endast admin kan se alla svippare-ansökningar"
  on svippare_profiles
  for select
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );
