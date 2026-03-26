'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './FeatureSlider.module.scss'

const SLIDES = [
  {
    image: '/images/feature-1.png',
    label: 'Nyhet',
    title: 'Svippo 2.0',
    desc: 'Vi har byggt om plattformen från grunden – snabbare, smidigare och mer intuitiv än någonsin.',
    cta: 'Läs mer',
    href: '/tjanster',
  },
  {
    image: '/images/feature-2.png',
    label: 'Tips',
    title: 'Kom igång snabbt',
    desc: 'Skapa ditt konto, publicera din första tjänst och börja ta emot beställningar – allt på under 10 minuter.',
    cta: 'Skapa ett konto',
    href: '/registrera',
  },
  {
    image: '/images/feature-3.png',
    label: 'Inspiration',
    title: 'Svippa på ditt sätt',
    desc: 'Välj uppdrag som passar din vardag. Du bestämmer när, var och hur du jobbar.',
    cta: 'Utforska tjänster',
    href: '/tjanster',
  },
]

export default function FeatureSlider() {
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent(i => (i === 0 ? SLIDES.length - 1 : i - 1))
  const next = () => setCurrent(i => (i === SLIDES.length - 1 ? 0 : i + 1))

  return (
    <section className={styles.fs}>
      <div className={styles.fs__inner}>

        {/* Header */}
        <div className={styles.fs__header}>
          <h2 className={styles.fs__title}>Svippa på ditt sätt</h2>
          <div className={styles.fs__nav}>
            <button className={styles.fs__nav_btn} onClick={prev} aria-label="Föregående">
              ‹
            </button>
            <button className={styles.fs__nav_btn} onClick={next} aria-label="Nästa">
              ›
            </button>
          </div>
        </div>

        {/* Desktop – karusell med overflow */}
        <div className={styles.fs__track_wrap}>
          <div
            className={styles.fs__track}
            style={{ transform: `translateX(calc(${current} * -1 * (min(680px, 75vw) + 24px)))` }}
          >
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
                  <Link href={slide.href} className={styles.fs__card_cta}>
                    {slide.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobil – dots */}
        <div className={styles.fs__dots}>
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              className={`${styles.fs__dot} ${idx === current ? styles['fs__dot--active'] : ''}`}
              onClick={() => setCurrent(idx)}
              aria-label={`Gå till kort ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  )
}