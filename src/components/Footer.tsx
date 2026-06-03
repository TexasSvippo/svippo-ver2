import Link from 'next/link'
import { Mail, Phone, Clock } from 'lucide-react'
import styles from './Footer.module.scss'

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.52V6.73a4.85 4.85 0 0 1-1.02-.04z" />
    </svg>
  )
}

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
      <div className={styles.inner}>

        {/* Brand column */}
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/Svippo-vit.svg" alt="Svippo" className={styles.logo} />
          <p className={styles.tagline}>
            Där drömmar går i uppfyllelse. Sveriges marknadsplats för tjänster.
          </p>
          <div className={styles.socials}>
            <a href="https://www.instagram.com/svippo.se/" target="_blank" rel="noopener noreferrer" className={styles.social_btn} aria-label="Instagram">
              <InstagramIcon size={15} />
            </a>
            <a href="https://www.facebook.com/Svippo/" target="_blank" rel="noopener noreferrer" className={styles.social_btn} aria-label="Facebook">
              <FacebookIcon size={15} />
            </a>
            <a href="https://www.tiktok.com/@svippo.se" target="_blank" rel="noopener noreferrer" className={styles.social_btn} aria-label="TikTok">
              <TikTokIcon size={15} />
            </a>
            <a href="https://se.linkedin.com/posts/svippo-ab_svippo-tj%C3%A4nsterp%C3%A5dinavillkor-entrepren%C3%B6rskap-activity-7282415706032254976-YG-K" target="_blank" rel="noopener noreferrer" className={styles.social_btn} aria-label="LinkedIn">
              <LinkedInIcon size={15} />
            </a>
          </div>
        </div>

        {/* Svippo */}
        <div className={styles.col}>
          <h4 className={styles.heading}>Svippo</h4>
          <Link href="/om-oss">Om oss</Link>
          <Link href="/var-historia">Vår historia</Link>
          <Link href="/blogg">Blogg</Link>
        </div>

        {/* Tjänster */}
        <div className={styles.col}>
          <h4 className={styles.heading}>Tjänster</h4>
          <Link href="/services?kategori=digitala-tjanster">Digitala tjänster</Link>
          <Link href="/services?kategori=medie-design">Medie &amp; design</Link>
          <Link href="/services?kategori=utbildning">Utbildning</Link>
          <Link href="/services?kategori=hushall">Hushållstjänster</Link>
          <Link href="/services?kategori=bil">Biltjänster</Link>
          <Link href="/services?kategori=skonhet-halsa">Skönhet &amp; hälsa</Link>
          <Link href="/services?kategori=bygg-hantverk">Bygg &amp; hantverk</Link>
          <Link href="/services?kategori=frakt-flytt">Frakt &amp; flytt</Link>
        </div>

        {/* Svippo hjälp */}
        <div className={styles.col}>
          <h4 className={styles.heading}>Svippo hjälp</h4>
          <Link href="/hjalp/svippare">Vara svippare</Link>
          <Link href="/hjalp/bestallare">Vara beställare</Link>
          <Link href="/hjalp/foretag">Vara företag</Link>
          <Link href="/faq">FAQ</Link>
        </div>

        {/* Kontakt */}
        <div className={styles.col}>
          <h4 className={styles.heading}>Kontakt</h4>
          <a href="mailto:kontakt@svippo.se" className={styles.contact_link}>
            <Mail size={14} /> kontakt@svippo.se
          </a>
          <a href="tel:020105707" className={styles.contact_link}>
            <Phone size={14} /> 020-105 707
          </a>
          <div className={styles.opening}>
            <span className={styles.opening_label}><Clock size={13} /> Öppettider</span>
            <span className={styles.opening_hours}>Mån–fre 09–17</span>
          </div>
        </div>

      </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className={`container ${styles.bottom_inner}`}>
          <span>© {new Date().getFullYear()} Svippo. Alla rättigheter förbehållna.</span>
          <div className={styles.bottom_links}>
            <Link href="/integritetspolicy">Integritetspolicy</Link>
            <Link href="/villkor">Användarvillkor</Link>
            <Link href="/cookie-policy">Cookie-policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
