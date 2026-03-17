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

  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single()

  if (!service) notFound()

  return <ServiceDetailClient service={service} />
}
