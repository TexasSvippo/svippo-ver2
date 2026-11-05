import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { isAdmin } from '@/lib/requireUser'
import StudioClient from './StudioClient'

export default async function StudioPage() {
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

  if (!user) {
    redirect('/login')
  }

  // Role is checked with the service role (isAdmin), so this page doesn't
  // need the user's own JWT to be able to read users.role.
  if (!(await isAdmin(user.id))) {
    notFound()
  }

  return <StudioClient />
}
