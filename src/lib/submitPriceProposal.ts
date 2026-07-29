import { supabase } from '@/lib/supabase'

type SubmitPriceProposalParams = {
  orderId: string
  amount: number
  note?: string
  hours?: number
  file?: File | null
}

export async function submitPriceProposal({ orderId, amount, note, hours, file }: SubmitPriceProposalParams) {
  let attachmentUrl: string | undefined

  if (file) {
    const path = `${orderId}/${Date.now()}-${file.name}`
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
