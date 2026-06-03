import { supabase } from '@/lib/supabase'
import ForfragningarClient from './ForfragningarClient'

export const metadata = {
  title: 'Förfrågningar – Svippo',
  description: 'Hitta uppdrag att utföra på Svippo.',
}

export default async function ForfragningarPage() {
  const { data: requestsRaw, error: reqErr } = await supabase
    .from('requests')
    .select('*, users(avatar_url)')
    .or('status.eq.open,status.is.null')
    .order('created_at', { ascending: false })

  console.log('[requests/page] count:', requestsRaw?.length ?? 0)
  console.log('[requests/page] error:', reqErr)
  console.log('[requests/page] first row:', JSON.stringify(requestsRaw?.[0] ?? null))

  const requests = (requestsRaw ?? []).map((r: any) => ({
    ...r,
    avatar_url: r.users?.avatar_url ?? null,
  }))

  return <ForfragningarClient requests={requests} />
}