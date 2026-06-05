import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // ── Auth ────────────────────────────────────────────────────────────────
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: { action?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action } = body
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  // ── Load proposal + linked order ────────────────────────────────────────
  const { data: proposal, error: proposalError } = await supabaseAdmin
    .from('price_proposals')
    .select('id, order_id, amount, status')
    .eq('id', id)
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
  }
  if (proposal.status !== 'pending') {
    return NextResponse.json({ error: 'Proposal is no longer pending' }, { status: 422 })
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, buyer_id, buyer_name, seller_id, conversation_id')
    .eq('id', proposal.order_id)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Only the buyer may respond
  if (order.buyer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Handle approve ──────────────────────────────────────────────────────
  if (action === 'approve') {
    // The RPC uses auth.uid() internally, so it must be called with the
    // user's JWT (cookie client), not the service role client.
    const { error: rpcError } = await supabase.rpc('approve_price_proposal', {
      proposal_id: id,
    })
    if (rpcError) {
      console.error('[price-proposals/approve] rpc failed:', rpcError.message)
      return NextResponse.json({ error: rpcError.message }, { status: 500 })
    }

    const content = `${order.buyer_name} har godkänt prisförslaget: ${proposal.amount} kr`

    if (order.conversation_id) {
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

    await supabaseAdmin.from('notifications').insert({
      user_id: order.seller_id,
      type: 'price_approved',
      order_id: proposal.order_id,
      actor_name: order.buyer_name,
      message: `Ditt prisförslag på ${proposal.amount} kr godkändes`,
      action_url: `/order/${proposal.order_id}`,
      read: false,
      dismissed: false,
      email_sent: false,
      created_at: new Date().toISOString(),
    })
  }

  // ── Handle reject ───────────────────────────────────────────────────────
  if (action === 'reject') {
    await supabaseAdmin
      .from('price_proposals')
      .update({
        status: 'rejected',
        responded_by: user.id,
        responded_at: new Date().toISOString(),
      })
      .eq('id', id)

    await supabaseAdmin
      .from('orders')
      .update({ price_status: 'price_rejected' })
      .eq('id', proposal.order_id)

    const content = `${order.buyer_name} avböjde prisförslaget på ${proposal.amount} kr`

    if (order.conversation_id) {
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

    await supabaseAdmin.from('notifications').insert({
      user_id: order.seller_id,
      type: 'price_rejected',
      order_id: proposal.order_id,
      actor_name: order.buyer_name,
      message: `Ditt prisförslag på ${proposal.amount} kr avböjdes`,
      action_url: `/order/${proposal.order_id}`,
      read: false,
      dismissed: false,
      email_sent: false,
      created_at: new Date().toISOString(),
    })
  }

  // ── Return updated proposal ─────────────────────────────────────────────
  const { data: updated } = await supabaseAdmin
    .from('price_proposals')
    .select('*')
    .eq('id', id)
    .single()

  return NextResponse.json(updated)
}
