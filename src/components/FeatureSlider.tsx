import Image from 'next/image'
import Link from 'next/link'
import styles from './FeatureSlider.module.scss'

const CARDS = [
  {
    image: '/images/utforare-img.png',
    color: '#066696',
    tagBg: '#e6f1fb',
    tag: 'För utförare',
    title: 'Tjäna pengar på det du redan kan',
    subtitle: 'Sätt ditt eget pris, välj dina uppdrag och bygg ditt varumärke — helt gratis.',
    href: '/hjalp/svippare',
  },
  {
    image: '/images/om-oss-hero.png',
    color: '#e8541a',
    tagBg: '#fff0eb',
    tag: 'För beställare',
    title: 'Hitta rätt hjälp, direkt',
    subtitle: 'Sök bland tjänster i 8 kategorier eller lägg upp en förfrågan och låt utförare höra av sig.',
    href: '/hjalp/bestallare',
  },
  {
    image: '/images/company-hero.png',
    color: '#1C0E3D',
    tagBg: '#ece7f5',
    tag: 'För företag',
    title: 'En plattform — oändliga möjligheter',
    subtitle: 'Sälj era tjänster och hitta hjälp. Kom igång direkt utan ansökan.',
    href: '/hjalp/foretag',
  },
  {
    image: '/images/om-oss-hero.png',
    color: '#AF1143',
    tagBg: '#fdf2f5',
    tag: 'För UF-företag',
    title: 'Ge ditt UF-företag en flygande start',
    subtitle: 'Nå riktiga kunder och bygg ditt varumärke redan under UF-året.',
    href: '/hjalp/uf-foretag',
  },
]

export default function FeatureSlider() {
  return (
    <section className={styles.fs}>
      <div className={styles.fs__inner}>

        {/* Header */}
        <div className={styles.fs__header}>
          <h2 className={styles.fs__title}>Svippa på ditt sätt</h2>
        </div>

        {/* Grid */}
        <div className={styles.fs__grid}>
          {CARDS.map(card => (
            <Link key={card.href} href={card.href} className={styles.fs__card}>
              <Image
                src={card.image}
                alt={card.title}
                fill
                className={styles.fs__card_img}
              />
              <div className={styles.fs__card_overlay} />
              <div className={styles.fs__card_body}>
                <span className={styles.fs__card_tag} style={{ color: card.color, background: card.tagBg }}>
                  {card.tag}
                </span>
                <h3 className={styles.fs__card_title}>{card.title}</h3>
                <p className={styles.fs__card_subtitle}>{card.subtitle}</p>
                <span className={`${styles.fs__card_cta} btn-outline-white`}>Läs mer</span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}
