import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Fetch the ad to get cta_url (admin client bypasses RLS)
  const { data: ad, error: fetchErr } = await supabaseAdmin
    .from('ads')
    .select('cta_url, click_count')
    .eq('id', id)
    .single()

  if (fetchErr || !ad) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
  }

  // Increment click_count (fire-and-forget – don't block the redirect)
  supabaseAdmin
    .from('ads')
    .update({ click_count: (ad.click_count ?? 0) + 1 })
    .eq('id', id)
    .then()

  return NextResponse.json({ cta_url: ad.cta_url })
}
