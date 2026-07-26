import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof subject !== 'string' || !subject.trim() ||
      typeof message !== 'string' || !message.trim()
    ) {
      return NextResponse.json({ success: false, error: 'Alla fält måste fyllas i.' }, { status: 400 })
    }

    const html = `
      <div style="font-family: sans-serif; font-size: 15px; color: #05334A; line-height: 1.6;">
        <h2 style="margin: 0 0 16px;">Nytt meddelande från kontaktformuläret</h2>
        <p style="margin: 0 0 8px;"><strong>Namn:</strong> ${escapeHtml(name)}</p>
        <p style="margin: 0 0 8px;"><strong>E-post:</strong> ${escapeHtml(email)}</p>
        <p style="margin: 0 0 8px;"><strong>Ämne:</strong> ${escapeHtml(subject)}</p>
        <p style="margin: 16px 0 8px;"><strong>Meddelande:</strong></p>
        <p style="white-space: pre-wrap; margin: 0;">${escapeHtml(message)}</p>
      </div>
    `

    const result = await sendEmail({
      to: 'texas@svippo.se',
      subject: `[Svippo Kontakt] ${subject} — ${name}`,
      html,
    })

    if (!result) {
      return NextResponse.json({ success: false, error: 'Kunde inte skicka meddelandet.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Kontakt email error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
