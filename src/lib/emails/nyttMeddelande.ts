import { sendEmail } from '@/lib/email'

type SendNyttMeddelandeParams = {
  to: string
  recipientName: string
  senderName: string
  messagePreview: string
  conversationUrl: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendNyttMeddelande({
  to,
  recipientName,
  senderName,
  messagePreview,
  conversationUrl,
}: SendNyttMeddelandeParams) {
  const truncated = messagePreview.length > 200 ? `${messagePreview.slice(0, 200)}...` : messagePreview

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
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1a1a1a;">Du har ett nytt meddelande 💬</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444444;">Hej ${escapeHtml(recipientName)}! ${escapeHtml(senderName)} har skickat dig ett meddelande.</p>

                <div style="border-left:3px solid #066696;background-color:#f0f7fc;border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 24px;">
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#444444;">${escapeHtml(truncated)}</p>
                </div>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td style="border-radius:8px;background-color:#066696;">
                      <a href="${escapeHtml(conversationUrl)}" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Svara nu</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#888888;text-align:center;">Du får det här mailet eftersom du har en aktiv konversation på Svippo. Vi skickar max ett mail per konversation var 30:e minut.</p>
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
    subject: 'Du har ett nytt meddelande 💬',
    html,
  })
}
