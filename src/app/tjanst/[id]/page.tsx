import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ServiceDetailClient from './ServiceDetailClient'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const { data: serviceRaw } = await supabase
    .from('services')
    .select('*, users(avatar_url)')
    .eq('id', id)
    .single()

  const { users: serviceUsers, ...serviceRest } = serviceRaw as typeof serviceRaw & { users: { avatar_url: string | null } | null }
  const service = serviceRaw ? { ...serviceRest, avatar_url: serviceUsers?.avatar_url ?? null } : null

  if (!service) return { title: 'Tjänst hittades inte – Svippo' }

  return {
    title: `${service.title} – Svippo`,
    description: service.description?.slice(0, 160),
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params

  const [{ data: serviceRaw }, { data: reviews }] = await Promise.all([
    supabase.from('services').select('*, users(avatar_url)').eq('id', id).single(),
    supabase
      .from('reviews')
      .select('*')
      .eq('service_id', id)
      .eq('role', 'buyer')
      .order('created_at', { ascending: false }),
  ])

  const { users: svcUsers, ...svcRest } = serviceRaw as typeof serviceRaw & { users: { avatar_url: string | null } | null }
  const service = serviceRaw ? { ...svcRest, avatar_url: svcUsers?.avatar_url ?? null } : null

  if (!service) notFound()

  const avgRating = reviews && reviews.length > 0
    ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length * 10) / 10
    : null

  return (
    <ServiceDetailClient
      service={service}
      reviews={reviews ?? []}
      avgRating={avgRating}
    />
  )
}