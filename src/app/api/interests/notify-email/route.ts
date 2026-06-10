import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendIntresseGodkant } from '@/lib/emails/intresseGodkant'
import { sendIntresseNekat } from '@/lib/emails/intresseNekat'

export async function POST(req: NextRequest) {
  try {
    const { type, svippareId, requestTitle, orderId } = await req.json()

    if (typeof type !== 'string' || typeof svippareId !== 'string' || typeof requestTitle !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
    }

    const { data: svippare } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', svippareId)
      .single()

    if (!svippare?.email) {
      return NextResponse.json({ success: false, error: 'Svippare email not found' }, { status: 404 })
    }

    const baseUrl = req.nextUrl.origin

    if (type === 'accepted') {
      if (typeof orderId !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 })
      }

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('buyer_name')
        .eq('id', orderId)
        .single()

      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
      }

      await sendIntresseGodkant({
        to: svippare.email,
        svippareName: svippare.name ?? 'där',
        buyerName: order.buyer_name,
        requestTitle,
        orderUrl: `${baseUrl}/order/${orderId}`,
      })
    } else if (type === 'rejected') {
      await sendIntresseNekat({
        to: svippare.email,
        svippareName: svippare.name ?? 'där',
        requestTitle,
        requestsUrl: `${baseUrl}/requests`,
      })
    } else {
      return NextResponse.json({ success: false, error: 'Unknown type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Interest notification email error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
