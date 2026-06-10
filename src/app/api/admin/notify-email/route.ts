import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendSvippareGodkand } from '@/lib/emails/svippareGodkand'
import { sendSvippareNekad } from '@/lib/emails/svippareNekad'

export async function POST(req: NextRequest) {
  try {
    const { type, userId } = await req.json()

    if (typeof type !== 'string' || typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
    }

    const { data: applicant } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (!applicant?.email) {
      return NextResponse.json({ success: false, error: 'Applicant email not found' }, { status: 404 })
    }

    if (type === 'approved') {
      await sendSvippareGodkand({
        to: applicant.email,
        applicantName: applicant.name ?? 'där',
      })
    } else if (type === 'rejected') {
      await sendSvippareNekad({
        to: applicant.email,
        applicantName: applicant.name ?? 'där',
      })
    } else {
      return NextResponse.json({ success: false, error: 'Unknown type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin notification email error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
