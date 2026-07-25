'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  CheckCircle2,
  UserCircle,
  Wrench,
  MessageCircle,
  Star,
  BarChart3,
  FileText,
  Info,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import styles from './uf-foretag.module.scss'

const ufChecklist = [
  'Tillgång till kunder som söker dina tjänster',
  'Bygg ett recensionssystem och bevis på leverans',
  'Verklig försäljningsstatistik för er UF-rapport',
  'Professionell kundkommunikation via chatt',
  'Orderhistorik — perfekt för redovisning',
]

const stepsData = [
  {
    title: 'Skapa UF-konto',
    text: 'Registrera dig som UF-företag — det tar några minuter och kostar ingenting.',
  },
  {
    title: 'Lägg upp era tjänster',
    text: 'Beskriv vad ni erbjuder och sätt ert pris. Fast, per timme eller offert.',
  },
  {
    title: 'Ta emot uppdrag',
    text: 'Kunder hittar er och beställer. Ni godkänner och utför uppdraget.',
  },
  {
    title: 'Skicka faktura',
    text: 'Ni fakturerar kunden direkt med er UF-faktura — precis som vanligt.',
  },
]

const perksData = [
  {
    icon: UserCircle,
    title: 'Publik företagsprofil',
    text: 'Er egen profilsida med logotyp, beskrivning och alla era tjänster.',
  },
  {
    icon: Wrench,
    title: 'Obegränsat med tjänster',
    text: 'Lägg upp hur många tjänster ni vill inom alla kategorier — gratis.',
  },
  {
    icon: MessageCircle,
    title: 'Inbyggd chatt',
    text: 'Professionell kommunikation med kunder direkt i plattformen.',
  },
  {
    icon: Star,
    title: 'Recensioner',
    text: 'Samla äkta recensioner — perfekt att visa upp för UF-bedömningen.',
  },
  {
    icon: BarChart3,
    title: 'Försäljningsstatistik',
    text: 'Följ er omsättning och uppdragshistorik — bra underlag för UF-rapporten.',
  },
  {
    icon: FileText,
    title: 'Orderbekräftelse',
    text: 'Varje uppdrag dokumenteras — ni har alltid koll på vad som är avtalat.',
  },
]

export default function UfForetagContent() {
  const introRef = useRef<HTMLElement>(null)
  const stepsRef = useRef<HTMLElement>(null)
  const perksRef = useRef<HTMLElement>(null)
  const paymentRef = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLElement>(null)
  const checklistRef = useRef<HTMLUListElement>(null)
  const stepsContainerRef = useRef<HTMLDivElement>(null)
  const perksContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const sections = [
      introRef.current,
      stepsRef.current,
      perksRef.current,
      paymentRef.current,
      ctaRef.current,
    ].filter((el): el is HTMLElement => el !== null)

    const checklistEls = checklistRef.current
      ? Array.from(checklistRef.current.querySelectorAll<HTMLElement>('[data-animate]'))
      : []

    const stepEls = stepsContainerRef.current
      ? Array.from(stepsContainerRef.current.querySelectorAll<HTMLElement>('[data-animate]'))
      : []

    const perkEls = perksContainerRef.current
      ? Array.from(perksContainerRef.current.querySelectorAll<HTMLElement>('[data-animate]'))
      : []

    const allEls = [...sections, ...checklistEls, ...stepEls, ...perkEls]

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
          alt="UF-företag på Svippo"
          fill
          className={styles.hero__img}
          priority
        />
        <div className={styles.hero__overlay} />
        <div className={styles.hero__content}>
          <h1 className={styles.hero__title}>Ditt UF-företag förtjänar riktiga kunder</h1>
          <p className={styles.hero__ingress}>
            Svippo är det perfekta komplement till ditt UF-företag. Nå kunder direkt, ta riktiga uppdrag och bygg ditt varumärke — redan under UF-året.
          </p>
          <Link href="/register" className={styles.hero__cta}>
            Skapa UF-konto
          </Link>
        </div>
      </section>

      {/* 2. Svippo + UF */}
      <section
        ref={introRef}
        className={`${styles.section} ${styles.animate_hidden}`}
      >
        <div className={styles.container}>
          <div className={styles.intro}>
            <div className={styles.intro__text}>
              <span className={styles.tag}>Svippo + UF</span>
              <h2 className={styles.h2}>Det perfekta komplement till ditt UF-företag</h2>
              <p className={styles.body}>
                UF ger dig kunskapen och strukturen — Svippo ger dig kunderna. Tillsammans är det ett kraftfullt sätt att testa och växa ditt företag på riktigt.
              </p>
              <p className={styles.body}>
                På Svippo hittar du kunder som aktivt söker det du erbjuder. Inget kallt säljande, inga dyra annonser — bara direkta uppdrag.
              </p>
            </div>
            <div className={styles.intro__card}>
              <h3 className={styles.intro__card_title}>
                <CheckCircle2 size={20} className={styles.intro__card_title_icon} />
                Vad Svippo tillför ditt UF
              </h3>
              <ul className={styles.checklist} ref={checklistRef}>
                {ufChecklist.map((item, i) => (
                  <li
                    key={item}
                    data-animate="true"
                    className={`${styles.checklist__item} ${styles.animate_hidden}`}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <CheckCircle2 size={18} className={styles.checklist__icon} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Hur det fungerar */}
      <section
        ref={stepsRef}
        className={`${styles.section} ${styles.section__gray} ${styles.animate_hidden}`}
      >
        <div className={styles.container}>
          <h2 className={styles.h2_centered}>Kom igång på fyra steg</h2>
          <p className={styles.subtext_centered}>Enkelt, snabbt och helt gratis.</p>
          <div className={styles.steps} ref={stepsContainerRef}>
            {stepsData.map((step, i) => (
              <div
                key={step.title}
                data-animate="true"
                className={`${styles.steps__item} ${styles.animate_hidden}`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className={styles.steps__number_wrap}>
                  <div className={styles.steps__number}>{i + 1}</div>
                  {i < stepsData.length - 1 && <div className={styles.steps__connector} />}
                </div>
                <h3 className={styles.steps__title}>{step.title}</h3>
                <p className={styles.steps__text}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Det ingår */}
      <section
        ref={perksRef}
        className={`${styles.section} ${styles.animate_hidden}`}
      >
        <div className={styles.container}>
          <h2 className={styles.h2}>Det ingår som UF-företag</h2>
          <div className={styles.perks} ref={perksContainerRef}>
            {perksData.map((perk, i) => {
              const Icon = perk.icon
              return (
                <div
                  key={perk.title}
                  data-animate="true"
                  className={`${styles.perks__card} ${styles.animate_hidden}`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className={styles.perks__icon_wrap}>
                    <Icon size={22} className={styles.perks__icon} />
                  </div>
                  <h3 className={styles.perks__title}>{perk.title}</h3>
                  <p className={styles.perks__text}>{perk.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. Betalning */}
      <section
        ref={paymentRef}
        className={`${styles.section} ${styles.section__gray} ${styles.animate_hidden}`}
      >
        <div className={styles.container}>
          <span className={styles.tag}>Betalning</span>
          <h2 className={styles.h2}>Ni fakturerar som ett riktigt företag</h2>
          <p className={styles.body}>
            Som UF-företag skickar ni er egen faktura direkt till kunden — precis som ett vanligt företag. Svippo hanterar ingen betalning, men all prisöverenskommelse och orderbekräftelse sker via plattformen.
          </p>
          <div className={styles.info_box}>
            <Info size={20} className={styles.info_box__icon} />
            <p className={styles.info_box__text}>
              Orderbekräftelsen från Svippo är ett bra underlag för er fakturering och kan användas i er UF-redovisning.
            </p>
          </div>
        </div>
      </section>

      {/* 6. CTA */}
      <section
        ref={ctaRef}
        className={`${styles.cta_section} ${styles.animate_hidden}`}
      >
        <div className={styles.cta}>
          <h2 className={styles.cta__title}>Ge ditt UF-företag en flygande start</h2>
          <p className={styles.cta__body}>
            Skapa ett gratis UF-konto och börja ta riktiga uppdrag redan idag.
          </p>
          <Link href="/register" className={styles.cta__btn}>
            Skapa UF-konto
          </Link>
        </div>
      </section>
    </main>
  )
}
