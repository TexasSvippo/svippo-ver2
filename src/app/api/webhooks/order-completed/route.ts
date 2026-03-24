import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    // Supabase webhooks skickar { type, table, record, old_record }
    const record = payload.record

    // Säkerhetskoll – bara Typ3 auto-bekräftelser
    if (
      record.service_type !== 'typ3' ||
      record.project_status !== 'completed' ||
      payload.old_record?.project_status === 'completed'
    ) {
      return NextResponse.json({ message: 'Ignorerad' }, { status: 200 })
    }

    // Skicka notis till köparen
    await supabase.from('notifications').insert({
      user_id: record.buyer_id,
      type: 'auto_confirmed',
      order_id: record.id,
      service_title: record.service_title,
      actor_name: 'Svippo',
      message: `Ditt uppdrag "${record.service_title}" har automatiskt bekräftats eftersom du inte svarade inom 24 timmar.`,
      action_url: `/min-bestallning/${record.id}`,
      read: false,
      dismissed: false,
      email_sent: false,
      created_at: new Date().toISOString(),
    })

    // Skicka notis till säljaren
    await supabase.from('notifications').insert({
      user_id: record.seller_id,
      type: 'auto_confirmed',
      order_id: record.id,
      service_title: record.service_title,
      actor_name: 'Svippo',
      message: `Uppdraget "${record.service_title}" har automatiskt bekräftats! Kom ihåg att ta betalt och lämna en recension.`,
      action_url: `/bestallning/${record.id}`,
      read: false,
      dismissed: false,
      email_sent: false,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ message: 'Notiser skickade' }, { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internt fel' }, { status: 500 })
  }
}
