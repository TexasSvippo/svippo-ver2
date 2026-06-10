import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendNyttMeddelande } from '@/lib/emails/nyttMeddelande'

const RATE_LIMIT_MS = 30 * 60 * 1000
const lastEmailSentAt = new Map<string, number>()

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params
    const { senderId, senderName, messagePreview } = await req.json()

    if (typeof senderId !== 'string' || typeof senderName !== 'string' || typeof messagePreview !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
    }

    const now = Date.now()
    const last = lastEmailSentAt.get(conversationId)
    if (last && now - last < RATE_LIMIT_MS) {
      return NextResponse.json({ success: true, skipped: 'rate_limited' })
    }

    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('participant_1_id, participant_2_id')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 })
    }

    const recipientId = conversation.participant_1_id === senderId
      ? conversation.participant_2_id
      : conversation.participant_1_id

    const { data: recipient } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', recipientId)
      .single()

    if (!recipient?.email) {
      return NextResponse.json({ success: false, error: 'Recipient email not found' }, { status: 404 })
    }

    const baseUrl = req.nextUrl.origin

    await sendNyttMeddelande({
      to: recipient.email,
      recipientName: recipient.name ?? 'där',
      senderName,
      messagePreview,
      conversationUrl: `${baseUrl}/messages/${conversationId}`,
    })

    lastEmailSentAt.set(conversationId, now)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Message notification email error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
