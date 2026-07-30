-- ============================================================
-- Migration: admin bypass SELECT policy on orders
--
-- Adminpanelens "Beställningar"-flik (src/app/admin/page.tsx) hämtar alla
-- ordrar (senaste 10 + en count för statistikkortet), men RLS på orders
-- tillåter idag bara en användare att se sina EGNA ordrar (buyer_id/
-- seller_id = auth.uid()). Verifierat konkret: en riktig admin-session
-- fick count=0/rows=0 (error: null) trots att 17 riktiga ordrar finns
-- (ground truth via service-role) — samma tysta RLS-mönster som redan
-- åtgärdats för svippare_profiles/price_proposals/reports.
--
-- Denna policy LÄGGS TILL utöver befintliga SELECT-policyer (rör dem
-- inte) — Postgres OR:ar ihop flera SELECT-policyer, så befintligt
-- beteende (en användare ser sina egna ordrar) påverkas inte, admin ser
-- nu även allas.
--
-- Run this in Supabase SQL Editor
-- ============================================================

drop policy if exists "Endast admin kan se alla beställningar" on orders;
create policy "Endast admin kan se alla beställningar"
  on orders
  for select
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );
