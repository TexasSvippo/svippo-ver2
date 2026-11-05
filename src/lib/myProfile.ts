import { authHeaders } from '@/lib/authHeaders'

// The signed-in user's own private fields, via the Bearer-protected
// /api/profile/me route (the client never reads these columns from
// the users table directly).
export type MyPrivateProfile = {
  email: string | null
  phone: string | null
  role: string | null
  account_type: string | null
}

export async function fetchMyProfile(): Promise<MyPrivateProfile | null> {
  try {
    const res = await fetch('/api/profile/me', { headers: await authHeaders(), cache: 'no-store' })
    return res.ok ? ((await res.json()) as MyPrivateProfile) : null
  } catch {
    return null
  }
}
