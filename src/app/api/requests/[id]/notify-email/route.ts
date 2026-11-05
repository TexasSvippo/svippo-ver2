import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireUser, forbidden } from '@/lib/requireUser'
import { sendNyIntresseanmalan } from '@/lib/emails/nyIntresseanmalan'

// Only a caller who has registered interest in this request may notify its
// owner. The interested party's name comes from users, not from the request body.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(req)
    if ('response' in auth) return auth.response
    const { user } = auth

    const { id } = await params

    const { data: request } = await supabaseAdmin
      .from('requests')
      .select('id, title, user_id')
      .eq('id', id)
      .maybeSingle()

    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
    }

    const { data: interest } = await supabaseAdmin
      .from('interests')
      .select('id')
      .eq('request_id', id)
      .eq('svippar_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!interest) return forbidden()

    const { data: svippare } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()

    const { data: buyer } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', request.user_id)
      .maybeSingle()

    if (!buyer?.email) {
      return NextResponse.json({ success: false, error: 'Buyer email not found' }, { status: 404 })
    }

    const baseUrl = req.nextUrl.origin

    await sendNyIntresseanmalan({
      to: buyer.email,
      buyerName: buyer.name ?? 'där',
      svippareName: svippare?.name || 'En utförare',
      requestTitle: request.title,
      requestUrl: `${baseUrl}/request/${request.id}`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Request notification email error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
