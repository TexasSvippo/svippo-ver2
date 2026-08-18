import Hero from '@/components/Hero'
import Categories from '@/components/Categories'
import ServiceList from '@/components/ServiceList'
import HowItWorks from '@/components/HowItWorks'
import FeatureSlider from '@/components/FeatureSlider'
import CtaSection from '@/components/CtaSection'
import { supabase } from '@/lib/supabase'

export const revalidate = 60

export default async function Home() {
  const [servicesRes, requestsRes] = await Promise.all([
    supabase
      .from('services')
      .select('*, users(avatar_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('requests')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const services = (servicesRes.data ?? []).map(s => {
    const { users, ...rest } = s as typeof s & { users: { avatar_url: string | null } | null }
    return { ...rest, avatar_url: users?.avatar_url ?? null }
  })

  // Fetch request avatars separately to avoid users-join RLS issue
  const reqList = requestsRes.data ?? []
  const reqUserIds = [...new Set(reqList.map((r: { user_id?: string }) => r.user_id).filter(Boolean))]
  const { data: reqUsersData } = reqUserIds.length > 0
    ? await supabase.from('users').select('id, avatar_url').in('id', reqUserIds)
    : { data: [] }
  const reqAvatarMap = Object.fromEntries((reqUsersData ?? []).map((u: { id: string; avatar_url: string | null }) => [u.id, u.avatar_url]))

  const requests = reqList.map((r: (typeof reqList)[number]) => ({
    ...r,
    avatar_url: r.user_id ? (reqAvatarMap[r.user_id] ?? null) : null,
  }))

  return (
    <main>
      <Hero />
      <Categories />
      <ServiceList services={services} requests={requests} />
      <HowItWorks />
      <FeatureSlider />
      <CtaSection />
    </main>
  )
}
