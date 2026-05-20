import { supabase } from '@/lib/supabase'
import TjansterClient from './TjansterClient'

export const metadata = {
  title: 'Tjänster – Svippo',
  description: 'Hitta och boka tjänster nära dig på Svippo.',
}

export default async function TjansterPage() {
  const { data: servicesRaw } = await supabase
    .from('services')
    .select('id, title, description, category_id, subcategory, price_type, price, location, user_id, user_name, account_type, rating, reviews, created_at, users(avatar_url)')
    .order('created_at', { ascending: false })

  const services = (servicesRaw ?? []).map(s => {
    const { users, ...rest } = s as typeof s & { users: { avatar_url: string | null } | null }
    return { ...rest, avatar_url: users?.avatar_url ?? null }
  })

  return <TjansterClient services={services ?? []} />
}