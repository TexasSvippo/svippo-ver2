import { supabase } from '@/lib/supabase'
import TjansterClient from './TjansterClient'

export const metadata = {
  title: 'Tjänster – Svippo',
  description: 'Hitta och boka tjänster nära dig på Svippo.',
}

export default async function TjansterPage() {
  const { data: servicesRaw } = await supabase
    .from('services')
    .select('*, users(avatar_url)')
    .order('created_at', { ascending: false })

  const services = (servicesRaw ?? []).map(s => {
    const { users, ...rest } = s as typeof s & { users: { avatar_url: string | null } | null }
    return { ...rest, avatar_url: users?.avatar_url ?? null }
  })

  return <TjansterClient services={services ?? []} />
}