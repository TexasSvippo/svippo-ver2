import styles from './cookies.module.scss'

export const metadata = {
  title: 'Cookiepolicy – Svippo',
  description: 'Svippos cookiepolicy – vilka cookies vi använder och hur du hanterar dem.',
}

export default function CookiesPage() {
  return (
    <div className={styles.cookies}>
      <div className={styles.cookies__banner}>
        <div className={styles.cookies__banner_inner}>
          <h1 className={styles.cookies__title}>Cookiepolicy</h1>
          <p className={styles.cookies__subtitle}>Version 1.0 · Juni 2026</p>
        </div>
      </div>

      <div className={styles.cookies__content}>
        <h2>1. Vad är cookies?</h2>
        <p>
          Cookies är små textfiler som lagras i din webbläsare när du besöker en webbplats. De används för att
          webbplatsen ska komma ihåg information om ditt besök – till exempel att du är inloggad eller vilka
          inställningar du valt. Förutom traditionella cookies använder Svippo även liknande tekniker som pixlar och
          lokalt webbläsarlagring (localStorage) för liknande ändamål. Dessa omfattas av samma regler och samma
          samtycke som cookies. Cookies från svippo.se kallas förstapartscookies. Cookies som sätts av externa
          tjänster – som Google och Meta – kallas tredjepartscookies. Båda typerna beskrivs i denna policy.
        </p>

        <h2>2. Vilka cookies använder vi?</h2>
        <p>
          Svippo använder fyra kategorier av cookies. Nedan beskrivs varje kategori med detaljer om vilka specifika
          cookies som sätts, deras syfte och hur länge de lagras.
        </p>

        <h3>2.1 Nödvändiga cookies</h3>
        <p>
          Dessa cookies är absolut nödvändiga för att plattformen ska fungera. De aktiveras automatiskt och kan inte
          stängas av utan att plattformen slutar fungera. De kräver inte ditt samtycke enligt ePrivacy-direktivet.
        </p>

        <div className={styles.cookies__table_wrap}>
          <table className={styles.cookies__table}>
            <thead>
              <tr>
                <th>Cookienamn</th>
                <th>Källa</th>
                <th>Syfte</th>
                <th>Lagringstid</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>svippo_session</td>
                <td>Svippo</td>
                <td>Håller dig inloggad under din session</td>
                <td>Session</td>
              </tr>
              <tr>
                <td>svippo_auth</td>
                <td>Svippo</td>
                <td>Autentisering och säker inloggning</td>
                <td>30 dagar</td>
              </tr>
              <tr>
                <td>svippo_csrf</td>
                <td>Svippo</td>
                <td>Skyddar mot CSRF-attacker</td>
                <td>Session</td>
              </tr>
              <tr>
                <td>svippo_prefs</td>
                <td>Svippo</td>
                <td>Sparar cookie-samtycke och grundinställningar</td>
                <td>12 månader</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>2.2 Analyscookies</h3>
        <p>
          Dessa cookies hjälper oss att förstå hur besökare använder Svippo – vilka sidor som besöks, hur länge och
          var användare lämnar plattformen. Informationen används enbart för att förbättra Svippo och är
          anonymiserad. Vi kan inte identifiera dig personligen via denna data. Analyscookies aktiveras bara om du
          godkänt dem i cookie-bannern.
        </p>

        <div className={styles.cookies__table_wrap}>
          <table className={styles.cookies__table}>
            <thead>
              <tr>
                <th>Cookienamn</th>
                <th>Källa</th>
                <th>Syfte</th>
                <th>Lagringstid</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>_ga</td>
                <td>Google Analytics</td>
                <td>Unikt ID för att skilja användare åt (anonymiserat)</td>
                <td>14 månader</td>
              </tr>
              <tr>
                <td>_ga_[ID]</td>
                <td>Google Analytics</td>
                <td>Sessionsstatus för Google Analytics 4</td>
                <td>14 månader</td>
              </tr>
              <tr>
                <td>_gid</td>
                <td>Google Analytics</td>
                <td>Särskiljer användare, uppdateras dagligen</td>
                <td>24 timmar</td>
              </tr>
              <tr>
                <td>_gat</td>
                <td>Google Analytics</td>
                <td>Begränsar antal förfrågningar till Google</td>
                <td>1 minut</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Google Analytics är konfigurerat med IP-anonymisering aktiverat. Det innebär att din IP-adress trunkeras
          innan den skickas till Google och aldrig lagras i sin helhet. Data behandlas enligt Googles
          dataskyddspolicy:{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            policies.google.com/privacy
          </a>
        </p>

        <h3>2.3 Marknadsföringscookies</h3>
        <p>
          Dessa cookies används för att mäta effekten av Svippos annonsering i sociala medier. De hjälper oss att
          förstå om användare som klickat på en Svippo-annons faktiskt registrerat sig eller genomfört en handling på
          plattformen. Vi använder inte dessa cookies för att visa riktade annonser baserade på din aktivitet på
          andra webbplatser. Marknadsföringscookies aktiveras bara om du godkänt dem i cookie-bannern.
        </p>

        <div className={styles.cookies__table_wrap}>
          <table className={styles.cookies__table}>
            <thead>
              <tr>
                <th>Cookienamn</th>
                <th>Källa</th>
                <th>Syfte</th>
                <th>Lagringstid</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>_fbp</td>
                <td>Meta (Facebook)</td>
                <td>Identifierar webbläsaren för konverteringsmätning</td>
                <td>90 dagar</td>
              </tr>
              <tr>
                <td>_fbc</td>
                <td>Meta (Facebook)</td>
                <td>Lagrar klick-ID från Meta-annonser</td>
                <td>90 dagar</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Meta Pixel används enbart för att mäta konverteringar från Svippos egna annonser. Data behandlas enligt
          Metas dataskyddspolicy:{' '}
          <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">
            facebook.com/privacy/policy
          </a>
        </p>

        <h3>2.4 Preferenscookies</h3>
        <p>
          Dessa cookies sparar dina personliga inställningar på Svippo, till exempel språkval och
          visningsinställningar, så att du slipper ange dem vid varje besök. Preferenscookies aktiveras bara om du
          godkänt dem i cookie-bannern.
        </p>

        <div className={styles.cookies__table_wrap}>
          <table className={styles.cookies__table}>
            <thead>
              <tr>
                <th>Cookienamn</th>
                <th>Källa</th>
                <th>Syfte</th>
                <th>Lagringstid</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>svippo_lang</td>
                <td>Svippo</td>
                <td>Sparar ditt språkval</td>
                <td>12 månader</td>
              </tr>
              <tr>
                <td>svippo_theme</td>
                <td>Svippo</td>
                <td>Sparar ljust/mörkt läge om det erbjuds</td>
                <td>12 månader</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>3. Cookie-bannern och ditt samtycke</h2>
        <p>
          När du besöker Svippo för första gången visas en cookie-banner längst ner på sidan. Du väljer vilka
          kategorier av cookies du godkänner. Ditt val sparas och du visas inte bannern igen förrän du rensar dina
          cookies eller ditt samtycke löper ut. Ditt samtycke gäller i 12 månader. Efter det visas bannern igen så
          att du kan bekräfta eller ändra dina inställningar.
        </p>

        <h3>3.1 Dina val i bannern</h3>
        <ul>
          <li>Acceptera alla – aktiverar nödvändiga, analys, marknadsföring och preferenscookies.</li>
          <li>Endast nödvändiga – aktiverar enbart de cookies som krävs för att plattformen ska fungera.</li>
          <li>Anpassa – låter dig välja exakt vilka kategorier du godkänner.</li>
        </ul>

        <h3>3.2 Ändra ditt samtycke</h3>
        <p>
          Du kan när som helst ändra dina cookieinställningar via länken &quot;Cookieinställningar&quot; i sidfoten på
          svippo.se. Dina ändringar träder i kraft omedelbart.
        </p>

        <h2>4. Tredjepartscookies och externa tjänster</h2>
        <p>
          Svippo använder tjänster från Google och Meta som sätter sina egna cookies i din webbläsare. Dessa företag
          har egna integritetspolicyer och är självständigt personuppgiftsansvariga för den data de samlar in via
          sina cookies.
        </p>

        <div className={styles.cookies__table_wrap}>
          <table className={styles.cookies__table}>
            <thead>
              <tr>
                <th>Tjänst</th>
                <th>Typ</th>
                <th>Mer information</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Google Analytics</td>
                <td>Analys</td>
                <td>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                    policies.google.com/privacy
                  </a>
                </td>
              </tr>
              <tr>
                <td>Google LLC</td>
                <td>Infrastruktur (Vercel/Google)</td>
                <td>
                  <a href="https://cloud.google.com/privacy" target="_blank" rel="noopener noreferrer">
                    cloud.google.com/privacy
                  </a>
                </td>
              </tr>
              <tr>
                <td>Meta Platforms Ireland</td>
                <td>Marknadsföring</td>
                <td>
                  <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">
                    facebook.com/privacy/policy
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Svippo säljer inte data till dessa eller andra tredjeparter och delar inte personidentifierbar information
          med annonsörer utöver vad som beskrivs ovan.
        </p>

        <h2>5. Hantera cookies direkt i din webbläsare</h2>
        <p>
          Du kan alltid hantera, blockera eller radera cookies direkt i din webbläsares inställningar. Observera att
          om du blockerar nödvändiga cookies kan delar av Svippo sluta fungera – du kan till exempel inte vara
          inloggad.
        </p>
        <p>Så här hittar du cookie-inställningarna i de vanligaste webbläsarna:</p>
        <ul>
          <li>Chrome: Inställningar → Sekretess och säkerhet → Cookies och andra webbplatsdata</li>
          <li>Firefox: Inställningar → Sekretess och säkerhet → Cookies och webbplatsdata</li>
          <li>Safari: Inställningar → Sekretess → Hantera webbplatsdata</li>
          <li>Edge: Inställningar → Cookies och webbplatsbehörigheter → Cookies och lagrade data</li>
        </ul>
        <p>
          Du kan också använda webbläsartillägg som uBlock Origin eller liknande för att blockera specifika cookies
          från tredjeparter.
        </p>

        <h2>6. Cookies och GDPR</h2>
        <p>
          Svippos användning av cookies styrs av EU:s ePrivacy-direktiv (Cookielagen) och GDPR. Nödvändiga cookies
          behandlas med stöd av berättigat intresse och kräver inte samtycke. Analys-, marknadsförings- och
          preferenscookies behandlas med stöd av ditt samtycke och aktiveras aldrig utan att du godkänt dem. Du kan
          när som helst återkalla ditt samtycke till icke-nödvändiga cookies via &quot;Cookieinställningar&quot; i
          sidfoten. Återkallelse påverkar inte lagligheten av den behandling som skett innan återkallelsen. Den
          svenska tillsynsmyndigheten för dataskydd och cookies är Integritetsskyddsmyndigheten (IMY). Mer
          information finns på{' '}
          <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer">imy.se</a>.
        </p>

        <h2>7. Ändringar av cookiepolicyn</h2>
        <p>
          Svippo kan komma att uppdatera denna cookiepolicy när nya cookies läggs till eller befintliga ändras. Vid
          väsentliga ändringar meddelas du via cookie-bannern vid ditt nästa besök. Den senaste versionen finns
          alltid på svippo.se/cookies.
        </p>

        <h2>8. Kontakt</h2>
        <p>Frågor om vår cookieanvändning besvaras på:</p>

        <div className={styles.cookies__contact}>
          <p><strong>Svippo AB</strong></p>
          <p>Org.nr: 559385-9928</p>
          <p>E-post: <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a></p>
          <p>Telefon: 020-105 707</p>
          <p>Öppettider: Måndag–fredag 09–17</p>
        </div>

        <p className={styles.cookies__footer_note}>
          Cookiepolicy version 1.0 · Juni 2026 · Svippo AB · Org.nr 559385-9928
        </p>
      </div>
    </div>
  )
}
