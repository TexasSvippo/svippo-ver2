-- ============================================================
-- Migration: require approved svippare status on category_subscriptions
--
-- The previous fix (20260731_category_subscriptions_restrict_bestellare)
-- correctly blocked bestellare accounts, but only checked account_type —
-- a svippare account whose application hasn't been approved yet (or was
-- rejected) could still insert a subscription. Verified concretely: a
-- disposable test account with account_type='svippare' and
-- svippare_profiles.status='pending' passed both the UI gate and a
-- direct insert.
--
-- Same drop-all-INSERT-policies-then-recreate approach as last time
-- (narrowing access, not widening it — a second additive policy would
-- have left the existing one active alongside it via OR). foretag/
-- uf-foretag accounts are unaffected (they have no svippare_profiles
-- approval flow).
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

create policy "Endast godkända svippare eller företag kan bevaka kategorier"
  on category_subscriptions
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from users
      where users.id = auth.uid()
      and (
        users.account_type in ('foretag', 'uf-foretag')
        or (
          users.account_type = 'svippare'
          and exists (
            select 1 from svippare_profiles
            where svippare_profiles.user_id = auth.uid()
            and svippare_profiles.status = 'approved'
          )
        )
      )
    )
  );
