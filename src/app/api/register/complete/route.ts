import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const { data: { user: authUser } } = await supabaseAdmin.auth.getUser(token ?? '')
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, email, accountType, name, city, orgNumber } = await req.json()

    if (
      typeof userId !== 'string' ||
      typeof email !== 'string' ||
      typeof accountType !== 'string' ||
      typeof name !== 'string'
    ) {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
    }

    // A caller may only complete registration for their own account -- the
    // access token proves who they are, so userId must match it exactly.
    // Without this, anyone could insert/hijack a users row for any UUID.
    if (userId !== authUser.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const isApproved = accountType !== 'bestellare'

    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: userId,
      name,
      email,
      city: typeof city === 'string' ? city : null,
      account_type: accountType,
      is_approved: isApproved,
      created_at: new Date().toISOString(),
    })

    // 23505 = unique_violation on users_pkey -- the row already exists.
    // Harmless: useAuth's self-heal can fire from more than one mounted
    // instance (e.g. Navbar and a page both call useAuth()) for the same
    // freshly-confirmed session, so a second, redundant completion attempt
    // is expected and should be treated as success, not an error.
    if (userError && userError.code !== '23505') {
      return NextResponse.json({ success: false, error: userError.message }, { status: 500 })
    }

    if (accountType === 'foretag' || accountType === 'uf-foretag') {
      await supabaseAdmin.from('company_profiles').insert({
        user_id: userId,
        org_number: accountType === 'foretag' && typeof orgNumber === 'string' ? orgNumber : null,
        city: typeof city === 'string' ? city : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Register complete error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
