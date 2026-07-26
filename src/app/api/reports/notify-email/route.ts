import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendNyRapport } from '@/lib/emails/nyRapport'

export async function POST(req: NextRequest) {
  try {
    const { reportId, targetType, targetId, reason } = await req.json()

    if (
      typeof reportId !== 'string' ||
      (targetType !== 'service' && targetType !== 'request') ||
      typeof targetId !== 'string' ||
      typeof reason !== 'string'
    ) {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
    }

    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('role', 'admin')

    const adminEmails = (admins ?? []).map(a => a.email).filter(Boolean)

    if (adminEmails.length === 0) {
      return NextResponse.json({ success: false, error: 'No admin recipients found' }, { status: 404 })
    }

    const targetUrl = targetType === 'service'
      ? `${req.nextUrl.origin}/service/${targetId}`
      : `${req.nextUrl.origin}/request/${targetId}`

    await sendNyRapport({
      to: adminEmails,
      targetType,
      targetUrl,
      reason,
      adminUrl: `${req.nextUrl.origin}/admin`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Report notification email error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
