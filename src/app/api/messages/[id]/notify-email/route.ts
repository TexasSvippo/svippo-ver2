import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireUser, forbidden } from '@/lib/requireUser'
import { sendNyttMeddelande } from '@/lib/emails/nyttMeddelande'

// NOTE: in-memory, so only per serverless instance -- not a real rate limit.
// Kept as-is for now; a database-backed limit is a separate change.
const RATE_LIMIT_MS = 30 * 60 * 1000
const lastEmailSentAt = new Map<string, number>()

// Only a participant of the conversation may trigger this, and the sender is
// always the caller. Sender name and message text come from the database
// (users.name and the caller's latest message), not from the request body.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(req)
    if ('response' in auth) return auth.response
    const { user } = auth

    const { id: conversationId } = await params

    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('participant_1_id, participant_2_id')
      .eq('id', conversationId)
      .maybeSingle()

    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 })
    }
    if (conversation.participant_1_id !== user.id && conversation.participant_2_id !== user.id) {
      return forbidden()
    }

    const now = Date.now()
    const last = lastEmailSentAt.get(conversationId)
    if (last && now - last < RATE_LIMIT_MS) {
      return NextResponse.json({ success: true, skipped: 'rate_limited' })
    }

    const recipientId = conversation.participant_1_id === user.id
      ? conversation.participant_2_id
      : conversation.participant_1_id

    const { data: lastMessage } = await supabaseAdmin
      .from('messages')
      .select('content')
      .eq('conversation_id', conversationId)
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!lastMessage?.content) {
      return NextResponse.json({ success: false, error: 'No message to notify about' }, { status: 404 })
    }

    const { data: sender } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()

    const { data: recipient } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', recipientId)
      .maybeSingle()

    if (!recipient?.email) {
      return NextResponse.json({ success: false, error: 'Recipient email not found' }, { status: 404 })
    }

    const baseUrl = req.nextUrl.origin

    await sendNyttMeddelande({
      to: recipient.email,
      recipientName: recipient.name ?? 'där',
      senderName: sender?.name || 'En användare',
      messagePreview: lastMessage.content,
      conversationUrl: `${baseUrl}/messages/${conversationId}`,
    })

    lastEmailSentAt.set(conversationId, now)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Message notification email error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
