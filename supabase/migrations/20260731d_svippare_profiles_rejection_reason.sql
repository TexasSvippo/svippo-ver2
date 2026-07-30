-- ============================================================
-- Migration: add rejection_reason to svippare_profiles
--
-- Lets an admin write a short explanation when rejecting a svippare
-- application (admin/page.tsx handleReject), shown to the applicant in
-- their rejection notification/email instead of a generic message.
--
-- Run this in Supabase SQL Editor
-- ============================================================

alter table public.svippare_profiles
  add column if not exists rejection_reason text;
