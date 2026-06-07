'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { categories as allCategories } from '@/data/categories'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from './publicprofile.module.scss'
import { Link as LinkIcon, MapPin, Star, MessageCircle, CheckCircle, Zap, Briefcase, Globe, Smartphone, Mail, User, Info, Link2 } from 'lucide-react'
import { renderStars } from '@/utils/renderStars'
import type { ReactNode } from 'react'

type UserProfile = {
  id: string
  name: string
  email: string
  phone?: string
  bio?: string
  account_type: string
  avatar_url?: string
  created_at?: string
}

type SvippareProfile = {
  categories: string[]
  location: string
  bio: string
  experience?: string
  website?: string
  social_links?: string[]
  city?: string
}

type CompanyProfile = {
  org_number?: string
  website?: string
  social_links?: string[]
  categories?: string[]
  city?: string
  bio?: string
}

type Service = {
  id: string
  title: string
  subcategory: string
  price_type: string
  price: number
  location: string
}

type Review = {
  id: string
  rating: number
  comment: string
  reviewer_name: string
  created_at: string
}

type Props = {
  profile: UserProfile
  svippareProfile: SvippareProfile | null
  companyProfile: CompanyProfile | null
  services: Service[]
  reviews: Review[]
  avgRating: number | null
  userId: string
}




const NAV = [
  { id: 'tjanster', label: 'Tjänster' },
  { id: 'om-mig', label: 'Om oss' },
  { id: 'recensioner', label: 'Recensioner' },
  { id: 'kontakt', label: 'Kontakta' },
]

// Hjälpfunktion för att detektera och länka sociala medier
function getSocialIcon(url: string): ReactNode {
  if (url.includes('instagram')) return '📸'
  if (url.includes('tiktok')) return '🎵'
  if (url.includes('facebook')) return <User size={16} />
  if (url.includes('youtube')) return '▶️'
  if (url.includes('twitter') || url.includes('x.com')) return '𝕏'
  if (url.includes('snapchat')) return '👻'
  if (url.includes('linkedin')) return <Briefcase size={16} />
  return <LinkIcon size={16} />
}

function getSocialLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    return hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1)
  } catch {
    return url
  }
}

export default function PublicProfileClient({
  profile,
  svippareProfile,
  companyProfile,
  services,
  reviews,
  avgRating,
}: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const [activeNav, setActiveNav] = useState('tjanster')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSent, setContactSent] = useState(false)
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(5)
  const [certificates, setCertificates] = useState<{ id: string; name: string; category_id: string; subcategory: string; file_url: string }[]>([])

  const filteredReviews = ratingFilter === null ? reviews : reviews.filter(r => r.rating === ratingFilter)
  const visibleReviews = filteredReviews.slice(0, visibleCount)
  const hasMoreReviews = filteredReviews.length > visibleCount

  const accountType = profile.account_type
  const isUF = accountType === 'uf-foretag'
  const isCompany = accountType === 'foretag'
  const isSvippare = accountType === 'svippare'

  // Profiltyp-klass för CSS-variabler
  const profileTypeClass = isUF
    ? styles['pubprofile--uf']
    : isCompany
    ? styles['pubprofile--foretag']
    : styles['pubprofile--svippare']

  // Profiltyp-badge
  const profileBadge: ReactNode = isUF
    ? '🎓 UF-företag'
    : isCompany
    ? '🏢 Företag'
    : <><Zap size={14} /> Svippare</>

  // Hero-bakgrund (SVG) per profiltyp – desktop och mobil
  const heroBgDesktop = encodeURI(
    isUF
      ? '/images/UF profil bg dator.svg'
      : isCompany
      ? '/images/Företag profil bg dator.svg'
      : '/images/Svippare profil bg dator.svg'
  )
  const heroBgMobile = encodeURI(
    isUF
      ? '/images/uf bg mobil.svg'
      : isCompany
      ? '/images/företag bg mobil.svg'
      : '/images/svippare bg mobil.svg'
  )


  // Bio att visa – svippare har bio i svippareProfile, företag i companyProfile, annars users.bio
  const displayBio = isSvippare
    ? svippareProfile?.bio ?? profile.bio
    : isCompany || isUF
    ? companyProfile?.bio ?? profile.bio
    : profile.bio

  // Stad
  const displayCity = isSvippare
    ? svippareProfile?.city ?? svippareProfile?.location
    : companyProfile?.city

  // Kategorier
  const profileCategories = isSvippare
    ? svippareProfile?.categories ?? []
    : companyProfile?.categories ?? []

  const categoryObjects = profileCategories
    .map(catId => allCategories.find(c => c.id === catId))
    .filter(Boolean)

  // Sociala länkar
  const socialLinks = isSvippare
    ? svippareProfile?.social_links ?? []
    : companyProfile?.social_links ?? []

  // Webbplats
  const website = isSvippare
    ? svippareProfile?.website
    : companyProfile?.website

  useEffect(() => {
    const handleScroll = () => {
      for (const section of NAV) {
        const el = document.getElementById(section.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 140 && rect.bottom >= 140) {
            setActiveNav(section.id)
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchCerts = async () => {
      const { data } = await supabase.from('certificates').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
      setCertificates(data ?? [])
    }
    fetchCerts()
  }, [profile.id])

  const scrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 130
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

 const handleContact = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.id === profile.id) return

    // Kolla om konversation redan finns
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('anchor_type', 'listing')
      .eq('participant_1_id', user.id)
      .eq('participant_2_id', profile.id)
      .limit(1)

    if (existing && existing.length > 0) {
      router.push(`/messages/${existing[0].id}`)
      return
    }

    const { data: existingReverse } = await supabase
      .from('conversations')
      .select('id')
      .eq('anchor_type', 'listing')
      .eq('participant_1_id', profile.id)
      .eq('participant_2_id', user.id)
      .limit(1)

    if (existingReverse && existingReverse.length > 0) {
      router.push(`/messages/${existingReverse[0].id}`)
      return
    }

    // Skapa ny konversation
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        type: 'inquiry',
        anchor_type: 'listing',
        anchor_id: profile.id,
        assignment_id: null,
        participant_1_id: user.id,
        participant_2_id: profile.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (newConv) {
      router.push(`/messages/${newConv.id}`)
    }
  }

  return (
    <div className={`${styles.pubprofile} ${profileTypeClass}`}>

      {/* Hero – dekorativ banner med SVG-bakgrund */}
      <div className={styles.pubprofile__hero}>
        <img src={heroBgDesktop} alt="" aria-hidden="true" className={`${styles.pubprofile__hero_bg} ${styles['pubprofile__hero_bg--desktop']}`} />
        <img src={heroBgMobile} alt="" aria-hidden="true" className={`${styles.pubprofile__hero_bg} ${styles['pubprofile__hero_bg--mobile']}`} />
      </div>

      {/* Sticky meny */}
      <div className={styles.pubprofile__nav}>
        <div className={`container ${styles.pubprofile__nav_inner}`}>
          <span className={styles.pubprofile__nav_label}>Profil:</span>
          {NAV.map(item => (
            <button
              key={item.id}
              className={`${styles.pubprofile__nav_item} ${activeNav === item.id ? styles['pubprofile__nav_item--active'] : ''}`}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button
            className={`btn btn-outline ${styles.pubprofile__share_btn}`}
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('Länk kopierad!')
            }}
          >
            <LinkIcon size={16} /> Dela profil
          </button>
        </div>
      </div>

      {/* Innehåll – tvåkolumnslayout */}
      <div className="container">
        <div className={styles.pubprofile__layout}>

          {/* Huvudinnehåll (vänster kolumn) */}
          <div className={styles.pubprofile__main}>

            {/* Breadcrumbs */}
            <nav className={styles.breadcrumb}>
              <Link href="/">Hem</Link>
              <span>·</span>
              <Link href="/services">Svippare</Link>
              <span>·</span>
              <span>{profile.name}</span>
            </nav>

            {/* Profilrubrik */}
            <div className={styles.pubprofile__header_card}>
              <div className={styles.pubprofile__avatar}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.name} className={styles.pubprofile__avatar_img} />
                  : profile.name?.charAt(0).toUpperCase()
                }
              </div>
              <div className={styles.pubprofile__header_info}>
                <div className={styles.pubprofile__hero_top}>
                  <span className={styles.pubprofile__badge}>{profileBadge}</span>
                  {displayCity && (
                    <span className={styles.pubprofile__location} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {displayCity}</span>
                  )}
                </div>
                {profile.created_at && (
                  <span className={styles.pubprofile__member}>
                    Medlem sedan {new Date(profile.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })}
                  </span>
                )}
                <h1 className={styles.pubprofile__name}>{profile.name}</h1>
                {displayBio && (
                  <p className={styles.pubprofile__bio_short}>
                    {displayBio.slice(0, 120)}{displayBio.length > 120 ? '...' : ''}
                  </p>
                )}

                {/* Kategorier */}
                {categoryObjects.length > 0 && (
                  <div className={styles.pubprofile__categories}>
                    {categoryObjects.map(cat => (
                      <span key={cat!.id} className={styles.pubprofile__category_tag}>
                        {cat!.icon} {cat!.label}
                      </span>
                    ))}
                  </div>
                )}

                <div className={styles.pubprofile__stats}>
                  <div className={styles.pubprofile__stat}>
                    <strong>{services.length}</strong>
                    <span>Tjänster</span>
                  </div>
                  <div className={styles.pubprofile__stat}>
                    <strong>{reviews.length}</strong>
                    <span>Recensioner</span>
                  </div>
                  <div className={styles.pubprofile__stat}>
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{avgRating !== null ? <><Star size={14} /> {avgRating}</> : '–'}</strong>
                    <span>Snittbetyg</span>
                  </div>
                </div>
              </div>
            </div>

        {/* Tjänster */}
        <section id="tjanster" className={styles.pubprofile__section}>
          <h2 className={styles.pubprofile__section_title}>
            {isCompany || isUF ? 'Våra tjänster' : 'Mina tjänster'}
          </h2>
          {services.length === 0 ? (
            <div className={styles.pubprofile__empty}>
              <p>Inga aktiva tjänster just nu.</p>
            </div>
          ) : (
            <div className={styles.pubprofile__services}>
              {services.map(s => (
                <Link href={`/service/${s.id}`} key={s.id} className={`${styles.pubprofile__service} card`}>
                  <div className={styles.pubprofile__service_info}>
                    <span className={styles.pubprofile__service_category}>{s.subcategory}</span>
                    <h3 className={styles.pubprofile__service_title}>{s.title}</h3>
                    <span className={styles.pubprofile__service_location} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {s.location}</span>
                  </div>
                  <div className={styles.pubprofile__service_price}>
                    <span>{s.price_type === 'offert' ? '' : 'från'}</span>
                    <strong>{s.price_type === 'offert' ? 'Offert' : `${s.price} kr`}</strong>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Om mig / Om oss */}
        <section id="om-mig" className={styles.pubprofile__section}>
          <h2 className={styles.pubprofile__section_title}>
            {isCompany || isUF ? 'Om oss' : 'Om mig'}
          </h2>
          <div className={`${styles.pubprofile__about} card`}>
            {displayBio ? (
              <p className={styles.pubprofile__about_text}>{displayBio}</p>
            ) : (
              <p className={styles.pubprofile__empty_text}>Ingen beskrivning tillagd ännu.</p>
            )}

            {/* Erfarenhet – endast svippare */}
            {isSvippare && svippareProfile?.experience && (
              <div className={styles.pubprofile__about_block}>
                <h3 className={styles.pubprofile__about_heading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={16} /> Erfarenhet</h3>
                <p className={styles.pubprofile__about_text}>{svippareProfile.experience}</p>
              </div>
            )}

            {/* Org-nummer – endast företag/UF */}
            {(isCompany || isUF) && companyProfile?.org_number && (
              <div className={styles.pubprofile__about_block}>
                <h3 className={styles.pubprofile__about_heading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🏛️ Organisationsnummer</h3>
                <p className={styles.pubprofile__about_text}>{companyProfile.org_number}</p>
              </div>
            )}

            {/* Webbplats */}
          </div>
        </section>

        {/* Certifikat */}
        {certificates.length > 0 && (
          <section className={styles.pubprofile__section}>
            <h2 className={styles.pubprofile__section_title}>Certifikat</h2>
            <div className={styles.pubprofile__certificates}>
              {certificates.map(cert => {
                const cat = allCategories.find(c => c.id === cert.category_id)
                return (
                  <div key={cert.id} className={styles.pubprofile__cert_item}>
                    <CheckCircle size={16} className={styles.pubprofile__cert_icon} />
                    <div className={styles.pubprofile__cert_info}>
                      <strong>{cert.name}</strong>
                      <span>{cat?.label}{cert.subcategory ? ` · ${cert.subcategory}` : ''}</span>
                    </div>
                    <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className={styles.pubprofile__cert_link}>
                      Visa PDF
                    </a>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Recensioner */}
        <section id="recensioner" className={styles.pubprofile__section}>
          <h2 className={styles.pubprofile__section_title}>Recensioner</h2>

          <div className={styles.pubprofile__reviews_card}>
            {reviews.length === 0 ? (
              <p className={styles.pubprofile__no_reviews}>Inga recensioner ännu.</p>
            ) : (
              <>
                {/* Sammanfattning: stort betyg + antal */}
                <div className={styles.pubprofile__reviews_summary}>
                  <span className={styles.pubprofile__reviews_big_rating}>{avgRating ?? '–'}</span>
                  <span className={styles.pubprofile__reviews_count_label}>{reviews.length} omdömen</span>
                </div>

                {/* Filter-pills */}
                <div className={styles.pubprofile__reviews_pills}>
                  <button
                    type="button"
                    className={`${styles.pubprofile__review_pill} ${ratingFilter === null ? styles['pubprofile__review_pill--active'] : ''}`}
                    onClick={() => { setRatingFilter(null); setVisibleCount(5) }}
                  >
                    Alla
                  </button>
                  {[5, 4, 3, 2, 1].map(n => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.pubprofile__review_pill} ${ratingFilter === n ? styles['pubprofile__review_pill--active'] : ''}`}
                      onClick={() => { setRatingFilter(n); setVisibleCount(5) }}
                    >
                      <Star size={12} fill="#EF9F27" color="#EF9F27" /> {n}/5
                    </button>
                  ))}
                </div>

                {/* Recensionslista */}
                <div className={styles.pubprofile__reviews_list}>
                  {filteredReviews.length === 0 ? (
                    <p className={styles.pubprofile__no_reviews}>Inga omdömen med det betyget.</p>
                  ) : (
                    visibleReviews.map((r, i) => (
                      <div key={r.id}>
                        {i > 0 && <div className={styles.pubprofile__review_divider} />}
                        <div className={styles.pubprofile__review}>
                          <div className={styles.pubprofile__review_header}>
                            <div className={styles.pubprofile__review_avatar}>
                              {r.reviewer_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className={styles.pubprofile__review_meta}>
                              <strong className={styles.pubprofile__review_name}>{r.reviewer_name}</strong>
                              <div className={styles.pubprofile__review_stars}>{renderStars(r.rating, 13)}</div>
                            </div>
                          </div>
                          {r.comment && <p className={styles.pubprofile__review_comment}>{r.comment}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Visa fler */}
                {hasMoreReviews && (
                  <button
                    type="button"
                    className={styles.pubprofile__reviews_load_more}
                    onClick={() => setVisibleCount(c => c + 5)}
                  >
                    Se fler
                  </button>
                )}
              </>
            )}
          </div>
        </section>

          </div>

          {/* Sidopanel (höger kolumn) */}
          <aside id="kontakt" className={styles.pubprofile__sidebar}>
            <div className={styles.pubprofile__sidebar_card}>

              {/* Snittbetyg */}
              <div className={styles.pubprofile__sidebar_rating}>
                <strong>{avgRating !== null ? avgRating : '–'}</strong>
                <span>i snittbetyg</span>
              </div>

              <div className={styles.pubprofile__sidebar_divider} />

              {/* Kontaktuppgifter */}
              <div className={styles.pubprofile__sidebar_section}>
                <h3 className={styles.pubprofile__sidebar_heading}>
                  <Info size={16} /> Kontaktuppgifter
                </h3>
                <div className={styles.pubprofile__contact_info}>
                  <div className={styles.pubprofile__contact_item}>
                    <Smartphone size={16} />
                    <span>{profile.phone || '–'}</span>
                  </div>
                  <div className={styles.pubprofile__contact_item}>
                    <Mail size={16} />
                    <span>{profile.email}</span>
                  </div>
                </div>
              </div>

              {/* Länkar */}
              {(website || socialLinks.length > 0) && (
                <>
                  <div className={styles.pubprofile__sidebar_divider} />
                  <div className={styles.pubprofile__sidebar_section}>
                    <h3 className={styles.pubprofile__sidebar_heading}>
                      <Link2 size={16} /> Länkar
                    </h3>
                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.pubprofile__link}
                      >
                        <Globe size={16} /> {website}
                      </a>
                    )}
                    {socialLinks.length > 0 && (
                      <div className={styles.pubprofile__social_links}>
                        {socialLinks.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.pubprofile__social_link}
                          >
                            <span>{getSocialIcon(url)}</span>
                            <span>{getSocialLabel(url)}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Meddela mig */}
              <button className={`btn btn-primary ${styles.pubprofile__sidebar_cta}`} onClick={handleContact}>
                <MessageCircle size={16} /> Meddela mig
              </button>

            </div>
          </aside>

        </div>
      </div>
      {/* Mobil sticky CTA */}
      <div className={styles.pubprofile__mobile_cta}>
        <button className="btn btn-primary" onClick={handleContact}>
          <MessageCircle size={16} /> Skicka meddelande
        </button>
      </div>
    </div>
  )
}