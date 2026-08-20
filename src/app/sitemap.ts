import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

const BASE_URL = 'https://svippo.se'

// Utan detta bakas sitemapen in helt statiskt vid build-tid och nya
// tjänster/profiler dyker inte upp i den förrän nästa deploy. Sökmotorer
// behöver ingen realtidsfärskhet -- en timme är gott om marginal.
export const revalidate = 3600

// Förfrågningar (/request/[id]) inkluderas medvetet INTE:
// de är kortlivade (fylls/stängs vanligtvis inom dagar-veckor, till
// skillnad från tjänster som är mer permanenta erbjudanden) och sidan
// gör ingen statusfiltrering -- redan tillsatta/stängda förfrågningar
// förblir nåbara men är inte längre relevanta för någon som hittar dit
// via sök. Att indexera dem ger lågt varaktigt SEO-värde och riskerar
// att späda ut crawl-budget från tjänster/profiler, som är evergreen.
// /requests (listan) är kvar i sitemapen -- själva innehållet är publikt.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/services`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/requests`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE_URL}/om-oss`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/kontakt`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE_URL}/villkor`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/villkor/utforare`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/integritetspolicy`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const [{ data: services }, { data: approvedSvippare }, { data: companies }] = await Promise.all([
    supabase.from('services').select('id, created_at').eq('status', 'active'),
    supabase.from('svippare_profiles').select('user_id, updated_at').eq('status', 'approved'),
    supabase.from('users').select('id, created_at').in('account_type', ['foretag', 'uf-foretag']),
  ])

  const servicePages: MetadataRoute.Sitemap = (services ?? []).map((s) => ({
    url: `${BASE_URL}/service/${s.id}`,
    lastModified: s.created_at ? new Date(s.created_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Godkända svippare kräver svippare_profiles.status === 'approved' för att
  // sidan ska rendera (annars notFound()) -- samma villkor speglas här så
  // sitemapen aldrig innehåller en 404-sida.
  const svippareProviderPages: MetadataRoute.Sitemap = (approvedSvippare ?? []).map((p) => ({
    url: `${BASE_URL}/provider/${p.user_id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // Företag/UF-företag har ingen motsvarande godkännandeprocess -- kontot
  // att existera med rätt account_type räcker för att sidan ska rendera.
  const companyProviderPages: MetadataRoute.Sitemap = (companies ?? []).map((c) => ({
    url: `${BASE_URL}/provider/${c.id}`,
    lastModified: c.created_at ? new Date(c.created_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...servicePages, ...svippareProviderPages, ...companyProviderPages]
}
