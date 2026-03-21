'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export type AccountType = 'bestellare' | 'svippare' | 'foretag' | 'uf-foretag'
export type SvippareStatus = 'pending' | 'approved' | 'rejected' | null

interface AuthState {
  user: User | null
  loading: boolean
  accountType: AccountType | null
  svippareStatus: SvippareStatus
  canCreateService: boolean
  avatarUrl: string | null
}

export default function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // ← NY: separat state för svippareStatus så vi kan uppdatera den från DB
  const [svippareStatus, setSvippareStatus] = useState<SvippareStatus>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
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
          await supabase.auth.updateUser({
            data: { svippare_status: data.status }
          })
          setSvippareStatus(data.status as SvippareStatus)
        } else {
          setSvippareStatus(metadataStatus)
        }
      }

      // Hämta alltid avatar_url oavsett status
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
        setAvatarUrl(userData?.avatar_url ?? null)
      }
    }

    checkDbStatus()
  }, [user])

  const accountType = (user?.user_metadata?.account_type as AccountType) ?? null

  const canCreateService =
    accountType === 'foretag' ||
    accountType === 'uf-foretag' ||
    (accountType === 'svippare' && svippareStatus === 'approved')

  return { user, loading, accountType, svippareStatus, canCreateService, avatarUrl }
}