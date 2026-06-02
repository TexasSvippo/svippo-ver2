import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error: rpcErr } = await supabaseAdmin.rpc('increment_ad_click', { ad_id: id })
  if (rpcErr) {
    // Fallback if RPC doesn't exist yet: read then write
    const { data } = await supabaseAdmin
      .from('ads')
      .select('click_count')
      .eq('id', id)
      .single()
    if (data) {
      await supabaseAdmin
        .from('ads')
        .update({ click_count: (data.click_count ?? 0) + 1 })
        .eq('id', id)
    }
  }

  return NextResponse.json({ ok: true })
}
