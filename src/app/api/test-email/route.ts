import { NextResponse } from 'next/server'
import { sendSvippareGodkand } from '@/lib/emails/svippareGodkand'
import { sendSvippareNekad } from '@/lib/emails/svippareNekad'

export async function GET() {
  const to = 'texas@gtkonsult.se'

  const results = await Promise.all([
    sendSvippareGodkand({ to, applicantName: 'Texas' }),
    sendSvippareNekad({ to, applicantName: 'Texas' }),
  ])

  return NextResponse.json({ success: true, results })
}
