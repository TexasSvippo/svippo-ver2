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

  const { data: raw, error: rawErr } = await supabase
    .from('requests')
    .select('*, users(avatar_url)')
    .eq('id', id)
    .single()

  console.log('[request/[id]] id:', id)
  console.log('[request/[id]] data:', JSON.stringify(raw))
  console.log('[request/[id]] error:', rawErr)

  if (!raw) notFound()

  const { users: reqUsers, ...reqRest } = raw as typeof raw & { users: { avatar_url: string | null } | null }
  const request = { ...reqRest, avatar_url: reqUsers?.avatar_url ?? null }

  return <RequestDetailClient request={request} />
}