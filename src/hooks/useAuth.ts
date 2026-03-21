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
}

export default function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // ← NY: separat state för svippareStatus så vi kan uppdatera den från DB
  const [svippareStatus, setSvippareStatus] = useState<SvippareStatus>(null)

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
        // Inte pending – lita på metadata som vanligt
        setSvippareStatus(metadataStatus)
        return
      }

      // Metadata säger pending – kolla DB om det faktiskt fortfarande stämmer
      const { data } = await supabase
        .from('svippare_profiles')
        .select('status')
        .eq('user_id', user!.id)
        .single()

      if (data?.status && data.status !== metadataStatus) {
        // DB har uppdaterats (t.ex. godkänd via SQL) – uppdatera metadata
        await supabase.auth.updateUser({
          data: { svippare_status: data.status }
        })
        setSvippareStatus(data.status as SvippareStatus)
      } else {
        setSvippareStatus(metadataStatus)
      }
    }

    checkDbStatus()
  }, [user])

  const accountType = (user?.user_metadata?.account_type as AccountType) ?? null

  const canCreateService =
    accountType === 'foretag' ||
    accountType === 'uf-foretag' ||
    (accountType === 'svippare' && svippareStatus === 'approved')

  return { user, loading, accountType, svippareStatus, canCreateService }
}