import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Atomic increment via RPC (no read-then-write race condition)
  const { error } = await supabaseAdmin.rpc('increment_ad_clicks', { ad_id: id })

  if (error) {
    console.error('[ads/click] increment failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
