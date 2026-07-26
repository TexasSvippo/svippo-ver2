-- ============================================================
-- Migration: enforce Row Level Security on interests table
-- Blockerar bestellare-konton från att skapa intresseanmälningar
-- på server-/databasnivå (idag är detta enbart skyddat i UI:t).
--
-- Policyerna för select/update speglar appens faktiska
-- åtkomstmönster idag, se:
--   src/app/request/[id]/RequestDetailClient.tsx (select + insert)
--   src/components/profile/Intresseanmalningar.tsx (select + update)
--   src/app/profile/ProfileClient.tsx (select)
--
-- Run this in Supabase SQL Editor
-- ============================================================

alter table interests enable row level security;

-- Förfrågningsägaren ser alla intresseanmälningar på sin förfrågan,
-- den som anmält intresse ser sin egen anmälan.
drop policy if exists "Läs egna eller mottagna intresseanmälningar" on interests;
create policy "Läs egna eller mottagna intresseanmälningar"
  on interests
  for select
  using (
    request_owner_id = auth.uid()
    or svippar_id = auth.uid()
  );

-- Endast utförare (svippare, företag, UF-företag) kan skapa
-- intresseanmälningar — bestellare-konton blockeras här även om
-- UI:t av någon anledning skulle släppa igenom en förfrågan.
drop policy if exists "Endast utförare kan skapa intresseanmälningar" on interests;
create policy "Endast utförare kan skapa intresseanmälningar"
  on interests
  for insert
  with check (
    svippar_id = auth.uid()
    and exists (
      select 1 from users
      where users.id = auth.uid()
      and users.account_type is distinct from 'bestellare'
    )
  );

-- Endast förfrågningsägaren kan uppdatera status (acceptera/neka)
-- på intresseanmälningar för sin egen förfrågan.
drop policy if exists "Ägaren kan uppdatera intresseanmälningar" on interests;
create policy "Ägaren kan uppdatera intresseanmälningar"
  on interests
  for update
  using (request_owner_id = auth.uid());
