import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { completeRegistration } from '@/lib/completeRegistration'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Google OAuth has no account_type of its own, so it's appended to
  // redirectTo as a query param instead (see login/page.tsx,
  // register/page.tsx's handleGoogleSignIn). Email/password signups stash
  // it (and name/city/org_number) directly in user_metadata at signUp()
  // time instead -- preferred below when present.
  const queryAccountType = searchParams.get('account_type') ?? 'bestellare'

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
        const meta = data.user.user_metadata ?? {}
        const fullName = (meta.full_name ?? meta.name ?? '') as string
        const avatarUrl = (meta.avatar_url ?? meta.picture ?? null) as string | null
        const accountType = (meta.account_type as string | undefined) ?? queryAccountType

        await completeRegistration({
          userId: data.user.id,
          email: data.user.email!,
          accountType,
          name: fullName,
          city: (meta.city as string | undefined) ?? null,
          orgNumber: (meta.org_number as string | undefined) ?? null,
          avatarUrl,
        })

        await supabase.auth.updateUser({ data: { account_type: accountType } })
      }
    }
  }

  return NextResponse.redirect(`${origin}/profile`)
}
