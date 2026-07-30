-- ============================================================
-- Migration: add requires_scheduling to services
--
-- Lets a seller mark a typ1 (date/place) service as not needing a
-- date/time/address up front at order time -- buyer and seller can agree
-- on scheduling in conversation afterward instead, same as the
-- request/interest flow already does (which never asks for a fixed date).
--
-- Default true so every existing service keeps today's behavior
-- unchanged (OrderModal's "Datum & plats" step still shows by default).
--
-- Run this in Supabase SQL Editor
-- ============================================================

alter table public.services
  add column if not exists requires_scheduling boolean not null default true;
