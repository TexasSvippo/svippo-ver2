import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import ForfragningarClient from './ForfragningarClient'

export const metadata = {
  title: 'Förfrågningar – Svippo',
  description: 'Hitta uppdrag att utföra på Svippo.',
}

export default async function ForfragningarPage() {
  // Step 1: fetch requests without users join
  const { data: requestsRaw } = await supabase
    .from('requests')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const rawList = requestsRaw ?? []

  // Step 2: fetch avatars for all user_ids in one query
  const userIds = [...new Set(rawList.map((r: any) => r.user_id).filter(Boolean))]
  const { data: usersData } = userIds.length > 0
    ? await supabase.from('users').select('id, avatar_url').in('id', userIds)
    : { data: [] }

  const avatarMap = Object.fromEntries((usersData ?? []).map((u: any) => [u.id, u.avatar_url]))

  // Step 3: combine
  const requests = rawList.map((r: any) => ({
    ...r,
    avatar_url: avatarMap[r.user_id] ?? null,
  }))

  return (
    <Suspense fallback={null}>
      <ForfragningarClient requests={requests} />
    </Suspense>
  )
}
