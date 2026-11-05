import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireUser } from '@/lib/requireUser'

// The signed-in user's own private fields. These are read server-side
// (service role) so that anon/authenticated never need SELECT on
// users.email/phone/role -- see fetchMyProfile() in src/lib/myProfile.ts.
export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if ('response' in auth) return auth.response

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('email, phone, role, account_type')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (error) {
    console.error('[profile/me] lookup failed:', error.message)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}
