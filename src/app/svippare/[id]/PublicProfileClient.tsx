'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './publicprofile.module.scss'

type UserProfile = {
  id: string
  name: string
  email: string
  phone?: string
  bio?: string
  created_at?: string
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
  services: Service[]
  reviews: Review[]
  avgRating: number | null
  userId: string
}

const NAV = [
  { id: 'tjanster', label: 'Mina tjänster' },
  { id: 'om-mig', label: 'Om mig' },
  { id: 'recensioner', label: 'Recensioner' },
  { id: 'kontakt', label: 'Kontakta' },
]

export default function PublicProfileClient({ profile, services, reviews, avgRating }: Props) {
  const [activeNav, setActiveNav] = useState('tjanster')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSent, setContactSent] = useState(false)

  // Highlighta aktiv sektion vid scroll
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
    <div className={styles.pubprofile}>

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
            {profile.created_at && (
              <span className={styles.pubprofile__member}>
                Medlem sedan {new Date(profile.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })}
              </span>
            )}
            <h1 className={styles.pubprofile__name}>{profile.name}</h1>
            {profile.bio && (
              <p className={styles.pubprofile__bio_short}>
                {profile.bio.slice(0, 120)}{profile.bio.length > 120 ? '...' : ''}
              </p>
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
          <button className="btn btn-primary" onClick={() => scrollTo('kontakt')}>
            💬 Kontakta mig
          </button>
        </div>
      </div>

      {/* Innehåll */}
      <div className="container">

        {/* Mina tjänster */}
        <section id="tjanster" className={styles.pubprofile__section}>
          <h2 className={styles.pubprofile__section_title}>Mina tjänster</h2>
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

        {/* Om mig */}
        <section id="om-mig" className={styles.pubprofile__section}>
          <h2 className={styles.pubprofile__section_title}>Om mig</h2>
          <div className={`${styles.pubprofile__about} card`}>
            {profile.bio ? (
              <p className={styles.pubprofile__about_text}>{profile.bio}</p>
            ) : (
              <p className={styles.pubprofile__empty_text}>Ingen beskrivning tillagd ännu.</p>
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
            <h2 className={styles.pubprofile__section_title}>Vill du komma i kontakt?</h2>
            <p className={styles.pubprofile__contact_text}>
              Fyll i formuläret så återkommer {profile.name} till dig så snart som möjligt.
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
            </div>
          </div>

          <div className={`${styles.pubprofile__contact_right} card`}>
            {contactSent ? (
              <div className={styles.pubprofile__contact_success}>
                <span>🎉</span>
                <strong>Meddelande skickat!</strong>
                <p>{profile.name} återkommer till dig snart.</p>
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
                  className="btn btn-primary w-full"
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
    </div>
  )
}