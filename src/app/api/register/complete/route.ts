import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const { userId, email, accountType, name, city, orgNumber } = await req.json()

    if (
      typeof userId !== 'string' ||
      typeof email !== 'string' ||
      typeof accountType !== 'string' ||
      typeof name !== 'string'
    ) {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
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

    if (userError) {
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
