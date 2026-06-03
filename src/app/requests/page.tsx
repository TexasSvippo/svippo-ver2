import { supabase } from '@/lib/supabase'
import ForfragningarClient from './ForfragningarClient'

export const metadata = {
  title: 'Förfrågningar – Svippo',
  description: 'Hitta uppdrag att utföra på Svippo.',
}

export default async function ForfragningarPage() {
  const { data: requestsRaw } = await supabase
    .from('requests')
    .select('*, users(avatar_url)')
    .or('status.eq.open,status.is.null')
    .order('created_at', { ascending: false })

  const requests = (requestsRaw ?? []).map((r: any) => ({
    ...r,
    avatar_url: r.users?.avatar_url ?? null,
  }))

  return <ForfragningarClient requests={requests} />
}