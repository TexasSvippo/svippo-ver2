import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Simple version: deletes the users row (same scope as admin/page.tsx's
// handleDeleteUser) plus the actual Supabase Auth account -- the one step
// that tool always required doing manually in the Supabase Dashboard.
// Deliberately does NOT touch related data in other tables (services,
// orders, messages, reviews, svippare_profiles, notifications) -- that's
// the next, bigger version of this feature, not this one. Anything wired
// up with an ON DELETE CASCADE foreign key will still disappear on its
// own; anything without one is left behind as-is, same as today's admin
// tool.
export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token ?? '')
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Delete the profile row ─────────────────────────────────────────────
  const { error: profileError } = await supabaseAdmin.from('users').delete().eq('id', user.id)
  if (profileError) {
    console.error('[profile/delete-account] users row delete failed:', profileError.message)
    return NextResponse.json({ error: 'Något gick fel när kontot skulle raderas. Försök igen om en stund.' }, { status: 500 })
  }

  // ── Delete the actual auth account ─────────────────────────────────────
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (authError) {
    console.error('[profile/delete-account] auth account delete failed:', authError.message)
    return NextResponse.json({
      error: 'Din profil togs bort, men något gick fel när inloggningskontot skulle raderas. Kontakta kontakt@svippo.se.',
    }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
