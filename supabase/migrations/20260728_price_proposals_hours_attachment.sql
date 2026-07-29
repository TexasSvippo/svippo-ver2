-- ============================================================
-- Migration: add hours + attachment_url to price_proposals
--
-- Supports the new "Föreslå nytt pris" modal: timpris proposals need to
-- record the number of hours (amount is still the computed total, so
-- nothing that already reads `amount` needs to change), and all three
-- pricing modes can optionally attach a file (quote PDF, spec, etc).
--
-- Run this in Supabase SQL Editor
-- ============================================================

alter table price_proposals
  add column if not exists hours numeric,
  add column if not exists attachment_url text;
