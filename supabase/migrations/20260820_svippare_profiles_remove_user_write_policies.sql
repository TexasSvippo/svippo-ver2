-- ============================================================
-- Migration: remove user-level INSERT/UPDATE policies on svippare_profiles
--
-- All svippare application writes now go through
-- /api/become-svippare/submit (service role, after re-validating age
-- server-side from personal_number). The two pre-existing, untracked
-- policies below let an authenticated user write their own row directly
-- via the browser client, bypassing that route -- and therefore bypassing
-- the age check -- entirely. Confirmed empirically: a direct
-- .from('svippare_profiles').upsert(...) call using a regular user's own
-- session (no admin, no service role) succeeded and created a row with an
-- under-18 personal_number, with no error from RLS.
--
-- Dropping both closes that hole. Nothing else relies on them:
--   - admin/page.tsx's approve/reject flow updates via the admin's own
--     session, but that's governed by the separate "Endast admin kan
--     uppdatera alla svippare-ansökningar" policy (20260726e), not these
--     two -- untouched here.
--   - The submit route uses supabaseAdmin (service role), which bypasses
--     RLS entirely and is unaffected by dropping these.
--   - Read access (own row / approved-only / admin-all) is unrelated to
--     these two write policies and is also untouched.
--
-- Run this in Supabase SQL Editor
-- ============================================================

drop policy if exists "Användare kan skapa sin profil" on svippare_profiles;
drop policy if exists "Användare kan uppdatera sin profil" on svippare_profiles;
