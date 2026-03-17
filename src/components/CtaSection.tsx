import Link from 'next/link'
import styles from './CtaSection.module.scss'

export default function CtaSection() {
  return (
    <section className={styles.cta}>
      <div className={`container ${styles.cta__inner}`}>

        <div className={`${styles.cta__card} ${styles['cta__card--seller']}`}>
          <div className={styles.cta__card_content}>
            <span className={styles.cta__badge}>Bli Svippare</span>
            <h2 className={styles.cta__title}>Sälj dina tjänster</h2>
            <p className={styles.cta__text}>
              Skapa ett konto, publicera dina tjänster och börja tjäna pengar – helt gratis.
            </p>
            <Link href="/registrera" className="btn btn-primary">Bli Svippare direkt →</Link>
          </div>
          <div className={styles.cta__illustration}>🧑‍💻</div>
        </div>

        <div className={`${styles.cta__card} ${styles['cta__card--buyer']}`}>
          <div className={styles.cta__card_content}>
            <span className={`${styles.cta__badge} ${styles['cta__badge--orange']}`}>Hitta hjälp</span>
            <h2 className={styles.cta__title}>Få hjälp i din vardag</h2>
            <p className={styles.cta__text}>
              Hitta pålitliga personer nära dig som kan hjälpa dig med precis det du behöver.
            </p>
            <Link href="/tjanster" className="btn btn-orange">Utforska tjänster →</Link>
          </div>
          <div className={styles.cta__illustration}>🛠️</div>
        </div>

      </div>

      {/* Nedre CTA */}
      <div className={styles.cta__bottom}>
        <div className={`container ${styles.cta__bottom_inner}`}>
          <h2 className={styles.cta__bottom_title}>
            Skapa ett konto helt gratis idag<br />
            och bli en del av familjen
          </h2>
          <p className={styles.cta__bottom_text}>
            Upptäck hur enkelt det är att förvandla dina projekt eller uppgifter till
            verklighet med hjälp av en Svippare.
          </p>
          <div className={styles.cta__bottom_actions}>
            <Link href="/registrera" className="btn btn-primary">Skapa ett konto</Link>
            <Link href="/tjanster" className="btn btn-outline-white">Utforska tjänster</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
