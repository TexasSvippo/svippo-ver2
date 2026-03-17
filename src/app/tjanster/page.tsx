import { supabase } from '@/lib/supabase'
import TjansterClient from './TjansterClient'

export const metadata = {
  title: 'Tjänster – Svippo',
  description: 'Hitta och boka tjänster nära dig på Svippo.',
}

export default async function TjansterPage() {
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false })

  return <TjansterClient services={services ?? []} />
}