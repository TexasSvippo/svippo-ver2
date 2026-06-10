import { sendEmail } from '@/lib/email'

type SendSvippareNekadParams = {
  to: string
  applicantName: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendSvippareNekad({
  to,
  applicantName,
}: SendSvippareNekadParams) {
  const html = `
<!DOCTYPE html>
<html lang="sv">
  <body style="margin:0;padding:0;background-color:#F8F4EF;font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F4EF;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#066696;padding:32px 24px;text-align:center;">
                <img src="https://svippo-ver2.vercel.app/images/Svippo-vit.svg" alt="Svippo" width="130" style="display:block;margin:0 auto;">
              </td>
            </tr>
            <tr>
              <td style="padding:32px 24px;">
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1a1a1a;">Angående din ansökan som Svippare</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444444;">Hej ${escapeHtml(applicantName)}! Tack för att du ansökte om att bli Svippare. Tyvärr kan vi inte godkänna din ansökan just nu.</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F4EF;border-radius:8px;margin:0 0 24px;">
                  <tr>
                    <td style="padding:12px 18px;font-size:14px;color:#888888;">Status</td>
                    <td style="padding:12px 18px;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right;">Ej godkänd</td>
                  </tr>
                </table>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td style="border-radius:8px;background-color:#066696;">
                      <a href="https://svippo-ver2.vercel.app/kontakt" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Kontakta oss</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#888888;text-align:center;">Du är välkommen att söka igen i framtiden. Tack för ditt intresse för Svippo!</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;text-align:center;background-color:#F8F4EF;">
                <p style="margin:0;font-size:12px;color:#999999;">© 2026 Svippo</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return sendEmail({
    to,
    subject: 'Angående din ansökan som Svippare',
    html,
  })
}
