import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendNyForfragningIBevakadKategori } from '@/lib/emails/nyForfragningIBevakadKategori'
import { categories } from '@/data/categories'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { data: request } = await supabaseAdmin
      .from('requests')
      .select('id, title, category_id, subcategory, user_id')
      .eq('id', id)
      .single()

    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
    }

    const { data: subscribers } = await supabaseAdmin
      .from('category_subscriptions')
      .select('user_id')
      .like('category_id', `${request.category_id}%`)

    const subscriberIds = [...new Set((subscribers ?? []).map(s => s.user_id))]
      .filter(uid => uid !== request.user_id)

    if (subscriberIds.length === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    // Endast svippare/företag/uf-företag ska få mejlet — "Bevaka
    // förfrågningar" är till för utförare. Gamla bevakningar från
    // bestellare-konton (från innan RLS-fixen) matchar helt enkelt inte
    // det här filtret och får därför inget mejl, utan att raderna
    // behöver städas bort.
    const { data: eligibleUsers } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .in('id', subscriberIds)
      .in('account_type', ['svippare', 'foretag', 'uf-foretag'])

    const categoryLabel = categories.find(c => c.id === request.category_id)?.label ?? request.category_id
    const baseUrl = req.nextUrl.origin
    const requestUrl = `${baseUrl}/request/${request.id}`

    const results = await Promise.allSettled(
      (eligibleUsers ?? [])
        .filter((u): u is typeof u & { email: string } => !!u.email)
        .map(u => sendNyForfragningIBevakadKategori({
          to: u.email,
          recipientName: u.name ?? 'där',
          categoryLabel,
          subcategory: request.subcategory,
          requestTitle: request.title,
          requestUrl,
        }))
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ success: true, sent, eligible: eligibleUsers?.length ?? 0 })
  } catch (err) {
    console.error('Category subscription notification email error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
