'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Wallet,
  Grid3x3,
  MessageCircle,
  ClipboardList,
  Star,
  FileText,
  Info,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import styles from './bestallare.module.scss'

const stepsData = [
  {
    title: 'Sök eller lägg upp en förfrågan',
    text: 'Sök bland tjänster i 8 kategorier eller lägg upp en egen förfrågan och låt utförare höra av sig.',
  },
  {
    title: 'Välj din utförare',
    text: 'Läs recensioner, jämför priser och välj den som passar dig bäst.',
  },
  {
    title: 'Kommunicera och boka',
    text: 'Chatta direkt med utföraren via Svippo och kom överens om detaljer.',
  },
  {
    title: 'Följ ditt uppdrag',
    text: 'Håll koll på status, godkänn leverans och lämna en recension när du är nöjd.',
  },
]

const perksData = [
  {
    icon: Wallet,
    title: 'Gratis att använda',
    text: 'Det kostar ingenting att skapa konto och beställa tjänster på Svippo.',
  },
  {
    icon: Grid3x3,
    title: 'Tjänster i 8 kategorier',
    text: 'Från digitala tjänster till städning, biltjänster och flytthjälp.',
  },
  {
    icon: MessageCircle,
    title: 'Inbyggd chatt',
    text: 'Kommunicera direkt med utföraren utan att dela personliga kontaktuppgifter.',
  },
  {
    icon: ClipboardList,
    title: 'Orderhantering',
    text: 'Håll koll på alla dina uppdrag — aktiva, väntande och avslutade.',
  },
  {
    icon: Star,
    title: 'Recensionssystem',
    text: 'Läs äkta recensioner och lämna feedback efter avslutat uppdrag.',
  },
  {
    icon: FileText,
    title: 'Lägg upp förfrågningar',
    text: 'Beskriv vad du behöver och låt utförare höra av sig med prisförslag.',
  },
]

export default function BestallareContent() {
  const stepsRef = useRef<HTMLElement>(null)
  const perksRef = useRef<HTMLElement>(null)
  const rutRef = useRef<HTMLElement>(null)
  const requestRef = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLElement>(null)
  const stepsContainerRef = useRef<HTMLDivElement>(null)
  const perksContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const sections = [
      stepsRef.current,
      perksRef.current,
      rutRef.current,
      requestRef.current,
      ctaRef.current,
    ].filter((el): el is HTMLElement => el !== null)

    const stepEls = stepsContainerRef.current
      ? Array.from(stepsContainerRef.current.querySelectorAll<HTMLElement>('[data-animate]'))
      : []

    const perkEls = perksContainerRef.current
      ? Array.from(perksContainerRef.current.querySelectorAll<HTMLElement>('[data-animate]'))
      : []

    const allEls = [...sections, ...stepEls, ...perkEls]

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
          alt="Beställare på Svippo"
          fill
          className={styles.hero__img}
          priority
        />
        <div className={styles.hero__overlay} />
        <div className={styles.hero__content}>
          <h1 className={styles.hero__title}>
            Hitta <span className={styles.hero__highlight}>rätt hjälp</span>, <span className={styles.hero__highlight}>direkt</span>
          </h1>
          <p className={styles.hero__ingress}>
            Svippo är Sveriges marknadsplats för tjänster. Hitta rätt utförare, kommunicera enkelt och håll koll på ditt uppdrag — allt på ett ställe.
          </p>
          <Link href="/services" className={styles.hero__cta}>
            Hitta en utförare
          </Link>
        </div>
      </section>

      {/* 2. Hur det fungerar */}
      <section
        ref={stepsRef}
        className={`${styles.section} ${styles.animate_hidden}`}
      >
        <div className={styles.container}>
          <span className={styles.tagtop}>Hur det fungerar</span>
          <h2 className={styles.headh2}>Hitta hjälp på fyra steg</h2>
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

      {/* 3. Det ingår */}
      <section
        ref={perksRef}
        className={`${styles.section} ${styles.section__gray} ${styles.animate_hidden}`}
      >
        <div className={styles.container}>
          <h2 className={styles.h2}>Det ingår som beställare</h2>
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

      {/* 4. RUT-avdrag */}
      <section
        ref={rutRef}
        className={`${styles.section} ${styles.animate_hidden}`}
      >
        <div className={styles.container}>
          <span className={styles.tag}>RUT-avdrag</span>
          <h2 className={styles.h2}>Visste du att du kan få RUT-avdrag?</h2>
          <p className={styles.body}>
            Många hushållstjänster på Svippo — som städning, trädgårdsarbete och barnpassning — berättigar till RUT-avdrag. Det innebär att du kan få tillbaka upp till 50% av arbetskostnaden via Skatteverket. Prata med din utförare om RUT gäller för ditt uppdrag.
          </p>
          <div className={styles.info_box}>
            <Info size={20} className={styles.info_box__icon} />
            <p className={styles.info_box__text}>
              RUT-avdraget gäller för privatpersoner och vissa hushållsnära tjänster. Utföraren hanterar ansökan direkt med Skatteverket.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Förfrågningar */}
      <section
        ref={requestRef}
        className={`${styles.section} ${styles.section__gray} ${styles.animate_hidden}`}
      >
        <div className={styles.container}>
          <span className={styles.tag}>Förfrågningar</span>
          <h2 className={styles.h2}>Vet du inte vem du ska anlita? Lägg upp en förfrågan</h2>
          <p className={styles.body}>
            Istället för att leta efter rätt utförare kan du beskriva vad du behöver — så hör utförare av sig med prisförslag. Du väljer sedan vem du vill anlita.
          </p>
          <Link href="/create-request" className={styles.section_cta}>
            Lägg upp en förfrågan
          </Link>
        </div>
      </section>

      {/* 6. CTA */}
      <section
        ref={ctaRef}
        className={`${styles.cta_section} ${styles.animate_hidden}`}
      >
        <div className={styles.cta}>
          <h2 className={styles.cta__title}>Redo att hitta din nästa utförare?</h2>
          <p className={styles.cta__body}>
            Skapa ett gratis konto och kom igång på några minuter.
          </p>
          <Link href="/register" className={styles.cta__btn}>
            Kom igång gratis
          </Link>
        </div>
      </section>
    </main>
  )
}
