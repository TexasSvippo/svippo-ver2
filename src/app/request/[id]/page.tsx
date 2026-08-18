import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RequestDetailClient from './RequestDetailClient'
import { stripToOgDescription } from '@/utils/ogDescription'

const OG_FALLBACK_IMAGE = '/images/Svippo-og-img.png'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const { data: request } = await supabase
    .from('requests')
    .select('title, description, user_id')
    .eq('id', id)
    .single()

  if (!request) return { title: 'Förfrågan hittades inte – Svippo' }

  const { data: user } = request.user_id
    ? await supabase.from('users').select('avatar_url').eq('id', request.user_id).single()
    : { data: null }

  const title = `${request.title} – Svippo`
  const description = stripToOgDescription(request.description, `Se ${request.title} på Svippo.`)
  const image = user?.avatar_url ?? OG_FALLBACK_IMAGE

  return {
    title,
    description,
    openGraph: { title, description, images: [image] },
  }
}

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params

  const { data: raw } = await supabase
    .from('requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!raw) notFound()

  const { data: userData } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('id', raw.user_id)
    .single()

  const request = { ...raw, avatar_url: userData?.avatar_url ?? null }

  return <RequestDetailClient request={request} />
}