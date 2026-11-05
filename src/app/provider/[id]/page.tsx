import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import PublicProfileClient from './PublicProfileClient'
import { stripToOgDescription } from '@/utils/ogDescription'

const OG_FALLBACK_IMAGE = '/images/Svippo-og-img.png'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const { data: profile } = await supabase
    .from('users')
    .select('name, bio, account_type, avatar_url')
    .eq('id', id)
    .single()

  if (!profile) return { title: 'Profil hittades inte – Svippo' }

  const typeLabel =
    profile.account_type === 'foretag' ? 'Företag' :
    profile.account_type === 'uf-foretag' ? 'UF-företag' :
    'Svippare'

  const title = `${profile.name} – ${typeLabel} på Svippo`
  const description = stripToOgDescription(profile.bio, `Se ${profile.name}s tjänster på Svippo.`)
  const image = profile.avatar_url ?? OG_FALLBACK_IMAGE

  return {
    title,
    description,
    openGraph: { title, description, images: [image] },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params

  const [{ data: profile }, { data: services }, { data: reviews }] = await Promise.all([
    // Only the columns the public profile shows -- never role/is_approved.
    // (email/phone are still shown under "Kontaktuppgifter"; that's a separate product decision.)
    supabase.from('users').select('id, name, email, phone, bio, account_type, avatar_url, created_at').eq('id', id).single(),
    supabase.from('services').select('*').eq('user_id', id).eq('status', 'active').order('created_at', { ascending: false }),
    supabase.from('reviews').select('*').eq('reviewee_id', id).eq('role', 'buyer'),
  ])

  if (!profile) notFound()
  if (profile.account_type === 'bestellare') notFound()

  // Hämta utökad profil beroende på kontotyp
  let svippareProfile = null
  let companyProfile = null

  if (profile.account_type === 'svippare') {
    const { data } = await supabase
      .from('svippare_profiles')
      // Only what PublicProfileClient shows. Never select('*') here: the row also
      // holds personal_number, address and postal_code, and this object is sent
      // to the browser.
      .select('categories, location, bio, experience, website, social_links, city')
      .eq('user_id', id)
      .eq('status', 'approved')
      .single()
    if (!data) notFound()
    svippareProfile = data
  }

  if (profile.account_type === 'foretag' || profile.account_type === 'uf-foretag') {
    const { data } = await supabase
      .from('company_profiles')
      // Only what PublicProfileClient shows (same reason as svippare_profiles above).
      .select('org_number, website, social_links, categories, city, bio')
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