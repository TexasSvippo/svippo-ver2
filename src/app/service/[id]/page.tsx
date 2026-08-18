import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { notFound } from 'next/navigation'
import ServiceDetailClient from './ServiceDetailClient'
import { stripToOgDescription } from '@/utils/ogDescription'

const OG_FALLBACK_IMAGE = '/images/Svippo-og-img.png'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const [{ data: serviceRaw }, { data: firstReference }] = await Promise.all([
    supabase
      .from('services')
      .select('*, users(avatar_url)')
      .eq('id', id)
      .single(),
    supabase
      .from('service_references')
      .select('image_url')
      .eq('service_id', id)
      .order('sort_order')
      .limit(1)
      .maybeSingle(),
  ])

  const { users: serviceUsers, ...serviceRest } = serviceRaw as typeof serviceRaw & { users: { avatar_url: string | null } | null }
  const service = serviceRaw ? { ...serviceRest, avatar_url: serviceUsers?.avatar_url ?? null } : null

  if (!service) return { title: 'Tjänst hittades inte – Svippo' }

  const title = `${service.title} – Svippo`
  const description = stripToOgDescription(service.description, `Se ${service.title} på Svippo.`)
  const image = firstReference?.image_url ?? service.avatar_url ?? OG_FALLBACK_IMAGE

  return {
    title,
    description,
    openGraph: { title, description, images: [image] },
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params

  const [{ data: serviceRaw }, { data: reviews }, { data: references }] = await Promise.all([
    supabase.from('services').select('*, users(avatar_url, account_type)').eq('id', id).single(),
    supabase
      .from('reviews')
      .select('*')
      .eq('service_id', id)
      .eq('role', 'buyer')
      .order('created_at', { ascending: false }),
    supabase
      .from('service_references')
      .select('*')
      .eq('service_id', id)
      .order('sort_order'),
  ])

  const service = serviceRaw ? (() => {
    const { users: svcUsers, ...svcRest } = serviceRaw as typeof serviceRaw & { users: { avatar_url: string | null; account_type: string | null } | null }
    return { ...svcRest, avatar_url: svcUsers?.avatar_url ?? null, seller_account_type: svcUsers?.account_type ?? null }
  })() : null

  if (!service) notFound()

  const [{ data: svippareProfile }, { data: companyProfile }] = await Promise.all([
    supabaseAdmin.from('svippare_profiles').select('bio').eq('user_id', service.user_id).maybeSingle(),
    supabaseAdmin.from('company_profiles').select('bio').eq('user_id', service.user_id).maybeSingle(),
  ])
  const providerBio = svippareProfile?.bio ?? companyProfile?.bio ?? null

  const avgRating = reviews && reviews.length > 0
    ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length * 10) / 10
    : null

  return (
    <Suspense fallback={null}>
      <ServiceDetailClient
        service={service}
        reviews={reviews ?? []}
        avgRating={avgRating}
        references={references ?? []}
        bio={providerBio}
      />
    </Suspense>
  )
}