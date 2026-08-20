import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { completeRegistration } from '@/lib/completeRegistration'

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

    const result = await completeRegistration({
      userId,
      email,
      accountType,
      name,
      city: typeof city === 'string' ? city : null,
      orgNumber: typeof orgNumber === 'string' ? orgNumber : null,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Register complete error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
