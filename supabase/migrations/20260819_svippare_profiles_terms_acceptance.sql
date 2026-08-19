-- ============================================================
-- Migration: add terms acceptance tracking to svippare_profiles
--
-- Applicants must now accept "Villkor för utförare" (svippo.se/villkor/utforare)
-- when applying to become a svippare (become-svippare/page.tsx, step 4).
-- terms_version is stored alongside so a future revision of the document
-- can require re-acceptance without losing the record of what an existing
-- svippare originally agreed to.
--
-- Default false / null so existing rows (applied before this requirement
-- existed) are correctly reflected as not having accepted this specific
-- document, rather than silently backfilled as if they had.
--
-- Run this in Supabase SQL Editor
-- ============================================================

alter table public.svippare_profiles
  add column if not exists terms_accepted boolean not null default false,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;
