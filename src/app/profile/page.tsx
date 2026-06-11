import { Suspense } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  let initialAccountType: string | null = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', user.id)
      .single()
    initialAccountType = data?.account_type ?? null
  }

  return (
    <Suspense fallback={null}>
      <ProfileClient initialAccountType={initialAccountType} />
    </Suspense>
  )
}
