-- ============================================================
-- Migration: drop old permissive INSERT policy on interests
--
-- Den gamla policyn "Inloggad kan visa intresse" (INSERT,
-- with_check: auth.uid() = svippar_id, ingen account_type-kontroll)
-- OR:as ihop med den nya restriktiva policyn från
-- 20260726_interests_rls_block_bestellare.sql — eftersom Postgres
-- OR:ar flera policyer för samma kommando räcker det att EN av dem
-- tillåter inserten, vilket gjorde den nya spärren verkningslös.
--
-- Run this in Supabase SQL Editor
-- ============================================================

drop policy if exists "Inloggad kan visa intresse" on interests;
