import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireUser, isAdmin, forbidden } from '@/lib/requireUser'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_IDS = 100

// Admin only. Used by admin/page.tsx for the user list and to look up
// reporters/applicants, so the browser never reads users.email/role directly.
//   GET /api/admin/users            → the 20 most recent users
//   GET /api/admin/users?ids=a,b,c  → those users (max 100 valid UUIDs)
export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if ('response' in auth) return auth.response
  if (!(await isAdmin(auth.user.id))) return forbidden()

  const idsParam = req.nextUrl.searchParams.get('ids')
  const ids = (idsParam ?? '').split(',').map(s => s.trim()).filter(id => UUID.test(id)).slice(0, MAX_IDS)

  let query = supabaseAdmin.from('users').select('id, name, email, account_type, role, created_at')
  if (idsParam !== null) {
    if (ids.length === 0) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })
    query = query.in('id', ids)
  } else {
    query = query.order('created_at', { ascending: false }).limit(20)
  }

  const { data, error } = await query
  if (error) {
    console.error('[admin/users] lookup failed:', error.message)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'no-store' } })
}
