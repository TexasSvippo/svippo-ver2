'use client'

import Link from 'next/link'
import { ChevronDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import styles from './faq.module.scss'

type Question = { q: string; a: string }
type Section = { title: string; questions: Question[] }

const faqData: Section[] = [
  {
    title: 'Generellt',
    questions: [
      {
        q: 'Vad är Svippo?',
        a: 'Svippo är en svensk digital marknadsplats som kopplar ihop den som söker hjälp med den som kan utföra jobbet. Du kan hitta utförare inom allt från städning och webbutveckling till biltjänster och flytthjälp — eller erbjuda dina egna tjänster.',
      },
      {
        q: 'Hur skapar jag ett konto?',
        a: "Klicka på 'Skapa konto' i navigeringen. Välj om du är privatperson, företag eller UF-företag, fyll i dina uppgifter och välj om du vill registrera dig med e-post eller Google.",
      },
      {
        q: 'Vad kostar det att använda Svippo?',
        a: 'Det är helt gratis att skapa konto och använda Svippo — oavsett om du är beställare, Svippare eller företag. Svippo tar ingen provision på uppdrag.',
      },
      {
        q: 'Hur kontaktar jag support?',
        a: 'Du når oss på kontakt@svippo.se eller via telefon 020-105 707, måndag–fredag 09–17. Du kan också använda kontaktformuläret på vår kontaktsida.',
      },
    ],
  },
  {
    title: 'För beställare',
    questions: [
      {
        q: 'Hur hittar jag en utförare?',
        a: 'Sök bland tjänster via sökfältet eller bläddra bland våra 8 kategorier. Du kan också lägga upp en förfrågan och låta utförare höra av sig med prisförslag.',
      },
      {
        q: 'Hur lägger jag upp en förfrågan?',
        a: "Logga in och klicka på 'Skapa inlägg' i navigeringen. Beskriv vad du behöver, sätt en budget och välj kategori. Utförare som är intresserade hör av sig direkt.",
      },
      {
        q: 'Hur betalar jag för en tjänst?',
        a: 'Betalning sker direkt mellan dig och utföraren — utanför Svippo. Ni kommer överens om betalningssätt och tidpunkt. Svippo hanterar ingen betalning men dokumenterar alla prisöverenskommelser.',
      },
      {
        q: 'Vad händer om jag inte är nöjd med utfört arbete?',
        a: 'Om du och utföraren inte kan lösa det sinsemellan kan du kontakta Svippo på kontakt@svippo.se för medling. Vi kan granska kommunikation och orderhistorik som stöd. Svippo fattar inga bindande beslut men agerar som neutral part.',
      },
      {
        q: 'Kan jag få RUT-avdrag?',
        a: 'Ja, för många hushållstjänster som städning, trädgårdsarbete och barnpassning kan du få RUT-avdrag på upp till 50% av arbetskostnaden. Prata med din utförare om RUT gäller för ditt uppdrag.',
      },
    ],
  },
  {
    title: 'För Svippare',
    questions: [
      {
        q: 'Hur ansöker jag om att bli Svippare?',
        a: "Klicka på 'Bli Svippare' i din profil eller i navigeringen. Fyll i din ansökan med dina färdigheter och erfarenheter. Vi granskar och återkommer med besked inom kort.",
      },
      {
        q: 'Vem kan bli Svippare?',
        a: 'Svippare är för privatpersoner som vill erbjuda tjänster och tjäna pengar på sina färdigheter. Du måste vara minst 18 år. Företag och UF-företag behöver inte ansöka — de kan sälja tjänster direkt.',
      },
      {
        q: 'Hur tar jag betalt lagligt som privatperson?',
        a: 'Som privatperson kan du inte ta emot Swish eller kontant utan att redovisa det — det räknas som inkomst. Lösningen är en egenanställningstjänst som Gigapay, Invozio, Worknode eller Cool Company. De hanterar skatt och sociala avgifter åt dig. Läs mer på vår sida om att vara Svippare.',
      },
      {
        q: 'Hur sätter jag mitt pris?',
        a: 'Du väljer själv om du vill ta fast pris, timpris eller begära in offert per uppdrag. Du kan ändra dina priser när som helst direkt i din tjänstannons.',
      },
      {
        q: 'Hur fungerar recensioner?',
        a: 'Efter ett avslutat uppdrag kan beställaren lämna en recension och ett betyg. Recensionerna syns på din publika profil och hjälper dig bygga förtroende hos nya kunder.',
      },
    ],
  },
  {
    title: 'För företag & UF',
    questions: [
      {
        q: 'Hur skiljer sig företagskontot från ett privatpersonskonto?',
        a: 'Företag och UF-företag kan sälja tjänster direkt utan att ansöka om att bli Svippare. Ni fakturerar också med er egen faktura — ingen egenanställningstjänst behövs.',
      },
      {
        q: 'Kan vi erbjuda RUT/ROT som företag?',
        a: 'Ja, om ert företag är anslutet till Skatteverkets RUT/ROT-system kan ni erbjuda detta till era kunder. Ni hanterar ansökan direkt med Skatteverket.',
      },
      {
        q: 'Hur fakturerar vi som företag?',
        a: 'Ni skickar er vanliga faktura direkt till kunden efter avslutat uppdrag. All prisöverenskommelse och orderbekräftelse sker via Svippo och utgör ett bra underlag för fakturering.',
      },
      {
        q: 'Vad är skillnaden mellan företag och UF-företag på Svippo?',
        a: 'Funktionsmässigt fungerar det likadant — båda kan sälja tjänster direkt och fakturerar själva. UF-företag har dessutom tillgång till orderhistorik och försäljningsstatistik som är användbar i UF-rapportering och redovisning.',
      },
    ],
  },
  {
    title: 'Konto & säkerhet',
    questions: [
      {
        q: 'Hur ändrar jag mitt lösenord?',
        a: "Logga in och gå till Profilinställningar. Där kan du byta lösenord. Om du glömt ditt lösenord klickar du på 'Glömt lösenordet?' på inloggningssidan så skickar vi en återställningslänk till din e-post.",
      },
      {
        q: 'Hur raderar jag mitt konto?',
        a: 'Kontakta oss på kontakt@svippo.se så behandlar vi din begäran inom 10 arbetsdagar. Dina personuppgifter raderas i enlighet med vår integritetspolicy, med undantag för uppgifter vi är skyldiga att bevara enligt lag.',
      },
      {
        q: 'Hur hanterar Svippo mina personuppgifter?',
        a: 'Svippo hanterar dina personuppgifter i enlighet med GDPR. Läs vår integritetspolicy på svippo.se/integritetspolicy för fullständig information om hur vi samlar in, lagrar och använder dina uppgifter.',
      },
      {
        q: 'Är mina uppgifter säkra på Svippo?',
        a: 'Ja. Svippo använder krypterad datatransmission (HTTPS/TLS), krypterad lösenordslagring och säker hosting via Vercel. Lösenord lagras aldrig i klartext.',
      },
    ],
  },
]

export default function FAQContent() {
  const [search, setSearch] = useState('')
  const [openMap, setOpenMap] = useState<Record<string, string | null>>({})

  const toggleQuestion = (section: string, question: string) => {
    setOpenMap(prev => ({
      ...prev,
      [section]: prev[section] === question ? null : question,
    }))
  }

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return faqData

    return faqData
      .map(section => ({
        ...section,
        questions: section.questions.filter(
          ({ q, a }) => q.toLowerCase().includes(query) || a.toLowerCase().includes(query)
        ),
      }))
      .filter(section => section.questions.length > 0)
  }, [search])

  const hasResults = filteredSections.some(section => section.questions.length > 0)

  return (
    <main>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.hero__inner}>
          <h1 className={styles.hero__title}>Vanliga frågor</h1>
          <p className={styles.hero__subtext}>Svar på det mesta — annars hjälper vi dig.</p>
          <div className={styles.search}>
            <Search size={18} className={styles.search__icon} />
            <input
              type="text"
              className={styles.search__input}
              placeholder="Sök bland frågor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* FAQ sections */}
      <section className={styles.faq_section}>
        <div className={styles.container}>
          {!hasResults && (
            <p className={styles.no_results}>Inga frågor matchade din sökning.</p>
          )}

          {filteredSections.map(section => (
            <div key={section.title} className={styles.group}>
              <h2 className={styles.group__title}>{section.title}</h2>
              <div className={styles.group__questions}>
                {section.questions.map(item => {
                  const isOpen = openMap[section.title] === item.q
                  return (
                    <div key={item.q} className={styles.question}>
                      <button
                        type="button"
                        className={`${styles.question__row} ${isOpen ? styles['question__row--active'] : ''}`}
                        onClick={() => toggleQuestion(section.title, item.q)}
                        aria-expanded={isOpen}
                      >
                        <span className={styles.question__text}>{item.q}</span>
                        <ChevronDown
                          size={18}
                          className={`${styles.question__chevron} ${isOpen ? styles['question__chevron--open'] : ''}`}
                        />
                      </button>
                      <div className={`${styles.question__answer_wrap} ${isOpen ? styles['question__answer_wrap--open'] : ''}`}>
                        <div className={styles.question__answer_inner}>
                          <p className={styles.question__answer_text}>{item.a}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta_section}>
        <div className={styles.container}>
          <div className={styles.cta}>
            <h2 className={styles.cta__title}>Hittade du inte svaret?</h2>
            <p className={styles.cta__text}>
              Kontakta oss på kontakt@svippo.se eller ring 020-105 707
            </p>
            <Link href="/kontakt" className={styles.cta__btn}>
              Kontakta oss
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
