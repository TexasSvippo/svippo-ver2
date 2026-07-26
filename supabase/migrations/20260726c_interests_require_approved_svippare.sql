-- ============================================================
-- Migration: require approved svippare status for interests INSERT
--
-- Skärper INSERT-policyn på interests: utöver att fortsätta blockera
-- account_type = 'bestellare', kräver den nu även att konton med
-- account_type = 'svippare' har en godkänd rad i svippare_profiles
-- (status = 'approved') innan de kan skicka en intresseanmälan.
-- Konton som ansökt men fortfarande väntar på godkännande
-- (status = 'pending') blockeras alltså också.
--
-- företag/uf-foretag kräver ingen motsvarande godkännandeprocess i
-- appen idag (samma mönster som canCreateService i useAuth.ts, samt
-- is_approved: accountType !== 'bestellare' vid registrering) och
-- fortsätter därför tillåtas direkt.
--
-- Run this in Supabase SQL Editor
-- ============================================================

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
      and (
        users.account_type is distinct from 'svippare'
        or exists (
          select 1 from svippare_profiles sp
          where sp.user_id = auth.uid()
          and sp.status = 'approved'
        )
      )
    )
  );
