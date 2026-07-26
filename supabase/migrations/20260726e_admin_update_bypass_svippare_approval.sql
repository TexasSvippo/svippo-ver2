-- ============================================================
-- Migration: admin bypass UPDATE policies to support svippare approval
--
-- handleApprove()/handleReject() i src/app/admin/page.tsx gör två
-- UPDATE-anrop:
--   1. svippare_profiles: sätter status till 'approved'/'rejected'
--   2. users: sätter account_type till 'svippare' (vid godkännande)
--
-- Verifierat via ett riktigt admin-sessionstest: båda UPDATE-anropen
-- resolvar idag utan fel (error: null) men träffar noll rader — den
-- befintliga UPDATE-policyn på respektive tabell tillåter bara en
-- användare att uppdatera sin EGEN rad (user_id/id = auth.uid()),
-- så en admin som försöker uppdatera NÅGON ANNANS rad blir tyst
-- ignorerad av RLS istället för att blockeras med ett fel.
--
-- Båda policyerna nedan LÄGGS TILL utöver befintliga UPDATE-policyer
-- (rör dem inte) — Postgres OR:ar ihop flera UPDATE-policyer, så
-- befintligt beteende (användare uppdaterar sin egen rad) påverkas
-- inte. Samma mönster som SELECT-bypassen i 20260726d.
--
-- Notera: RLS-policyer är radnivå, inte kolumnnivå — policyn på
-- users nedan ger alltså admin rätt att uppdatera VILKEN KOLUMN
-- SOM HELST på valfri users-rad, inte bara account_type (Postgres
-- RLS kan inte begränsa till en enskild kolumn utan separata
-- kolumn-privilegier). Detta är dock i linje med adminpanelens
-- befintliga kapabiliteter (t.ex. att radera användare helt).
--
-- Run this in Supabase SQL Editor
-- ============================================================

drop policy if exists "Endast admin kan uppdatera alla svippare-ansökningar" on svippare_profiles;
create policy "Endast admin kan uppdatera alla svippare-ansökningar"
  on svippare_profiles
  for update
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

drop policy if exists "Endast admin kan uppdatera användare" on users;
create policy "Endast admin kan uppdatera användare"
  on users
  for update
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role = 'admin'
    )
  );
