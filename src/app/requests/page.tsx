import { supabase } from '@/lib/supabase'
import ForfragningarClient from './ForfragningarClient'

export const metadata = {
  title: 'Förfrågningar – Svippo',
  description: 'Hitta uppdrag att utföra på Svippo.',
}

export default async function ForfragningarPage() {
  const { data: requests } = await supabase
    .from('requests')
    .select('*')
    .or('status.eq.open,status.is.null')
    .order('created_at', { ascending: false })

  return <ForfragningarClient requests={requests ?? []} />
}