import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireUser, forbidden } from '@/lib/requireUser'
import { sendIntresseGodkant } from '@/lib/emails/intresseGodkant'
import { sendIntresseNekat } from '@/lib/emails/intresseNekat'

// Only the owner of the request may notify an interested svippare.
// Everything in the email comes from the database: the title from requests
// (not interests.request_title, which the svippare wrote client-side), the
// recipient from interests.svippar_id.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req)
    if ('response' in auth) return auth.response
    const { user } = auth

    const { type, interestId, orderId } = await req.json()

    if ((type !== 'accepted' && type !== 'rejected') || typeof interestId !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
    }

    const { data: interest } = await supabaseAdmin
      .from('interests')
      .select('id, request_id, svippar_id, request_owner_id, status')
      .eq('id', interestId)
      .maybeSingle()

    if (!interest || interest.request_owner_id !== user.id) return forbidden()

    const { data: request } = await supabaseAdmin
      .from('requests')
      .select('title')
      .eq('id', interest.request_id)
      .maybeSingle()

    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
    }

    const { data: svippare } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', interest.svippar_id)
      .maybeSingle()

    if (!svippare?.email) {
      return NextResponse.json({ success: false, error: 'Svippare email not found' }, { status: 404 })
    }

    const baseUrl = req.nextUrl.origin

    if (type === 'accepted') {
      if (typeof orderId !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 })
      }

      // interests.status is never set to 'accepted' -- acceptance is proven by
      // the order the owner created for this svippare.
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, buyer_id, seller_id, buyer_name')
        .eq('id', orderId)
        .maybeSingle()

      if (!order || order.buyer_id !== user.id || order.seller_id !== interest.svippar_id) return forbidden()

      await sendIntresseGodkant({
        to: svippare.email,
        svippareName: svippare.name ?? 'där',
        buyerName: order.buyer_name,
        requestTitle: request.title,
        orderUrl: `${baseUrl}/order/${order.id}`,
      })
    } else {
      if (interest.status !== 'rejected') {
        return NextResponse.json({ success: false, error: 'Interest is not rejected' }, { status: 409 })
      }

      await sendIntresseNekat({
        to: svippare.email,
        svippareName: svippare.name ?? 'där',
        requestTitle: request.title,
        requestsUrl: `${baseUrl}/requests`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Interest notification email error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
