-- ============================================================
-- Migration: restrict category_subscriptions INSERT to svippare/foretag/uf-foretag
--
-- "Bevaka förfrågningar" är en funktion för utförare att hitta jobb, inte
-- för beställare. Idag finns ingen kontotyps-kontroll alls på INSERT —
-- verifierat konkret: en riktig bestellare-session kunde infoga en rad
-- utan fel.
--
-- Till skillnad från tidigare RLS-fixar i det här projektet (som LADE TILL
-- en bypass-policy för att BREDDA åtkomst) är målet här att BEGRÄNSA. Att
-- bara lägga till en ny restriktiv policy hade inte hjälpt — Postgres
-- OR:ar ihop flera INSERT-policyer, så den befintliga (för tillåtande)
-- policyn hade fortfarande gällt vid sidan om. Den befintliga INSERT-
-- policyns exakta namn är okänt (ingen SQL-introspektion tillgänglig här),
-- så nedanstående droppar ALLA befintliga INSERT-policyer på tabellen
-- dynamiskt innan den nya, korrekt begränsade policyn skapas.
--
-- SELECT/DELETE rörs inte — en bestellare med en gammal bevakning från
-- innan fixen kan fortfarande se/ta bort sin egen rad, bara inte skapa
-- nya.
--
-- Run this in Supabase SQL Editor
-- ============================================================

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'category_subscriptions' and cmd = 'INSERT'
  loop
    execute format('drop policy %I on public.category_subscriptions', pol.policyname);
  end loop;
end $$;

create policy "Endast svippare/företag kan bevaka kategorier"
  on category_subscriptions
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from users
      where users.id = auth.uid()
      and users.account_type in ('svippare', 'foretag', 'uf-foretag')
    )
  );
