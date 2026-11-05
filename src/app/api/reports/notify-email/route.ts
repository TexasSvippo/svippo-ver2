import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireUser, forbidden } from '@/lib/requireUser'
import { sendNyRapport } from '@/lib/emails/nyRapport'

// Reports can be filed anonymously (RLS: "Vem som helst kan skapa en rapport"),
// so this route does not require login. Instead:
// - everything in the email is read from the reports row, not the body;
// - if the report has a reporter_id, the caller must be that user (Bearer);
// - the send is claimed atomically via reports.notified_at, so each report
//   triggers at most one admin email.
export async function POST(req: NextRequest) {
  try {
    const { reportId } = await req.json()

    if (typeof reportId !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
    }

    const { data: report } = await supabaseAdmin
      .from('reports')
      .select('id, reporter_id, target_type, target_id, reason, notified_at')
      .eq('id', reportId)
      .maybeSingle()

    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
    }

    if (report.reporter_id) {
      const auth = await requireUser(req)
      if ('response' in auth) return auth.response
      if (auth.user.id !== report.reporter_id) return forbidden()
    }

    if (report.target_type !== 'service' && report.target_type !== 'request') {
      return NextResponse.json({ success: false, error: 'Unknown target type' }, { status: 400 })
    }

    const { data: claimed, error: claimError } = await supabaseAdmin
      .from('reports')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', report.id)
      .is('notified_at', null)
      .select('id')
      .maybeSingle()

    if (claimError) {
      console.error('[reports/notify-email] claim failed:', claimError.message)
      return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
    }
    if (!claimed) {
      return NextResponse.json({ success: true, skipped: 'already_sent' })
    }

    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('role', 'admin')

    const adminEmails = (admins ?? []).map(a => a.email).filter(Boolean)

    if (adminEmails.length === 0) {
      return NextResponse.json({ success: false, error: 'No admin recipients found' }, { status: 404 })
    }

    const targetUrl = report.target_type === 'service'
      ? `${req.nextUrl.origin}/service/${report.target_id}`
      : `${req.nextUrl.origin}/request/${report.target_id}`

    await sendNyRapport({
      to: adminEmails,
      targetType: report.target_type,
      targetUrl,
      reason: report.reason,
      adminUrl: `${req.nextUrl.origin}/admin`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Report notification email error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
