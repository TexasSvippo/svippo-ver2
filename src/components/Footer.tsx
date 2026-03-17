import Link from 'next/link'
import Image from 'next/image'
import styles from './Footer.module.scss'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footer__inner}`}>

        {/* Logga & slogan */}
        <div className={styles.footer__brand}>
          <Image src="/logo.svg" alt="Svippo" width={100} height={32} />
          <p className={styles.footer__slogan}>Där drömmar går i uppfyllelse</p>
        </div>

        {/* Kolumner */}
        <div className={styles.footer__columns}>

          <div className={styles.footer__column}>
            <h4 className={styles.footer__heading}>Svippo</h4>
            <Link href="/om-oss">Om oss</Link>
            <Link href="/var-historia">Vår historia</Link>
            <Link href="/blogg">Blogg</Link>
          </div>

          <div className={styles.footer__column}>
            <h4 className={styles.footer__heading}>Tjänster</h4>
            <Link href="/tjanster/digitala">Digitala tjänster</Link>
            <Link href="/tjanster/medie-design">Medie och design</Link>
            <Link href="/tjanster/utbildning">Utbildning</Link>
            <Link href="/tjanster/hushall">Hushållstjänster</Link>
            <Link href="/tjanster/bil">Biltjänster</Link>
            <Link href="/tjanster/skonhet">Skönhet och hälsa</Link>
          </div>

          <div className={styles.footer__column}>
            <h4 className={styles.footer__heading}>Svippo hjälp</h4>
            <Link href="/hjalp/svippare">Vara svippare</Link>
            <Link href="/hjalp/bestallare">Vara beställare</Link>
            <Link href="/hjalp/foretag">Vara företag</Link>
            <Link href="/faq">FAQ</Link>
          </div>

          <div className={styles.footer__column}>
            <h4 className={styles.footer__heading}>Kontakt</h4>
            <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a>
            <a href="tel:020105707">020-105 707</a>
          </div>

        </div>
      </div>

      {/* Botten */}
      <div className={styles.footer__bottom}>
        <div className={`container ${styles.footer__bottom_inner}`}>
          <span>© {new Date().getFullYear()} Svippo. Alla rättigheter förbehållna.</span>
          <div className={styles.footer__bottom_links}>
            <Link href="/integritetspolicy">Integritetspolicy</Link>
            <Link href="/villkor">Användarvillkor</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
