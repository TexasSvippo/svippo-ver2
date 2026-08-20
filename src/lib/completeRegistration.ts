import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Shared by /api/register/complete (Bearer-token protected, called directly
// by register/page.tsx and by useAuth's self-heal) and auth/callback/route.ts
// (already has a verified session from exchangeCodeForSession, no separate
// auth check needed) -- one place for the actual users/company_profiles
// write so the two entry points can't drift apart.
type CompleteRegistrationInput = {
  userId: string
  email: string
  accountType: string
  name: string
  city?: string | null
  orgNumber?: string | null
  avatarUrl?: string | null
}

export async function completeRegistration({
  userId,
  email,
  accountType,
  name,
  city,
  orgNumber,
  avatarUrl,
}: CompleteRegistrationInput): Promise<{ success: true } | { success: false; error: string }> {
  const isApproved = accountType !== 'bestellare'

  const { error: userError } = await supabaseAdmin.from('users').insert({
    id: userId,
    name,
    email,
    city: city ?? null,
    avatar_url: avatarUrl ?? null,
    account_type: accountType,
    is_approved: isApproved,
    created_at: new Date().toISOString(),
  })

  // 23505 = unique_violation on users_pkey -- the row already exists.
  // Harmless: this can be called more than once for the same account (e.g.
  // useAuth's self-heal mounted twice, or a retried confirmation redirect),
  // so a redundant completion attempt is expected and treated as success.
  if (userError && userError.code !== '23505') {
    return { success: false, error: userError.message }
  }

  if (!userError && (accountType === 'foretag' || accountType === 'uf-foretag')) {
    await supabaseAdmin.from('company_profiles').insert({
      user_id: userId,
      org_number: accountType === 'foretag' && orgNumber ? orgNumber : null,
      city: city ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  return { success: true }
}
