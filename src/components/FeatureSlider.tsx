'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import styles from './FeatureSlider.module.scss'

const SLIDES = [
  {
    image: '/images/utforare-img.png',
    label: 'För utförare',
    title: 'Tjäna pengar på det du redan kan',
    desc: 'Sätt ditt eget pris, välj dina uppdrag och bygg ditt varumärke — helt gratis.',
    cta: 'Läs mer',
    href: '/hjalp/svippare',
  },
  {
    image: '/images/om-oss-hero.png',
    label: 'För beställare',
    title: 'Hitta rätt hjälp, direkt',
    desc: 'Sök bland tjänster i 8 kategorier eller lägg upp en förfrågan och låt utförare höra av sig.',
    cta: 'Läs mer',
    href: '/hjalp/bestallare',
  },
  {
    image: '/images/company-hero.png',
    label: 'För företag',
    title: 'En plattform — oändliga möjligheter',
    desc: 'Sälj era tjänster och hitta hjälp. Kom igång direkt utan ansökan.',
    cta: 'Läs mer',
    href: '/hjalp/foretag',
  },
  {
    image: '/images/uf-foretagare.jpg',
    label: 'För UF-företag',
    title: 'Ge ditt UF-företag en flygande start',
    desc: 'Nå riktiga kunder och bygg ditt varumärke redan under UF-året.',
    cta: 'Läs mer',
    href: '/hjalp/uf-foretag',
  },
]

export default function FeatureSlider() {
  const [current, setCurrent] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  // Distance between the start of one card and the start of the next,
  // computed from the actual rendered positions so it works on all breakpoints.
  const getStep = useCallback(() => {
    const track = trackRef.current?.firstElementChild as HTMLElement | null
    const c0 = track?.children[0] as HTMLElement | undefined
    const c1 = track?.children[1] as HTMLElement | undefined
    if (c0 && c1) {
      return c1.getBoundingClientRect().left - c0.getBoundingClientRect().left
    }
    return c0?.getBoundingClientRect().width ?? 0
  }, [])

  const prev = () => trackRef.current?.scrollBy({ left: -getStep(), behavior: 'smooth' })
  const next = () => trackRef.current?.scrollBy({ left:  getStep(), behavior: 'smooth' })

  const handleScroll = useCallback(() => {
    const el = trackRef.current
    const step = getStep()
    if (!el || step === 0) return
    // When the container can't scroll all the way to the last snap point
    // (not enough overflow), detect end-of-scroll and force the last index.
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
      setCurrent(SLIDES.length - 1)
      return
    }
    setCurrent(Math.round(el.scrollLeft / step))
  }, [getStep])

  return (
    <section className={styles.fs}>
      <div className={styles.fs__inner}>

        {/* Header */}
        <div className={styles.fs__header}>
          <h2 className={styles.fs__title}>Svippa på ditt sätt</h2>
          <div className={styles.fs__nav}>
            <button className={styles.fs__nav_btn} onClick={prev} aria-label="Föregående">‹</button>
            <button className={styles.fs__nav_btn} onClick={next} aria-label="Nästa">›</button>
          </div>
        </div>

        {/* Track */}
        <div className={styles.fs__track_wrap} ref={trackRef} onScroll={handleScroll}>
          <div className={styles.fs__track}>
            {SLIDES.map((slide, idx) => (
              <div
                key={idx}
                className={`${styles.fs__card} ${idx === current ? styles['fs__card--active'] : ''}`}
              >
                <div className={styles.fs__card_img_wrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slide.image} alt={slide.title} className={styles.fs__card_img} />
                </div>
                <div className={styles.fs__card_body}>
                  <span className={styles.fs__card_label}>{slide.label}</span>
                  <h3 className={styles.fs__card_title}>{slide.title}</h3>
                  <p className={styles.fs__card_desc}>{slide.desc}</p>
                  <Link href={slide.href} className={styles.fs__card_cta}>{slide.cta}</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots – mobil */}
        <div className={styles.fs__dots}>
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              className={`${styles.fs__dot} ${idx === current ? styles['fs__dot--active'] : ''}`}
              onClick={() => {
                const el = trackRef.current
                if (!el) return
                el.scrollTo({ left: idx * getStep(), behavior: 'smooth' })
                setCurrent(idx)
              }}
              aria-label={`Gå till kort ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
