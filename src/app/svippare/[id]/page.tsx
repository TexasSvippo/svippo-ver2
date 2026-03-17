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
    .select('name, bio')
    .eq('id', id)
    .single()

  if (!profile) return { title: 'Profil hittades inte – Svippo' }

  return {
    title: `${profile.name} – Svippo`,
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

  const avgRating = reviews && reviews.length > 0
    ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length * 10) / 10
    : null

  return (
    <PublicProfileClient
      profile={profile}
      services={services ?? []}
      reviews={reviews ?? []}
      avgRating={avgRating}
      userId={id}
    />
  )
}