import { sendEmail } from '@/lib/email'

type SendNyBestallningParams = {
  to: string
  sellerName: string
  serviceTitle: string
  buyerName: string
  price: string
  orderDate: string
  buyerMessage?: string
  orderUrl: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendNyBestallning({
  to,
  sellerName,
  serviceTitle,
  buyerName,
  price,
  orderDate,
  buyerMessage,
  orderUrl,
}: SendNyBestallningParams) {
  const messageBox = buyerMessage
    ? `
              <div style="border-left:3px solid #e8541a;background-color:#fff8f6;border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 24px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#e8541a;text-transform:uppercase;letter-spacing:0.04em;">Meddelande från beställaren</p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#444444;">${escapeHtml(buyerMessage)}</p>
              </div>`
    : ''

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
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1a1a1a;">Du har fått en ny beställning! 🎉</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444444;">Hej ${escapeHtml(sellerName)}! Någon vill anlita dig. Kolla in detaljerna nedan och godkänn beställningen så snart du kan.</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F4EF;border-radius:8px;margin:0 0 24px;">
                  <tr>
                    <td style="padding:12px 18px;font-size:14px;color:#666666;">Tjänst</td>
                    <td style="padding:12px 18px;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right;">${escapeHtml(serviceTitle)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 18px;font-size:14px;color:#666666;border-top:1px solid #ffffff;">Beställare</td>
                    <td style="padding:12px 18px;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right;border-top:1px solid #ffffff;">${escapeHtml(buyerName)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 18px;font-size:14px;color:#666666;border-top:1px solid #ffffff;">Pris</td>
                    <td style="padding:12px 18px;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right;border-top:1px solid #ffffff;">${escapeHtml(price)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 18px;font-size:14px;color:#666666;border-top:1px solid #ffffff;">Beställd</td>
                    <td style="padding:12px 18px;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right;border-top:1px solid #ffffff;">${escapeHtml(orderDate)}</td>
                  </tr>
                </table>
${messageBox}
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td style="border-radius:8px;background-color:#066696;">
                      <a href="${escapeHtml(orderUrl)}" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Se beställning</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#888888;text-align:center;">Du har 48 timmar på dig att godkänna eller neka beställningen.</p>
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
    subject: 'Du har fått en ny beställning! 🎉',
    html,
  })
}
