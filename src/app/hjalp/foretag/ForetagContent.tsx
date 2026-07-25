'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Wrench,
  ShoppingCart,
  CheckCircle2,
  Rocket,
  FileText,
  Star,
  MessageCircle,
  ClipboardList,
  Receipt,
  Info,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import styles from './foretag.module.scss'

const sellChecklist = [
  'Kom igång direkt — ingen ansökan',
  'Ni fakturerar med er egen faktura',
  'Erbjud RUT/ROT om ni är anslutna',
  'Bygg ert varumärke med recensioner',
]

const buyChecklist = [
  'Tjänster i 8 kategorier',
  'Lägg upp förfrågningar',
  'Kommunicera via inbyggd chatt',
  'Håll koll på alla uppdrag',
]

const whyData = [
  {
    icon: Rocket,
    title: 'Kom igång direkt',
    text: 'Inget ansökningsförfarande. Skapa konto och börja sälja eller köpa direkt.',
  },
  {
    icon: FileText,
    title: 'Fakturera som vanligt',
    text: 'Ni använder er egen faktura — inga mellanhänder eller egenanställningstjänster.',
  },
  {
    icon: Star,
    title: 'Bygg ert varumärke',
    text: 'Samla recensioner och bygg ett starkt rykte direkt på plattformen.',
  },
  {
    icon: MessageCircle,
    title: 'Inbyggd kommunikation',
    text: 'All kontakt med kunder sker smidigt via Svippos chatt.',
  },
  {
    icon: ClipboardList,
    title: 'Orderhantering',
    text: 'Håll koll på alla uppdrag — aktiva, väntande och avslutade.',
  },
  {
    icon: Receipt,
    title: 'RUT & ROT',
    text: 'Erbjud RUT/ROT-avdrag till era kunder om ni är anslutna till Skatteverket.',
  },
]

export default function ForetagContent() {
  const waysRef = useRef<HTMLElement>(null)
  const whyRef = useRef<HTMLElement>(null)
  const paymentRef = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLElement>(null)
  const sellChecklistRef = useRef<HTMLUListElement>(null)
  const buyChecklistRef = useRef<HTMLUListElement>(null)
  const whyContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const sections = [
      waysRef.current,
      whyRef.current,
      paymentRef.current,
      ctaRef.current,
    ].filter((el): el is HTMLElement => el !== null)

    const sellEls = sellChecklistRef.current
      ? Array.from(sellChecklistRef.current.querySelectorAll<HTMLElement>('[data-animate]'))
      : []

    const buyEls = buyChecklistRef.current
      ? Array.from(buyChecklistRef.current.querySelectorAll<HTMLElement>('[data-animate]'))
      : []

    const whyEls = whyContainerRef.current
      ? Array.from(whyContainerRef.current.querySelectorAll<HTMLElement>('[data-animate]'))
      : []

    const allEls = [...sections, ...sellEls, ...buyEls, ...whyEls]

    if (prefersReducedMotion) {
      allEls.forEach(el => el.classList.add(styles.animate_visible))
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            ;(entry.target as HTMLElement).classList.add(styles.animate_visible)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    allEls.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <main>
      {/* 1. Hero */}
      <section className={styles.hero}>
        <Image
          src="/images/om-oss-hero.png"
          alt="Företag på Svippo"
          fill
          className={styles.hero__img}
          priority
        />
        <div className={styles.hero__overlay} />
        <div className={styles.hero__content}>
          <h1 className={styles.hero__title}>En plattform — oändliga möjligheter</h1>
          <p className={styles.hero__ingress}>
            Som företag på Svippo kan du både hitta hjälp och erbjuda dina tjänster. Kom igång direkt — utan ansökan.
          </p>
          <div className={styles.hero__buttons}>
            <Link href="/register" className={styles.hero__cta_primary}>
              Skapa företagskonto
            </Link>
            <Link href="/services" className={styles.hero__cta_outline}>
              Hitta en utförare
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Två sätt att använda Svippo */}
      <section
        ref={waysRef}
        className={`${styles.section} ${styles.animate_hidden}`}
      >
        <div className={styles.container}>
          <h2 className={styles.h2_centered}>Två sätt att använda Svippo</h2>
          <p className={styles.subtext_centered}>Välj ett eller använd båda — det är helt upp till dig.</p>
          <div className={styles.ways}>
            <div className={`${styles.way_card} ${styles.way_card__blue}`}>
              <Wrench size={26} className={styles.way_card__icon_blue} />
              <h3 className={styles.way_card__title_blue}>Sälj era tjänster</h3>
              <p className={styles.way_card__text}>
                Nå nya kunder direkt. Lägg upp era tjänster och ta emot beställningar — ni fakturerar själva som vanligt.
              </p>
              <ul className={styles.checklist} ref={sellChecklistRef}>
                {sellChecklist.map((item, i) => (
                  <li
                    key={item}
                    data-animate="true"
                    className={`${styles.checklist__item} ${styles.animate_hidden}`}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <CheckCircle2 size={18} className={styles.checklist__icon_blue} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${styles.way_card} ${styles.way_card__coral}`}>
              <ShoppingCart size={26} className={styles.way_card__icon_coral} />
              <h3 className={styles.way_card__title_coral}>Köp tjänster</h3>
              <p className={styles.way_card__text}>
                Hitta rätt hjälp snabbt. Sök bland utförare eller lägg upp en förfrågan och låt dem komma till er.
              </p>
              <ul className={styles.checklist} ref={buyChecklistRef}>
                {buyChecklist.map((item, i) => (
                  <li
                    key={item}
                    data-animate="true"
                    className={`${styles.checklist__item} ${styles.animate_hidden}`}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <CheckCircle2 size={18} className={styles.checklist__icon_coral} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Varför Svippo för företag */}
      <section
        ref={whyRef}
        className={`${styles.why} ${styles.animate_hidden}`}
      >
        <div className={styles.container}>
          <h2 className={styles.h2_dark}>Varför Svippo för företag?</h2>
          <p className={styles.subtext_dark}>Allt ni behöver — på ett ställe.</p>
          <div className={styles.why_grid} ref={whyContainerRef}>
            {whyData.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  data-animate="true"
                  className={`${styles.why_card} ${styles.animate_hidden}`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <Icon size={24} className={styles.why_card__icon} />
                  <h3 className={styles.why_card__title}>{item.title}</h3>
                  <p className={styles.why_card__text}>{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. Betalning */}
      <section
        ref={paymentRef}
        className={`${styles.section} ${styles.animate_hidden}`}
      >
        <div className={styles.container}>
          <span className={styles.tag}>Betalning</span>
          <h2 className={styles.h2}>Ni fakturerar som vanligt</h2>
          <p className={styles.body}>
            Till skillnad från privatpersoner behöver företag ingen egenanställningstjänst. Ni skickar er vanliga faktura direkt till kunden — precis som ni alltid gjort.
          </p>
          <div className={styles.info_box}>
            <Info size={20} className={styles.info_box__icon} />
            <p className={styles.info_box__text}>
              All prisöverenskommelse och orderbekräftelse sker via Svippo — det ger både er och kunden ett tydligt underlag för fakturering.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section
        ref={ctaRef}
        className={`${styles.cta_section} ${styles.animate_hidden}`}
      >
        <div className={styles.cta}>
          <h2 className={styles.cta__title}>Redo att komma igång?</h2>
          <p className={styles.cta__body}>
            Skapa ett gratis företagskonto idag och börja sälja eller hitta hjälp direkt.
          </p>
          <div className={styles.cta__buttons}>
            <Link href="/register" className={styles.cta__btn_primary}>
              Skapa företagskonto
            </Link>
            <Link href="/services" className={styles.cta__btn_outline}>
              Hitta en utförare
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
