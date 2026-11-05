import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireUser, isAdmin, forbidden } from '@/lib/requireUser'
import { toStoragePath } from '@/lib/storagePaths'

const BUCKET = 'price-proposal-attachments'
const SIGNED_URL_SECONDS = 60

// A price proposal's attachment may be read by the order's buyer, its seller
// and admins. Returns a short-lived signed URL; the bucket is private.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if ('response' in auth) return auth.response
  const { user } = auth

  const { id } = await params
  const { data: proposal } = await supabaseAdmin
    .from('price_proposals')
    .select('order_id, attachment_url')
    .eq('id', id)
    .maybeSingle()

  const path = toStoragePath(proposal?.attachment_url, BUCKET)
  if (!proposal || !path) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('buyer_id, seller_id')
    .eq('id', proposal.order_id)
    .maybeSingle()

  const isParty = !!order && (order.buyer_id === user.id || order.seller_id === user.id)
  if (!isParty && !(await isAdmin(user.id))) return forbidden()

  // The file must live in the order's folder (<order_id>/...).
  if (!path.startsWith(`${proposal.order_id}/`)) return forbidden()

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS)
  if (error || !data) {
    console.error('[files/price-proposal] signing failed:', error?.message)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl }, { headers: { 'Cache-Control': 'no-store' } })
}
