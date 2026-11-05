import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireUser } from '@/lib/requireUser'
import { sendNyForfragningIBevakadKategori } from '@/lib/emails/nyForfragningIBevakadKategori'
import { categories } from '@/data/categories'

// Only the request's owner may trigger this, and only once per request:
// the update below atomically "claims" the send by setting
// requests.subscribers_notified_at, and only matches if the caller owns the
// request and nothing has been sent yet.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(req)
    if ('response' in auth) return auth.response
    const { user } = auth

    const { id } = await params

    const { data: request, error: claimError } = await supabaseAdmin
      .from('requests')
      .update({ subscribers_notified_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .is('subscribers_notified_at', null)
      .select('id, title, category_id, subcategory, user_id')
      .maybeSingle()

    if (claimError) {
      console.error('[notify-subscribers] claim failed:', claimError.message)
      return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
    }
    if (!request) {
      // Not the owner, unknown request, or already sent.
      return NextResponse.json({ success: true, sent: 0, skipped: 'not_owner_or_already_sent' })
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
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
