import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import styles from './om-oss.module.scss'

export const metadata = {
  title: 'Om oss – Svippo',
  description: 'Lär känna Svippo — historien bakom plattformen och teamet som bygger den.',
}

const timelineItems = [
  {
    year: '2021',
    title: 'Idén föds',
    text: 'Ett samtal från Margareta sätter igång allt. Vi börjar skissa på vad Svippo skulle kunna vara.',
  },
  {
    year: '2022–2023',
    title: 'Bygget börjar',
    text: 'Vi bygger de första versionerna, testar, misslyckas och börjar om. En lång och tuff resa tar vid.',
  },
  {
    year: '2026',
    title: 'Svippo lanseras',
    text: 'Vi öppnar dörrarna. Vi är i uppstartsfasen och vill bygga Svippo tillsammans med dig.',
  },
  {
    year: 'Framtiden',
    title: 'Din input formar Svippo',
    text: 'Vi lyssnar på varje användare. Det är du som avgör vart vi tar vägen härnäst.',
  },
]

const checklistItems = [
  'Inget startkapital krävs — kom igång direkt',
  'Din profil är ditt varumärke — bygg det på Svippo',
  'Kunder, kommunikation och orders — allt på ett ställe',
  'Byggt tillsammans med användarna — vi lyssnar',
]

export default function OmOssPage() {
  return (
    <main>
      {/* 1. Hero */}
      <section className={styles.hero}>
        <Image
          src="/images/om-oss-hero.png"
          alt="Svippo team"
          fill
          className={styles.hero__img}
          priority
        />
        <div className={styles.hero__overlay} />
        <div className={styles.hero__content}>
          <h1 className={styles.hero__title}>Om oss</h1>
          <p className={styles.hero__ingress}>
            Svippo är en svensk tjänstemarknadsplats skapad för att göra det enklare att hitta hjälp — och enklare att ta steget som egen utförare.
          </p>
        </div>
      </section>

      {/* 2. Historia */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.two_col}>
            <div className={styles.two_col__text}>
              <span className={styles.tag}>Historien bakom Svippo</span>
              <h2 className={styles.h2}>Det började med ett telefonsamtal från Margareta</h2>
              <p className={styles.body}>
                Det var 2021. Snön hade precis fallit och telefonen ringde. Det var Margareta — en äldre dam som vi länge hade hjälpt med allt från gräsklippning till skottning. Hon undrade om vår kompis Lukas kunde komma och hjälpa till. Men den här gången hade Lukas studier och inte tid.
              </p>
              <blockquote className={styles.quote}>
                <p>&ldquo;Varför finns det ingen plats där Margareta enkelt kan hitta sin nästa Lukas?&rdquo;</p>
                <cite>— Tanken som startade allt</cite>
              </blockquote>
              <p className={styles.body}>
                Ur den frågan föddes Svippo. En plattform där den som behöver hjälp enkelt kan hitta rätt person, och där den som vill tjäna pengar på sina färdigheter kan göra det utan krångel. Det har varit en lång och tuff resa — men varje steg har drivits av den enkla tanken om att göra vardagen lite enklare för alla.
              </p>
            </div>
            <div className={styles.two_col__img_wrap}>
              <Image
                src="/images/om-oss-team.png"
                alt="Svippo-teamet"
                fill
                className={styles.two_col__img}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Vision */}
      <section className={styles.vision}>
        <div className={styles.container}>
          <span className={styles.tag_light}>Vår vision</span>
          <h2 className={styles.h2_light}>Alla ska kunna ta steget — utan att betala skjortan</h2>
          <p className={styles.body_light}>
            Vi vill göra det möjligt för vem som helst att testa sina färdigheter, bygga ett eget varumärke och ta steget som egen företagare. Utan dyra startkostnader, utan kontakter, utan krångel. Svippo är din plattform — oavsett om du är 18 eller 58.
          </p>
        </div>
      </section>

      {/* 4. Varför Svippo */}
      <section className={styles.section}>
        <div className={styles.container}>
          {/* image is first in DOM → left column on desktop; reordered below text on mobile */}
          <div className={`${styles.two_col} ${styles.two_col__reversed}`}>
            <div className={styles.two_col__img_wrap}>
              <Image
                src="/images/om-oss-utforare.png"
                alt="Utförare på Svippo"
                fill
                className={styles.two_col__img}
              />
            </div>
            <div className={styles.two_col__text}>
              <span className={styles.tag}>Varför vi byggde Svippo</span>
              <h2 className={styles.h2}>Allting är för splittrat — vi vill samla det</h2>
              <p className={styles.body}>
                Att starta ett företag idag kräver kontakter, pengar och tid. Hemsida, marknadsföring, CRM, bokföring, RUT, skatt — listan slutar aldrig. Vi byggde Svippo för att sudda ut den linjen.
              </p>
              <ul className={styles.checklist}>
                {checklistItems.map(item => (
                  <li key={item} className={styles.checklist__item}>
                    <CheckCircle2 size={18} className={styles.checklist__icon} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Timeline */}
      <section className={`${styles.section} ${styles.section__gray}`}>
        <div className={styles.container}>
          <span className={styles.tag}>Vår resa</span>
          <h2 className={styles.h2}>Från idé till plattform</h2>
          <div className={styles.timeline}>
            {timelineItems.map((item, i) => (
              <div key={item.year} className={styles.timeline__item}>
                <div className={styles.timeline__marker}>
                  <div className={styles.timeline__dot} />
                  {i < timelineItems.length - 1 && <div className={styles.timeline__line} />}
                </div>
                <div className={styles.timeline__content}>
                  <span className={styles.timeline__year}>{item.year}</span>
                  <h3 className={styles.timeline__title}>{item.title}</h3>
                  <p className={styles.timeline__text}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <h2 className={styles.h2}>Var med och forma Svippo</h2>
          <p className={styles.cta__body}>
            Vi är i uppstartsfasen och bygger plattformen tillsammans med våra användare. Din feedback är guld värd.
          </p>
          <div className={styles.cta__buttons}>
            <Link href="/services" className={styles.cta__btn_primary}>Hitta en utförare</Link>
            <Link href="/become-svippare" className={styles.cta__btn_outline}>Bli Svippare</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
