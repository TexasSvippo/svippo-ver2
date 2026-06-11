import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const accountType = searchParams.get('account_type') ?? 'bestellare'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )

    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data.user) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingUser) {
        const fullName = (data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? '') as string

        await supabaseAdmin.from('users').insert({
          id: data.user.id,
          name: fullName,
          email: data.user.email,
          account_type: accountType,
          is_approved: accountType !== 'bestellare',
          created_at: new Date().toISOString(),
        })

        await supabase.auth.updateUser({ data: { account_type: accountType } })
      }
    }
  }

  return NextResponse.redirect(`${origin}/profile`)
}
