import styles from './integritetspolicy.module.scss'

export const metadata = {
  title: 'Integritetspolicy – Svippo',
  description: 'Svippos integritetspolicy – hur vi hanterar dina personuppgifter.',
}

export default function IntegritetspolicyPage() {
  return (
    <div className={styles.integritetspolicy}>
      <div className={styles.integritetspolicy__banner}>
        <div className={styles.integritetspolicy__banner_inner}>
          <h1 className={styles.integritetspolicy__title}>Integritetspolicy</h1>
          <p className={styles.integritetspolicy__subtitle}>Version 1.0 · Juni 2026</p>
        </div>
      </div>

      <div className={styles.integritetspolicy__content}>
        <p>
          <strong>Din integritet är viktig för oss.</strong> Den här policyn förklarar vilka personuppgifter Svippo samlar in, varför vi
          gör det, hur länge vi sparar dem och vilka rättigheter du har. Vi strävar efter att vara transparenta och
          tydliga – om något är oklart är du alltid välkommen att kontakta oss.
        </p>

        <h2>1. Personuppgiftsansvarig</h2>
        <p>
          Svippo AB, org.nr 559385-9928, med postadress Svartnoranästet 520, 872 94 Sandöverken, är
          personuppgiftsansvarig för den behandling av personuppgifter som beskrivs i denna policy. Det innebär att vi
          ansvarar för att dina uppgifter hanteras korrekt och i enlighet med gällande dataskyddslagstiftning, inklusive
          EU:s dataskyddsförordning (GDPR).
        </p>
        <p>
          Har du frågor om hur vi hanterar dina personuppgifter kontaktar du oss på{' '}
          <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a>.
        </p>

        <h2>2. Vilka personuppgifter samlar vi in?</h2>
        <p>
          Vi samlar in personuppgifter i samband med att du registrerar ett konto, använder plattformen eller
          kommunicerar med oss. Nedan beskrivs de kategorier av uppgifter vi behandlar.
        </p>

        <h3>2.1 Uppgifter du lämnar till oss</h3>
        <ul>
          <li>Namn, e-postadress och telefonnummer – vid registrering</li>
          <li>Lösenord (krypterat, aldrig i klartext)</li>
          <li>Profilbild och profilbeskrivning – om du väljer att lägga till det</li>
          <li>Personnummer eller organisationsnummer – för utförare, krävs för rapportering</li>
          <li>Betalningsinformation – hanteras ej av Svippo, sker direkt mellan parterna</li>
          <li>Innehåll du publicerar: annonser, förfrågningar, bilder, meddelanden och recensioner</li>
        </ul>

        <h3>2.2 Uppgifter vi samlar in automatiskt</h3>
        <ul>
          <li>IP-adress och enhetstyp vid inloggning</li>
          <li>Webbläsartyp och operativsystem</li>
          <li>Sidor du besöker på Svippo och hur länge</li>
          <li>Klick- och scrollbeteende via Google Analytics</li>
          <li>Konverteringshändelser via Meta Pixel (om du kommit via en Meta-annons)</li>
          <li>Cookies – se avsnitt 7 för fullständig beskrivning</li>
        </ul>

        <h3>2.3 Uppgifter från din aktivitet på plattformen</h3>
        <ul>
          <li>Uppdragshistorik: kategori, beskrivning, datum och status</li>
          <li>Prisuppgifter per uppdrag – avtalade och godkända belopp</li>
          <li>Kommunikation via Svippos inbyggda chatt</li>
          <li>Betyg och omdömen du lämnat eller tagit emot</li>
          <li>Inloggningsaktivitet och sessionsinformation</li>
        </ul>

        <h2>3. Varför behandlar vi dina uppgifter?</h2>
        <p>
          Vi behandlar dina personuppgifter av flera skäl. För varje syfte finns en rättslig grund enligt GDPR.
        </p>

        <div className={styles.integritetspolicy__table_wrap}>
          <table className={styles.integritetspolicy__table}>
            <thead>
              <tr>
                <th>Syfte</th>
                <th>Rättslig grund</th>
                <th>Exempel</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tillhandahålla plattformens tjänster</td>
                <td>Avtal</td>
                <td>Skapa konto, visa annonser, hantera uppdrag</td>
              </tr>
              <tr>
                <td>Kommunikation med dig</td>
                <td>Avtal</td>
                <td>Svara på frågor, skicka orderbekräftelser</td>
              </tr>
              <tr>
                <td>Förbättra plattformen</td>
                <td>Berättigat intresse</td>
                <td>Analysera användarbeteende, identifiera buggar</td>
              </tr>
              <tr>
                <td>Säkerhet och bedrägeriförebyggande</td>
                <td>Berättigat intresse</td>
                <td>Identifiera misstänkt aktivitet, skydda användare</td>
              </tr>
              <tr>
                <td>Rapportering till Skatteverket (DAC7)</td>
                <td>Rättslig förpliktelse</td>
                <td>Lämna kontrolluppgifter för aktiva utförare</td>
              </tr>
              <tr>
                <td>Marknadsföring av Svippo</td>
                <td>Berättigat intresse / samtycke</td>
                <td>Visa annonser för relevanta målgrupper</td>
              </tr>
              <tr>
                <td>Statistik och produktutveckling</td>
                <td>Berättigat intresse</td>
                <td>Intern analys, anonymiserad statistik</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>4. Rapportering till Skatteverket (DAC7)</h2>
        <p>
          Svippo är enligt EU-direktiv DAC7, implementerat i svensk lag, skyldigt att rapportera inkomstuppgifter till
          Skatteverket för utförare som uppfyller något av följande kriterier under ett kalenderår:
        </p>
        <ul>
          <li>Genomfört fler än 30 uppdrag via plattformen, eller</li>
          <li>Tjänat mer än 2 000 EUR via plattformen</li>
        </ul>
        <p>
          För dessa utförare lämnar Svippo kontrolluppgifter till Skatteverket senast den 31 januari året efter
          inkomståret. Uppgifterna som rapporteras inkluderar namn, personnummer eller organisationsnummer, antal
          uppdrag och registrerade belopp.
        </p>
        <p>
          Svippo hanterar inga betalningar direkt. De belopp som rapporteras är de avtalade och godkända belopp som
          registrerats via plattformens orderhantering. För uppdrag där inget belopp loggats kan Svippo enbart
          rapportera aktiviteten.
        </p>
        <p>
          <em>
            Du meddelas av Svippo om du berörs av DAC7-rapportering. Du har rätt att ta del av de uppgifter som
            rapporterats om dig.
          </em>
        </p>

        <h2>5. Hur länge sparar vi dina uppgifter?</h2>
        <p>
          Vi sparar dina personuppgifter så länge det är nödvändigt för det syfte de samlades in för, eller så länge
          lagen kräver det.
        </p>

        <div className={styles.integritetspolicy__table_wrap}>
          <table className={styles.integritetspolicy__table}>
            <thead>
              <tr>
                <th>Typ av uppgift</th>
                <th>Lagringstid</th>
                <th>Skäl</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Kontouppgifter</td>
                <td>Tills kontot avslutas + 90 dagar</td>
                <td>Återaktivering, säkerhet</td>
              </tr>
              <tr>
                <td>Uppdragshistorik och belopp</td>
                <td>7 år efter uppdragets slut</td>
                <td>Skattemässig rapportering (DAC7, bokföringslagen)</td>
              </tr>
              <tr>
                <td>Chattmeddelanden</td>
                <td>2 år efter avslutat uppdrag</td>
                <td>Tvisthantering</td>
              </tr>
              <tr>
                <td>Inloggningsloggar</td>
                <td>12 månader</td>
                <td>Säkerhet och felsökning</td>
              </tr>
              <tr>
                <td>Analytics-data (Google)</td>
                <td>Enligt Googles policy (14 mån)</td>
                <td>Anonymiserad – ej kopplad till individ</td>
              </tr>
              <tr>
                <td>Meta Pixel-data</td>
                <td>Enligt Metas policy</td>
                <td>Anonymiserad konverteringsdata</td>
              </tr>
              <tr>
                <td>Omdömen och recensioner</td>
                <td>Tills kontot raderas</td>
                <td>Del av plattformens innehåll</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>6. Tredjeparter och dataöverföring</h2>

        <h3>6.1 Tjänsteleverantörer</h3>
        <p>
          Svippo använder ett antal tredjepartstjänster för att driva plattformen. Dessa har tillgång till personuppgifter i
          den utsträckning det krävs för att utföra sina tjänster och är bundna av databehandlingsavtal med Svippo.
        </p>

        <div className={styles.integritetspolicy__table_wrap}>
          <table className={styles.integritetspolicy__table}>
            <thead>
              <tr>
                <th>Tjänst</th>
                <th>Syfte</th>
                <th>Dataskydd</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Vercel</td>
                <td>Hosting och infrastruktur</td>
                <td>EU/USA – standardavtalsklausuler</td>
              </tr>
              <tr>
                <td>Google Analytics</td>
                <td>Webbanalys och beteendestatistik</td>
                <td>Anonymiserad, EU-datacenter möjligt</td>
              </tr>
              <tr>
                <td>Meta Pixel</td>
                <td>Annonskonvertering och målgruppsmätning</td>
                <td>Anonymiserad konverteringsdata</td>
              </tr>
              <tr>
                <td>Skatteverket</td>
                <td>DAC7-rapportering (lagkrav)</td>
                <td>Svensk myndighet</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>6.2 Ingen försäljning av data</h3>
        <p>
          Svippo säljer aldrig dina personuppgifter till tredje part. Vi delar inte heller dina uppgifter med annonsörer eller
          marknadsföringspartners för deras egna syften. All data som samlas in används uteslutande för att driva och
          förbättra Svippos egna tjänster.
        </p>

        <h3>6.3 Intern dataanvändning</h3>
        <p>
          Viss aggregerad och anonymiserad data används internt för produktutveckling och förbättring av plattformen.
          Denna data kan inte kopplas till enskilda individer och delas inte externt.
        </p>

        <h3>6.4 Överföring utanför EU/EES</h3>
        <p>
          Svippo strävar efter att hålla all databehandling inom EU/EES. Där tredjepartstjänster behandlar data utanför
          EU/EES – exempelvis via Vercels eller Googles infrastruktur – säkerställer vi att lämpliga skyddsåtgärder
          finns på plats, i form av EU-standardavtalsklausuler (SCC) eller likvärdigt skydd enligt GDPR.
        </p>

        <h2>7. Cookies</h2>
        <p>
          Svippo använder cookies och liknande tekniker för att plattformen ska fungera korrekt och för att vi ska kunna
          förbättra din upplevelse. Cookies är små textfiler som lagras i din webbläsare.
        </p>

        <h3>7.1 Typer av cookies vi använder</h3>

        <div className={styles.integritetspolicy__table_wrap}>
          <table className={styles.integritetspolicy__table}>
            <thead>
              <tr>
                <th>Typ</th>
                <th>Namn / Källa</th>
                <th>Syfte</th>
                <th>Lagringstid</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nödvändiga</td>
                <td>Svippo session</td>
                <td>Inloggning, säkerhet, grundfunktioner</td>
                <td>Session / 30 dagar</td>
              </tr>
              <tr>
                <td>Analys</td>
                <td>Google Analytics (_ga, _gid)</td>
                <td>Förstå hur användare navigerar på sajten</td>
                <td>14 månader</td>
              </tr>
              <tr>
                <td>Marknadsföring</td>
                <td>Meta Pixel (_fbp)</td>
                <td>Mäta konverteringar från Meta-annonser</td>
                <td>90 dagar</td>
              </tr>
              <tr>
                <td>Preferenser</td>
                <td>Svippo prefs</td>
                <td>Spara språk- och visningsinställningar</td>
                <td>12 månader</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>7.2 Hantera dina cookie-inställningar</h3>
        <p>
          När du besöker Svippo för första gången visas en cookie-banner där du kan välja vilka typer av cookies du
          accepterar. Du kan när som helst ändra dina inställningar via länken "Cookieinställningar" i sidfoten på
          svippo.se.
        </p>
        <p>
          Du kan också hantera cookies direkt i din webbläsare. Observera att om du inaktiverar nödvändiga cookies
          kan delar av plattformen sluta fungera.
        </p>

        <h2>8. Dina rättigheter enligt GDPR</h2>
        <p>
          Som registrerad hos Svippo har du ett antal rättigheter avseende dina personuppgifter. Vi strävar efter att
          besvara alla förfrågningar inom 30 dagar.
        </p>

        <div className={styles.integritetspolicy__table_wrap}>
          <table className={styles.integritetspolicy__table}>
            <thead>
              <tr>
                <th>Rättighet</th>
                <th>Vad det innebär</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Rätt till tillgång</td>
                <td>Du kan begära ett utdrag av alla personuppgifter vi har om dig</td>
              </tr>
              <tr>
                <td>Rätt till rättelse</td>
                <td>Du kan begära att felaktiga uppgifter korrigeras</td>
              </tr>
              <tr>
                <td>Rätt till radering</td>
                <td>Du kan begära att dina uppgifter raderas – med undantag för uppgifter vi är skyldiga att behålla enligt lag</td>
              </tr>
              <tr>
                <td>Rätt till begränsning</td>
                <td>Du kan begära att vi begränsar behandlingen av dina uppgifter i vissa situationer</td>
              </tr>
              <tr>
                <td>Rätt till dataportabilitet</td>
                <td>Du kan begära att få ut dina uppgifter i ett maskinläsbart format</td>
              </tr>
              <tr>
                <td>Rätt att invända</td>
                <td>Du kan invända mot behandling som baseras på berättigat intresse</td>
              </tr>
              <tr>
                <td>Rätt att återkalla samtycke</td>
                <td>Om behandling baseras på samtycke kan du återkalla det när som helst</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          För att utöva dina rättigheter, kontakta oss på{' '}
          <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a>. Vi kan behöva verifiera din identitet innan
          vi behandlar din begäran.
        </p>
        <p>
          Om du anser att vi hanterar dina personuppgifter felaktigt har du rätt att lämna klagomål till{' '}
          <strong>Integritetsskyddsmyndigheten (IMY)</strong> på{' '}
          <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer">imy.se</a>.
        </p>

        <h2>9. Datasäkerhet</h2>
        <p>
          Svippo vidtar tekniska och organisatoriska åtgärder för att skydda dina personuppgifter mot obehörig
          åtkomst, förlust eller förstöring. Detta inkluderar:
        </p>
        <ul>
          <li>Krypterad datatransmission via HTTPS/TLS</li>
          <li>Krypterad lösenordslagring – lösenord lagras aldrig i klartext</li>
          <li>Begränsad åtkomst till personuppgifter – endast behörig personal</li>
          <li>Regelbundna säkerhetsgranskningar av infrastrukturen</li>
          <li>Säker hosting via Vercel med inbyggda säkerhetsmekanismer</li>
        </ul>
        <p>
          Vid ett eventuellt dataintrång som riskerar att påverka dina rättigheter och friheter kommer vi att meddela dig
          och Integritetsskyddsmyndigheten (IMY) inom 72 timmar, i enlighet med GDPR.
        </p>

        <h2>10. Barn och minderåriga</h2>
        <p>
          Svippo är inte avsett för personer under 18 år. Vi samlar inte medvetet in personuppgifter från minderåriga.
          Om vi får kännedom om att en person under 18 år har registrerat ett konto stänger vi kontot och raderar
          tillhörande uppgifter snarast möjligt.
        </p>
        <p>
          Om du misstänker att ett barn registrerat sig på Svippo, kontakta oss omedelbart på{' '}
          <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a>.
        </p>

        <h2>11. Ändringar av integritetspolicyn</h2>
        <p>
          Svippo kan komma att uppdatera denna integritetspolicy. Vid väsentliga ändringar meddelas registrerade
          användare via e-post minst 14 dagar innan ändringarna träder i kraft. Den senaste versionen finns alltid
          tillgänglig på svippo.se/integritetspolicy.
        </p>
        <p>
          Datum för senaste uppdatering anges alltid överst i dokumentet.
        </p>

        <h2>12. Kontakt</h2>
        <p>Har du frågor om denna integritetspolicy eller hur vi hanterar dina personuppgifter?</p>

        <div className={styles.integritetspolicy__contact}>
          <p><strong>Svippo AB</strong></p>
          <p>Org.nr: 559385-9928</p>
          <p>Postadress: Svartnoranästet 520, 872 94 Sandöverken</p>
          <p>E-post: <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a></p>
          <p>Telefon: 020-105 707</p>
          <p>Öppettider: Måndag–fredag 09–17</p>
          <p>Tillsynsmyndighet: <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer">Integritetsskyddsmyndigheten (IMY) · imy.se</a></p>
        </div>

        <p className={styles.integritetspolicy__footer_note}>
          Integritetspolicy version 1.0 · Juni 2026 · Svippo AB · Org.nr 559385-9928
        </p>
      </div>
    </div>
  )
}
