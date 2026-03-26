'use client'

import styles from './HowItWorks.module.scss'

const STEPS = [
  {
    image: '/images/how-it-works-1.png',
    title: 'Det startar med ett klick',
    desc: 'Sätt igång direkt. Inget organisationsnummer, inga avgifter. Bara dig, din kunskap och ditt konto.',
    bg: '#dbeafe',
    num: '01',
  },
  {
    image: '/images/how-it-works-2.png',
    title: 'Välj hur du vill Svippa',
    desc: 'Publicera ditt inlägg, bli synlig där beställarna finns och jobba efter dina preferenser.',
    bg: '#fce7f3',
    num: '02',
  },
  {
    image: '/images/how-it-works-3.png',
    title: 'Sen rullar pengarna in',
    desc: 'Sedan när uppdraget är utfört, rullar pengarna in, skattade & klara. Du bara… svippar vidare.',
    bg: '#dcfce7',
    num: '03',
  },
]

export default function HowItWorks() {
  return (
    <section className={styles.hiw}>
      <div className={`container ${styles.hiw__header}`}>
        <h2 className={styles.hiw__title}>Svippo i ett nötskal</h2>
      </div>

      <div className={styles.hiw__track_wrap}>
        <div className={styles.hiw__track}>
          {STEPS.map((step) => (
            <div key={step.num} className={styles.hiw__card}>
              <div className={styles.hiw__card_img_wrap} style={{ background: step.bg }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={step.image}
                  alt={step.title}
                  className={styles.hiw__card_img}
                />
              </div>
              <div className={styles.hiw__card_body}>
                <span className={styles.hiw__card_num}>{step.num}</span>
                <h3 className={styles.hiw__card_title}>{step.title}</h3>
                <p className={styles.hiw__card_desc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}