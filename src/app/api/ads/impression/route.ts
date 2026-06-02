import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error: rpcErr } = await supabaseAdmin.rpc('increment_ad_impression', { ad_id: id })
  if (rpcErr) {
    // Fallback if RPC doesn't exist yet: read then write
    const { data } = await supabaseAdmin
      .from('ads')
      .select('impression_count')
      .eq('id', id)
      .single()
    if (data) {
      await supabaseAdmin
        .from('ads')
        .update({ impression_count: (data.impression_count ?? 0) + 1 })
        .eq('id', id)
    }
  }

  return NextResponse.json({ ok: true })
}
