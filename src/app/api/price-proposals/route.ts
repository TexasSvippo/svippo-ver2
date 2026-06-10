import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendPrisforlagMottaget } from '@/lib/emails/prisforlagMottaget'

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token ?? '')
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: { order_id?: unknown; amount?: unknown; note?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { order_id, amount, note } = body

  if (typeof order_id !== 'string' || !order_id) {
    return NextResponse.json({ error: 'order_id is required' }, { status: 400 })
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
  }

  // ── Load order ──────────────────────────────────────────────────────────
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, seller_id, seller_name, buyer_id, status, conversation_id')
    .eq('id', order_id)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Only the seller may send a proposal
  if (order.seller_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Proposals are not allowed on cancelled or rejected orders
  if (order.status === 'rejected' || order.status === 'cancelled') {
    return NextResponse.json({ error: 'Order is not active' }, { status: 422 })
  }

  // ── Insert price_proposals row ──────────────────────────────────────────
  const { data: proposal, error: proposalError } = await supabaseAdmin
    .from('price_proposals')
    .insert({
      order_id,
      proposed_by: user.id,
      amount,
      currency: 'SEK',
      note: note && typeof note === 'string' ? note : null,
      status: 'pending',
    })
    .select()
    .single()

  if (proposalError || !proposal) {
    console.error('[price-proposals] insert failed:', proposalError?.message)
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 })
  }

  // ── Update orders.price_status ──────────────────────────────────────────
  await supabaseAdmin
    .from('orders')
    .update({ price_status: 'proposal_pending' })
    .eq('id', order_id)

  // ── System message in conversation ──────────────────────────────────────
  if (order.conversation_id) {
    const content = `${order.seller_name} har skickat ett nytt prisförslag: ${amount} kr`
    await supabaseAdmin.from('messages').insert({
      conversation_id: order.conversation_id,
      sender_id: null,
      type: 'system',
      content,
      read_by: [],
    })
    await supabaseAdmin
      .from('conversations')
      .update({ last_message_at: new Date().toISOString(), last_message_preview: content })
      .eq('id', order.conversation_id)
  }

  // ── Notification for buyer ───────────────────────────────────────────────
  await supabaseAdmin.from('notifications').insert({
    user_id: order.buyer_id,
    type: 'price_proposal',
    order_id,
    actor_name: order.seller_name,
    message: `Du har fått ett prisförslag på ${amount} kr`,
    action_url: `/my-order/${order_id}`,
    read: false,
    dismissed: false,
    email_sent: false,
    created_at: new Date().toISOString(),
  })

  // ── Email notification for buyer ─────────────────────────────────────────
  const { data: buyer } = await supabaseAdmin
    .from('users')
    .select('email, name')
    .eq('id', order.buyer_id)
    .single()

  if (buyer?.email) {
    const baseUrl = req.nextUrl.origin
    sendPrisforlagMottaget({
      to: buyer.email,
      buyerName: buyer.name ?? 'där',
      sellerName: order.seller_name,
      amount,
      note: proposal.note,
      orderUrl: `${baseUrl}/my-order/${order_id}`,
    }).catch(err => console.error('Email notification error:', err))
  }

  return NextResponse.json(proposal, { status: 201 })
}
