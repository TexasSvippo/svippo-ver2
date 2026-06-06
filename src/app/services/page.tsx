import { supabase } from '@/lib/supabase'
import TjansterClient from './TjansterClient'

export const metadata = {
  title: 'Tjänster – Svippo',
  description: 'Hitta och boka tjänster nära dig på Svippo.',
}

const PAGE_SIZE = 12

type PageProps = {
  searchParams: Promise<{ page?: string; [key: string]: string | undefined }>
}

export default async function TjansterPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const [servicesRes, countRes] = await Promise.all([
    supabase
      .from('services')
      .select('id, title, description, category_id, subcategory, price_type, price, location, user_id, user_name, account_type, rating, reviews, created_at, users(avatar_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
    supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  const services = (servicesRes.data ?? []).map(s => {
    const { users, ...rest } = s as typeof s & { users: { avatar_url: string | null } | null }
    return { ...rest, avatar_url: users?.avatar_url ?? null }
  })

  return (
    <TjansterClient
      services={services}
      page={page}
      totalCount={countRes.count ?? 0}
      pageSize={PAGE_SIZE}
    />
  )
}
