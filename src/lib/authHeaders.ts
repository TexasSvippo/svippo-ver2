import { supabase } from '@/lib/supabase'

// Headers for calls to our own Bearer-protected API routes (see requireUser.ts).
// Same getSession() pattern the existing protected calls use.
export async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token ?? ''}`,
  }
}
