import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendNySvippareAnsokan } from '@/lib/emails/nySvippareAnsokan'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
    }

    const { data: applicant } = await supabaseAdmin
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single()

    if (!applicant?.email) {
      return NextResponse.json({ success: false, error: 'Applicant not found' }, { status: 404 })
    }

    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('role', 'admin')

    const adminEmails = (admins ?? []).map(a => a.email).filter(Boolean)

    if (adminEmails.length === 0) {
      return NextResponse.json({ success: false, error: 'No admin recipients found' }, { status: 404 })
    }

    await sendNySvippareAnsokan({
      to: adminEmails,
      applicantName: applicant.name ?? 'Okänd',
      applicantEmail: applicant.email,
      adminUrl: `${req.nextUrl.origin}/admin`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('New svippare application email error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
