import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireUser, isAdmin, forbidden } from '@/lib/requireUser'
import { sendSvippareGodkand } from '@/lib/emails/svippareGodkand'
import { sendSvippareNekad } from '@/lib/emails/svippareNekad'

// Admin only. The decision (status + rejection reason) is read from
// svippare_profiles, which admin/page.tsx updates before calling this route.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req)
    if ('response' in auth) return auth.response
    if (!(await isAdmin(auth.user.id))) return forbidden()

    const { type, userId } = await req.json()

    if ((type !== 'approved' && type !== 'rejected') || typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
    }

    const { data: application } = await supabaseAdmin
      .from('svippare_profiles')
      .select('status, rejection_reason')
      .eq('user_id', userId)
      .maybeSingle()

    if (!application || application.status !== type) {
      return NextResponse.json({ success: false, error: 'Application status does not match' }, { status: 409 })
    }

    const { data: applicant } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .maybeSingle()

    if (!applicant?.email) {
      return NextResponse.json({ success: false, error: 'Applicant email not found' }, { status: 404 })
    }

    if (type === 'approved') {
      await sendSvippareGodkand({
        to: applicant.email,
        applicantName: applicant.name ?? 'där',
      })
    } else {
      const reason = typeof application.rejection_reason === 'string' ? application.rejection_reason.trim() : ''
      await sendSvippareNekad({
        to: applicant.email,
        applicantName: applicant.name ?? 'där',
        reason: reason || undefined,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin notification email error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
