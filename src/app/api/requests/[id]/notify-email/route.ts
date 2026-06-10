import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendNyIntresseanmalan } from '@/lib/emails/nyIntresseanmalan'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { svippareName } = await req.json()

    if (typeof svippareName !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
    }

    const { data: request } = await supabaseAdmin
      .from('requests')
      .select('id, title, user_id')
      .eq('id', id)
      .single()

    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
    }

    const { data: buyer } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', request.user_id)
      .single()

    if (!buyer?.email) {
      return NextResponse.json({ success: false, error: 'Buyer email not found' }, { status: 404 })
    }

    const baseUrl = req.nextUrl.origin

    await sendNyIntresseanmalan({
      to: buyer.email,
      buyerName: buyer.name ?? 'där',
      svippareName,
      requestTitle: request.title,
      requestUrl: `${baseUrl}/request/${request.id}`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Request notification email error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
