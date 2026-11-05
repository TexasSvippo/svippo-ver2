import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Same Bearer-token check the protected routes already do inline
// (become-svippare/submit, price-proposals, profile/delete-account,
// register/complete): verify the access token against Supabase Auth.
//
//   const auth = await requireUser(req)
//   if ('response' in auth) return auth.response
//   const { user } = auth
export async function requireUser(req: NextRequest): Promise<{ user: User } | { response: NextResponse }> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token ?? '')
  if (!user) return { response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) }
  return { user }
}

// Server-side admin check (the /admin page's own check only runs in the browser).
export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.from('users').select('role').eq('id', userId).maybeSingle()
  return data?.role === 'admin'
}

export function forbidden(error = 'Forbidden') {
  return NextResponse.json({ success: false, error }, { status: 403 })
}
