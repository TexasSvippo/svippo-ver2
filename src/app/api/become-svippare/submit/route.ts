import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseAgeFromPersonnummer } from '@/utils/personnummer'

const TERMS_VERSION = '1.0'
const MIN_AGE = 18

type SocialLink = { id: string; url: string }

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token ?? '')
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: {
    categories?: unknown
    personal_number?: unknown
    address?: unknown
    postal_code?: unknown
    city?: unknown
    bio?: unknown
    experience?: unknown
    website?: unknown
    social_links?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    categories, personal_number, address, postal_code, city,
    bio, experience, website, social_links,
  } = body

  if (typeof personal_number !== 'string' || !personal_number.trim()) {
    return NextResponse.json({ error: 'Personnummer krävs.' }, { status: 400 })
  }

  // ── Age gate — the actual point of this route ─────────────────────────────
  // This re-derives age from personal_number server-side using the same
  // parser the client uses for its UX hint (become-svippare/page.tsx), so
  // the two can never disagree. Unlike the client-side check, an
  // unparseable personnummer is rejected here rather than silently let
  // through -- a garbled/fake personnummer was the most direct way to dodge
  // the age gate entirely before this route existed.
  const age = parseAgeFromPersonnummer(personal_number)
  if (age === null) {
    return NextResponse.json({
      error: 'Personnumret verkar inte vara giltigt. Kontrollera att det är skrivet på formatet ÅÅÅÅMMDD-XXXX eller ÅÅMMDD-XXXX.',
    }, { status: 422 })
  }
  if (age < MIN_AGE) {
    return NextResponse.json({
      error: 'Du måste vara minst 18 år för att ansöka om att bli Svippare.',
    }, { status: 422 })
  }

  if (!Array.isArray(categories) || categories.length === 0) {
    return NextResponse.json({ error: 'Välj minst en kategori.' }, { status: 400 })
  }
  if (typeof bio !== 'string' || !bio.trim()) {
    return NextResponse.json({ error: 'Berätta kort om dig själv.' }, { status: 400 })
  }
  if (typeof address !== 'string' || !address.trim() || typeof postal_code !== 'string' || !postal_code.trim() || typeof city !== 'string' || !city.trim()) {
    return NextResponse.json({ error: 'Adress, postnummer och stad krävs.' }, { status: 400 })
  }

  const cleanedSocialLinks = (Array.isArray(social_links) ? social_links as SocialLink[] : [])
    .map(l => l.url?.trim())
    .filter((url): url is string => Boolean(url))

  // ── Save the application ──────────────────────────────────────────────────
  // svippare_profiles.user_id has a unique constraint, so a rejected
  // applicant re-submitting hits a duplicate-key conflict on a plain
  // insert -- upsert on that same conflict target instead, turning a
  // resubmission into an update of the existing row back to 'pending'
  // (including created_at, so it reappears as a fresh application in the
  // admin queue).
  const { error: profileError } = await supabaseAdmin.from('svippare_profiles').upsert({
    user_id: user.id,
    status: 'pending',
    categories,
    location: city,
    bio,
    experience: typeof experience === 'string' ? experience : '',
    website: typeof website === 'string' ? website : '',
    personal_number,
    address,
    postal_code,
    city,
    social_links: cleanedSocialLinks,
    terms_accepted: true,
    terms_accepted_at: new Date().toISOString(),
    terms_version: TERMS_VERSION,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (profileError) {
    console.error('[become-svippare/submit] upsert failed:', profileError.message)
    return NextResponse.json({ error: 'Något gick fel när ansökan skulle sparas. Försök igen om en stund.' }, { status: 500 })
  }

  // account_type stays 'bestellare' until an admin approves the application
  // (handleApprove in admin/page.tsx) -- flipping it here would let a
  // pending/rejected applicant appear approved before any review happened.
  // svippare_status still gets tracked immediately so the rest of the app
  // can show correct pending/rejected messaging.
  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, svippare_status: 'pending' },
  })

  return NextResponse.json({ success: true })
}
