'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { categories as allCategories } from '@/data/categories'
import styles from './publicprofile.module.scss'

type UserProfile = {
  id: string
  name: string
  email: string
  phone?: string
  bio?: string
  account_type: string
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
function getSocialIcon(url: string): string {
  if (url.includes('instagram')) return '📸'
  if (url.includes('tiktok')) return '🎵'
  if (url.includes('facebook')) return '👤'
  if (url.includes('youtube')) return '▶️'
  if (url.includes('twitter') || url.includes('x.com')) return '𝕏'
  if (url.includes('snapchat')) return '👻'
  if (url.includes('linkedin')) return '💼'
  return '🔗'
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
  const [activeNav, setActiveNav] = useState('tjanster')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSent, setContactSent] = useState(false)

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
  const profileBadge = isUF
    ? '🎓 UF-företag'
    : isCompany
    ? '🏢 Företag'
    : '⚡ Svippare'

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

  const scrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 130
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <div className={`${styles.pubprofile} ${profileTypeClass}`}>

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
            🔗 Dela profil
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className={styles.pubprofile__hero}>
        <div className={`container ${styles.pubprofile__hero_inner}`}>
          <div className={styles.pubprofile__avatar}>
            {profile.name?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.pubprofile__hero_info}>
            <div className={styles.pubprofile__hero_top}>
              <span className={styles.pubprofile__badge}>{profileBadge}</span>
              {displayCity && (
                <span className={styles.pubprofile__location}>📍 {displayCity}</span>
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
                <strong>{avgRating !== null ? `⭐ ${avgRating}` : '–'}</strong>
                <span>Snittbetyg</span>
              </div>
            </div>
          </div>
          <button className={`btn btn-primary ${styles.pubprofile__contact_btn}`} onClick={() => scrollTo('kontakt')}>
            💬 Kontakta {isCompany || isUF ? 'oss' : 'mig'}
          </button>
        </div>
      </div>

      {/* USP-rad */}
      <div className={styles.pubprofile__usp}>
        <div className={`container ${styles.pubprofile__usp_inner}`}>
          {isSvippare && (
            <>
              <div className={styles.pubprofile__usp_item}><span>✅</span><span>Verifierad Svippare</span></div>
              <div className={styles.pubprofile__usp_item}><span>⚡</span><span>Snabbt svar</span></div>
              <div className={styles.pubprofile__usp_item}><span>⭐</span><span>{avgRating !== null ? `${avgRating} i snittbetyg` : 'Ny på Svippo'}</span></div>
            </>
          )}
          {isCompany && (
            <>
              <div className={styles.pubprofile__usp_item}><span>🏢</span><span>Verifierat företag</span></div>
              <div className={styles.pubprofile__usp_item}><span>📋</span><span>Professionella tjänster</span></div>
              <div className={styles.pubprofile__usp_item}><span>⭐</span><span>{avgRating !== null ? `${avgRating} i snittbetyg` : 'Nytt på Svippo'}</span></div>
            </>
          )}
          {isUF && (
            <>
              <div className={styles.pubprofile__usp_item}><span>🎓</span><span>UF-företag</span></div>
              <div className={styles.pubprofile__usp_item}><span>💡</span><span>Ungt entreprenörskap</span></div>
              <div className={styles.pubprofile__usp_item}><span>⭐</span><span>{avgRating !== null ? `${avgRating} i snittbetyg` : 'Nytt på Svippo'}</span></div>
            </>
          )}
        </div>
      </div>

      {/* Innehåll */}
      <div className="container">

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
                <Link href={`/tjanst/${s.id}`} key={s.id} className={`${styles.pubprofile__service} card`}>
                  <div className={styles.pubprofile__service_info}>
                    <span className={styles.pubprofile__service_category}>{s.subcategory}</span>
                    <h3 className={styles.pubprofile__service_title}>{s.title}</h3>
                    <span className={styles.pubprofile__service_location}>📍 {s.location}</span>
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
                <h3 className={styles.pubprofile__about_heading}>💼 Erfarenhet</h3>
                <p className={styles.pubprofile__about_text}>{svippareProfile.experience}</p>
              </div>
            )}

            {/* Org-nummer – endast företag/UF */}
            {(isCompany || isUF) && companyProfile?.org_number && (
              <div className={styles.pubprofile__about_block}>
                <h3 className={styles.pubprofile__about_heading}>🏛️ Organisationsnummer</h3>
                <p className={styles.pubprofile__about_text}>{companyProfile.org_number}</p>
              </div>
            )}

            {/* Webbplats */}
            {website && (
              <div className={styles.pubprofile__about_block}>
                <h3 className={styles.pubprofile__about_heading}>🌐 Webbplats</h3>
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.pubprofile__link}
                >
                  {website}
                </a>
              </div>
            )}

            {/* Sociala medier */}
            {socialLinks.length > 0 && (
              <div className={styles.pubprofile__about_block}>
                <h3 className={styles.pubprofile__about_heading}>📱 Sociala medier</h3>
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
              </div>
            )}
          </div>
        </section>

        {/* Recensioner */}
        <section id="recensioner" className={styles.pubprofile__section}>
          <h2 className={styles.pubprofile__section_title}>Recensioner</h2>
          {reviews.length === 0 ? (
            <div className={styles.pubprofile__empty}>
              <p>Inga recensioner ännu.</p>
            </div>
          ) : (
            <div className={styles.pubprofile__reviews}>
              {reviews.map(r => (
                <div key={r.id} className={`${styles.pubprofile__review} card`}>
                  <div className={styles.pubprofile__review_header}>
                    <strong>{r.reviewer_name}</strong>
                    <span>{'⭐'.repeat(r.rating)}</span>
                  </div>
                  <p>{r.comment}</p>
                  <span className={styles.pubprofile__review_date}>
                    {new Date(r.created_at).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Kontakt */}
        <section id="kontakt" className={`${styles.pubprofile__section} ${styles.pubprofile__contact_layout}`}>
          <div className={styles.pubprofile__contact_left}>
            <h2 className={styles.pubprofile__section_title}>
              {isCompany || isUF ? 'Kontakta oss' : 'Vill du komma i kontakt?'}
            </h2>
            <p className={styles.pubprofile__contact_text}>
              {isCompany || isUF
                ? `Fyll i formuläret så återkommer vi till dig så snart som möjligt.`
                : `Fyll i formuläret så återkommer ${profile.name} till dig så snart som möjligt.`
              }
            </p>
            <div className={styles.pubprofile__contact_info}>
              <div className={styles.pubprofile__contact_item}>
                <span>📧</span>
                <span>{profile.email}</span>
              </div>
              {profile.phone && (
                <div className={styles.pubprofile__contact_item}>
                  <span>📱</span>
                  <span>{profile.phone}</span>
                </div>
              )}
              {displayCity && (
                <div className={styles.pubprofile__contact_item}>
                  <span>📍</span>
                  <span>{displayCity}</span>
                </div>
              )}
            </div>
          </div>

          <div className={`${styles.pubprofile__contact_right} card`}>
            {contactSent ? (
              <div className={styles.pubprofile__contact_success}>
                <span>🎉</span>
                <strong>Meddelande skickat!</strong>
                <p>{isCompany || isUF ? 'Vi återkommer till dig snart.' : `${profile.name} återkommer till dig snart.`}</p>
              </div>
            ) : (
              <div className={styles.pubprofile__contact_form}>
                <div className="form-group">
                  <label className="form-label">Ditt namn</label>
                  <input className="form-input" placeholder="För- och efternamn" value={contactName} onChange={e => setContactName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">E-post</label>
                  <input className="form-input" placeholder="din@email.se" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Meddelande</label>
                  <textarea className="form-textarea" placeholder="Beskriv vad du behöver hjälp med..." value={contactMessage} onChange={e => setContactMessage(e.target.value)} rows={4} />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={!contactName || !contactEmail || !contactMessage}
                  onClick={() => setContactSent(true)}
                >
                  Skicka meddelande
                </button>
              </div>
            )}
          </div>
        </section>

      </div>
      {/* Mobil sticky CTA */}
      <div className={styles.pubprofile__mobile_cta}>
        <button className="btn btn-primary" onClick={() => scrollTo('kontakt')}>
          💬 Kontakta {isCompany || isUF ? 'oss' : 'mig'}
        </button>
      </div>
    </div>
  )
}