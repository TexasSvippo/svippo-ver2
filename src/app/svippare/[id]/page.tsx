import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import PublicProfileClient from './PublicProfileClient'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const { data: profile } = await supabase
    .from('users')
    .select('name, bio, account_type')
    .eq('id', id)
    .single()

  if (!profile) return { title: 'Profil hittades inte – Svippo' }

  const typeLabel =
    profile.account_type === 'foretag' ? 'Företag' :
    profile.account_type === 'uf-foretag' ? 'UF-företag' :
    'Svippare'

  return {
    title: `${profile.name} – ${typeLabel} på Svippo`,
    description: profile.bio?.slice(0, 160) ?? `Se ${profile.name}s tjänster på Svippo.`,
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params

  const [{ data: profile }, { data: services }, { data: reviews }] = await Promise.all([
    supabase.from('users').select('*').eq('id', id).single(),
    supabase.from('services').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    supabase.from('reviews').select('*').eq('reviewee_id', id).eq('role', 'buyer'),
  ])

  if (!profile) notFound()

  // Hämta utökad profil beroende på kontotyp
  let svippareProfile = null
  let companyProfile = null

  if (profile.account_type === 'svippare') {
    const { data } = await supabase
      .from('svippare_profiles')
      .select('*')
      .eq('user_id', id)
      .eq('status', 'approved')
      .single()
    svippareProfile = data
  }

  if (profile.account_type === 'foretag' || profile.account_type === 'uf-foretag') {
    const { data } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', id)
      .single()
    companyProfile = data
  }

  const avgRating = reviews && reviews.length > 0
    ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length * 10) / 10
    : null

  return (
    <PublicProfileClient
      profile={profile}
      svippareProfile={svippareProfile}
      companyProfile={companyProfile}
      services={services ?? []}
      reviews={reviews ?? []}
      avgRating={avgRating}
      userId={id}
    />
  )
}