'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  User,
  Wrench,
  MessageCircle,
  ClipboardList,
  Star,
  BarChart3,
  Info,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import styles from './vara-svippare.module.scss'

const stepsData = [
  {
    title: 'Ansök om att bli Svippare',
    text: 'Fyll i din ansökan med dina färdigheter och erfarenheter. Vi granskar och godkänner dig inom kort — det är gratis.',
  },
  {
    title: 'Skapa dina tjänster',
    text: 'Lägg upp tjänster inom det du är bra på. Sätt ditt eget pris — fast, per timme eller offert.',
  },
  {
    title: 'Ta emot och utför uppdrag',
    text: 'Kunder hittar dig, beställer och du godkänner. All kommunikation och orderhantering sker direkt i Svippo.',
  },
  {
    title: 'Ta betalt lagligt och enkelt',
    text: 'Du fakturerar via en egenanställningstjänst — de sköter skatt och sociala avgifter åt dig. Inget eget företag krävs.',
  },
]

const perksData = [
  {
    icon: User,
    title: 'Publik profil',
    text: 'Din egen profilsida med bio, recensioner och alla dina tjänster.',
  },
  {
    icon: Wrench,
    title: 'Obegränsat antal tjänster',
    text: 'Lägg upp hur många tjänster du vill inom alla kategorier.',
  },
  {
    icon: MessageCircle,
    title: 'Inbyggd chatt',
    text: 'Kommunicera direkt med kunder utan att dela personliga kontaktuppgifter.',
  },
  {
    icon: ClipboardList,
    title: 'Orderhantering',
    text: 'Håll koll på alla dina uppdrag — aktiva, väntande och avslutade.',
  },
  {
    icon: Star,
    title: 'Recensioner',
    text: 'Bygg ditt rykte med äkta recensioner från dina kunder.',
  },
  {
    icon: BarChart3,
    title: 'Min karriär',
    text: 'Följ din utveckling, milstolpar och statistik direkt i din dashboard.',
  },
]

const paymentServices = [
  {
    name: 'Gigapay',
    text: 'Enkelt och populärt. Snabb utbetalning. Passar dig som precis kommit igång.',
  },
  {
    name: 'Invoiz',
    text: 'Ett av de billigaste alternativen på marknaden. Avgift ca 1,4%.',
  },
  {
    name: 'Worknode',
    text: 'Erbjuder FLEX och PRO-planer. Automatisk försäkring ingår.',
  },
  {
    name: 'Cool Company',
    text: 'Funnits sedan 2009. Inkluderar försäkringar och pensionsspar.',
  },
]

export default function VaraSvippareContent() {
  const stepsRef = useRef<HTMLElement>(null)
  const perksRef = useRef<HTMLElement>(null)
  const paymentRef = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLElement>(null)
  const stepsContainerRef = useRef<HTMLDivElement>(null)
  const perksContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const sections = [
      stepsRef.current,
      perksRef.current,
      paymentRef.current,
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
          src="/images/utforare-img.png"
          alt="Svippare i arbete"
          fill
          className={styles.hero__img}
          priority
        />
        <div className={styles.hero__overlay} />
        <div className={styles.hero__content}>
          <h1 className={styles.hero__title}>
            Tjäna pengar på det du <span className={styles.hero__highlight}>redan kan</span>
          </h1>
          <p className={styles.hero__ingress}>
            Som Svippare sätter du ditt eget pris, väljer dina egna uppdrag och bygger ditt varumärke — helt gratis.
          </p>
          <Link href="/become-svippare" className={styles.hero__cta}>
            Ansök om att bli Svippare
          </Link>
        </div>
      </section>

      {/* 2. Hur det fungerar */}
      <section
        ref={stepsRef}
        className={`${styles.section} ${styles.animate_hidden}`}
      >
        <div className={styles.container}>
          <span className={styles.tag}>Hur det fungerar</span>
          <h2 className={styles.heroh2}>Kom igång på fyra steg</h2>
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
          <h2 className={styles.h2}>Det ingår som Svippare</h2>
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

      {/* 4. Betalning */}
      <section
        ref={paymentRef}
        className={`${styles.section} ${styles.animate_hidden}`}
      >
        <div className={styles.container}>
          <span className={styles.tag}>Betalning</span>
          <h2 className={styles.h2}>Så tar du betalt — utan eget företag</h2>
          <p className={styles.body}>
            Som privatperson kan du inte bara ta emot Swish eller kontant för tjänster — det räknas som inkomst och måste redovisas korrekt. Lösningen är en egenanställningstjänst. Du fakturerar via dem och de sköter skatten åt dig.
          </p>
          <div className={styles.payment_grid}>
            {paymentServices.map(service => (
              <div key={service.name} className={styles.payment_card}>
                <h3 className={styles.payment_card__title}>{service.name}</h3>
                <p className={styles.payment_card__text}>{service.text}</p>
              </div>
            ))}
          </div>
          <div className={styles.warning}>
            <Info size={20} className={styles.warning__icon} />
            <p className={styles.warning__text}>
              <strong>Kom ihåg:</strong> Swish, kontant och liknande utan redovisning är olagligt. Använd alltid en egenanställningstjänst för att ta betalt lagligt och enkelt.
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
          <h2 className={styles.cta__title}>Redo att ta ditt första uppdrag?</h2>
          <p className={styles.cta__body}>
            Ansök om att bli Svippare idag — det är gratis och tar bara några minuter.
          </p>
          <Link href="/become-svippare" className={styles.cta__btn}>
            Ansök nu
          </Link>
        </div>
      </section>
    </main>
  )
}
