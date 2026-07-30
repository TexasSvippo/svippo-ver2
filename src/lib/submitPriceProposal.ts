import { supabase } from '@/lib/supabase'

type SubmitPriceProposalParams = {
  orderId: string
  amount: number
  note?: string
  hours?: number
  file?: File | null
}

// Supabase Storage keys only accept ASCII (confirmed: Å/Ä/Ö, other accented
// letters, and non-ASCII symbols all throw "Invalid key"). Decompose
// accented characters (å→a, ä→a, ö→o, é→e, ü→u, ...) via NFD normalization
// and strip the diacritic marks, then replace anything still non-ASCII
// with "_". The extension is kept untouched.
function sanitizeFilename(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  const base = lastDot > 0 ? filename.slice(0, lastDot) : filename
  const ext = lastDot > 0 ? filename.slice(lastDot) : ''

  // Combining Diacritical Marks block (U+0300-U+036F) — built from char
  // codes rather than literal characters to avoid source-encoding ambiguity.
  const combiningDiacriticalMarks = new RegExp(
    `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
    'g'
  )
  const sanitizedBase = base
    .normalize('NFD')
    .replace(combiningDiacriticalMarks, '')
    .replace(/[^\x00-\x7F]/g, '_')

  return `${sanitizedBase}${ext}`
}

export async function submitPriceProposal({ orderId, amount, note, hours, file }: SubmitPriceProposalParams) {
  let attachmentUrl: string | undefined

  if (file) {
    const path = `${orderId}/${Date.now()}-${sanitizeFilename(file.name)}`
    const { error: uploadError } = await supabase.storage
      .from('price-proposal-attachments')
      .upload(path, file)
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('price-proposal-attachments').getPublicUrl(path)
    attachmentUrl = data.publicUrl
  }

  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/price-proposals', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      order_id: orderId,
      amount,
      note: note || undefined,
      hours: hours ?? undefined,
      attachment_url: attachmentUrl,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to submit proposal')
  }

  return res.json()
}
