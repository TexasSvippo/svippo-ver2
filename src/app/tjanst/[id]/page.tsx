import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ServiceDetailClient from './ServiceDetailClient'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const { data: service } = await supabase
    .from('services')
    .select('title, description')
    .eq('id', id)
    .single()

  if (!service) return { title: 'Tjänst hittades inte – Svippo' }

  return {
    title: `${service.title} – Svippo`,
    description: service.description?.slice(0, 160),
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params

  const [{ data: service }, { data: reviews }] = await Promise.all([
    supabase.from('services').select('*').eq('id', id).single(),
    supabase
      .from('reviews')
      .select('*')
      .eq('service_id', id)
      .eq('role', 'buyer')
      .order('created_at', { ascending: false }),
  ])

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