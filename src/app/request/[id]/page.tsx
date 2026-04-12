import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RequestDetailClient from './RequestDetailClient'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const { data: request } = await supabase
    .from('requests')
    .select('title, description')
    .eq('id', id)
    .single()

  if (!request) return { title: 'Förfrågan hittades inte – Svippo' }

  return {
    title: `${request.title} – Svippo`,
    description: request.description?.slice(0, 160),
  }
}

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params

  const { data: request } = await supabase
    .from('requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!request) notFound()

  return <RequestDetailClient request={request} />
}