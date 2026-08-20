'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export type AccountType = 'bestellare' | 'svippare' | 'foretag' | 'uf-foretag'
export type SvippareStatus = 'pending' | 'approved' | 'rejected' | null

// Best-effort: konton skapade innan user_metadata stashades vid signUp (se
// register/page.tsx) saknar namn/kontotyp här och kan inte självläkas --
// register/complete avvisar dem med 400 precis som väntat, inget att göra
// åt förutom att den enskilda användaren registrerar om sig.
async function completeRegistrationFromMetadata(user: User): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) return false

  const meta = user.user_metadata ?? {}
  if (typeof meta.name !== 'string' || typeof meta.account_type !== 'string') return false

  const res = await fetch('/api/register/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userId: user.id,
      email: user.email,
      accountType: meta.account_type,
      name: meta.name,
      city: meta.city,
      orgNumber: meta.org_number,
    }),
  })

  return res.ok
}

interface AuthState {
  user: User | null
  loading: boolean
  accountType: AccountType | null
  svippareStatus: SvippareStatus
  canCreateService: boolean
  avatarUrl: string | null
  name: string | null
}

export default function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // ← NY: separat state för svippareStatus så vi kan uppdatera den från DB
  const [svippareStatus, setSvippareStatus] = useState<SvippareStatus>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ← NY: när user ändras och metadata säger pending, kolla DB för att fånga
  // godkännanden som skett via SQL (utan att användaren loggat ut/in)
  useEffect(() => {
    const metadataStatus = user?.user_metadata?.svippare_status as SvippareStatus ?? null

    const checkDbStatus = async () => {
      if (metadataStatus !== 'pending') {
        setSvippareStatus(metadataStatus)
      } else {
        const { data } = await supabase
          .from('svippare_profiles')
          .select('status')
          .eq('user_id', user!.id)
          .single()

        if (data?.status && data.status !== metadataStatus) {
          // account_type is only flipped to 'svippare' by an admin approving
          // the application (users table, server-side) -- the applicant's
          // own session metadata never gets that update pushed to it, so
          // self-heal it here the same way svippare_status already is,
          // the moment this session notices the DB says 'approved'.
          await supabase.auth.updateUser({
            data: {
              svippare_status: data.status,
              ...(data.status === 'approved' ? { account_type: 'svippare' } : {}),
            }
          })
          setSvippareStatus(data.status as SvippareStatus)
        } else {
          setSvippareStatus(metadataStatus)
        }
      }

      // Hämta alltid avatar_url och name oavsett status
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('avatar_url, name')
          .eq('id', user.id)
          .single()

        if (!userData) {
          // users-raden saknas -- troligen ett konto vars registrering
          // stannade vid e-postbekräftelse (signUp() ger ingen session
          // förrän e-posten bekräftats, så register/complete-anropet direkt
          // efter signUp har inte kunnat köra). Slutför den nu, med samma
          // Bearer-skyddade endpoint, från datat som stashades i
          // user_metadata redan vid signUp (register/page.tsx).
          const completed = await completeRegistrationFromMetadata(user)
          if (completed) {
            const { data: refetched } = await supabase
              .from('users')
              .select('avatar_url, name')
              .eq('id', user.id)
              .single()
            setAvatarUrl(refetched?.avatar_url ?? null)
            setName(refetched?.name ?? null)
            return
          }
        }

        setAvatarUrl(userData?.avatar_url ?? null)
        setName(userData?.name ?? null)
      }
    }

    checkDbStatus()
  }, [user])

  const accountType = (user?.user_metadata?.account_type as AccountType) ?? null

  const canCreateService =
    accountType === 'foretag' ||
    accountType === 'uf-foretag' ||
    (accountType === 'svippare' && svippareStatus === 'approved')

  return { user, loading, accountType, svippareStatus, canCreateService, avatarUrl, name }
}