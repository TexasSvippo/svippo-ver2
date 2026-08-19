import styles from './villkorutforare.module.scss'

export const metadata = {
  title: 'Villkor för utförare – Svippo',
  description: 'Svippos villkor för utförare (privatperson) – tillägg till de allmänna villkoren.',
}

export default function VillkorUtforarePage() {
  return (
    <div className={styles.villkor}>
      <div className={styles.villkor__banner}>
        <div className={styles.villkor__banner_inner}>
          <h1 className={styles.villkor__title}>Villkor för utförare (privatperson)</h1>
          <p className={styles.villkor__subtitle}>Tilläggsdokument till Svippos allmänna villkor · Version 1.0 · Juni 2026</p>
        </div>
      </div>

      <div className={styles.villkor__content}>
        <div className={styles.villkor__intro}>
          <p style={{ margin: 0 }}>
            <strong>Detta dokument gäller dig som privatperson och som aktiverar utförarrollen på Svippo.</strong> Det är
            ett tillägg till de allmänna villkoren och reglerar specifikt vad det innebär att erbjuda tjänster via
            plattformen – ditt ansvar, hur betalning ska hanteras och vad som gäller om något går fel. Läs igenom det
            noggrant innan du aktiverar din utförarroll.
          </p>
        </div>

        <h2>1. Vad innebär det att vara utförare på Svippo?</h2>
        <p>
          När du aktiverar utförarrollen på Svippo – det vi kallar att bli en Svippare – innebär det att du erbjuder
          dina tjänster till privatpersoner, företag och organisationer via plattformen. Du är inte anställd av Svippo
          och du arbetar inte för Svippos räkning.
        </p>
        <p>
          Svippo är en marknadsplats som förmedlar kontakt mellan dig och beställaren. Det är du som utförare och
          beställaren som ingår ett avtal med varandra. Svippo är inte part i det avtalet och tar inget ansvar för hur
          uppdraget genomförs, levereras eller betalas.
        </p>
        <p>Att vara utförare på Svippo innebär att du:</p>
        <ul>
          <li>Erbjuder dina egna tjänster under eget ansvar</li>
          <li>Sätter dina egna priser och villkor</li>
          <li>Kommunicerar direkt med beställaren via plattformen</li>
          <li>Ansvarar för att uppdraget genomförs enligt vad parterna kommit överens om</li>
          <li>Ansvarar för att ta betalt på ett lagligt sätt</li>
          <li>Ansvarar för att redovisa dina inkomster till Skatteverket</li>
        </ul>

        <h2>2. Registrering som utförare</h2>

        <h3>2.1 Personnummer</h3>
        <p>För att aktivera utförarrollen måste du ange ditt svenska personnummer. Personnumret används för att:</p>
        <ul>
          <li>Verifiera din identitet på plattformen</li>
          <li>Uppfylla Svippos rapporteringsskyldighet till Skatteverket enligt DAC7-direktivet</li>
          <li>Möjliggöra att beställare kan lita på att de kommunicerar med en verklig person</li>
        </ul>
        <p>
          Ditt personnummer behandlas enligt Svippos integritetspolicy och delas aldrig med beställare eller andra
          användare. Det används enbart för identifiering och skattemässig rapportering.
        </p>

        <h3>2.2 Åldersgräns</h3>
        <p>
          Du måste vara minst 18 år för att aktivera utförarrollen. Yngre personer får inte erbjuda tjänster via
          Svippo, oavsett målsmans godkännande.
        </p>

        <h3>2.3 En utförarprofil per person</h3>
        <p>
          Varje person får ha en utförarprofil på Svippo. Det är inte tillåtet att skapa flera konton eller profiler för
          att kringgå begränsningar eller tidigare beslut från Svippo.
        </p>

        <h2>3. Hur du erbjuder dina tjänster – så här fungerar det</h2>

        <h3>3.1 Skapa en annons</h3>
        <p>
          Som utförare skapar du annonser som beskriver de tjänster du erbjuder. En annons ska innehålla en korrekt
          och sanningsenlig beskrivning av tjänsten, ett tydligt pris (fast pris, timpris eller offert) och information
          om var och när du kan utföra uppdraget.
        </p>
        <p>
          Du ansvarar för att allt du skriver i din annons stämmer. Vilseledande, falsk eller överdrivet säljande
          information som inte återspeglar vad du faktiskt levererar är inte tillåtet.
        </p>

        <h3>3.2 Ta emot och acceptera beställningar</h3>
        <p>
          När en beställare visar intresse för din tjänst – antingen via en direkt beställning eller en förfrågan –
          kommunicerar ni via Svippos plattform. Du väljer själv vilka uppdrag du accepterar. Svippo kräver inte att du
          accepterar alla beställningar som kommer in.
        </p>
        <p>
          När du accepterar en beställning ingår du ett avtal med beställaren. Från det ögonblicket är du ansvarig för
          att leverera det ni kommit överens om.
        </p>

        <h3>3.3 Genomför uppdraget</h3>
        <p>
          Du ansvarar fullt ut för att uppdraget genomförs på ett professionellt sätt, i enlighet med vad du och
          beställaren avtalat. Det innebär att du:
        </p>
        <ul>
          <li>Dyker upp vid avtalad tid och plats</li>
          <li>Levererar den tjänst du beskrivit i din annons</li>
          <li>Kommunicerar med beställaren om något ändras eller försenas</li>
          <li>Behandlar beställarens egendom och hem med respekt</li>
          <li>Uppträder professionellt och artigt</li>
        </ul>

        <h3>3.4 Markera uppdraget som klart</h3>
        <p>
          När du är klar med uppdraget markerar du det som slutfört i plattformen. Beställaren bekräftar att de är
          nöjda, och uppdraget arkiveras. Det är först när beställaren bekräftat som uppdraget är officiellt avslutat.
        </p>

        <h2>4. Betalning – ditt ansvar och Svippos roll</h2>

        <h3>4.1 Svippo hanterar ingen betalning</h3>
        <p>
          Svippo förmedlar kontakten mellan dig och beställaren – men hanterar inga pengar. All betalning sker direkt
          mellan dig och beställaren, utanför plattformen. Ni bestämmer själva hur och när betalning ska ske.
        </p>
        <p>
          Svippo loggar de avtalade och godkända priserna som en del av uppdragsdokumentationen, men är aldrig
          ekonomiskt ansvarig för att betalning faktiskt genomförs.
        </p>

        <h3>4.2 Du måste ta betalt lagligt</h3>
        <div className={styles.villkor__intro}>
          <p style={{ margin: 0 }}>
            <strong>Viktigt:</strong> Som privatperson är du skyldig att redovisa dina inkomster från uppdrag på
            Svippo till Skatteverket. Det spelar ingen roll om det rör sig om ett enstaka uppdrag eller återkommande
            arbete – inkomsten ska deklareras. Svippo tar avstånd från svarta betalningar och ekonomisk brottslighet.
          </p>
        </div>
        <p>Som privatperson utan eget företag har du tre lagliga sätt att ta betalt:</p>
        <table className={styles.villkor__table}>
          <thead>
            <tr>
              <th>Metod</th>
              <th>Hur det fungerar</th>
              <th>Mer info</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Egenanställning</td>
              <td>Du fakturerar via en egenanställningstjänst som hanterar skatt och arbetsgivaravgifter åt dig.</td>
              <td>
                <a href="https://worknode.se" target="_blank" rel="noopener noreferrer">Worknode</a>{' '}eller{' '}
                <a href="https://coolcompany.com/se" target="_blank" rel="noopener noreferrer">Cool Company</a>
              </td>
            </tr>
            <tr>
              <td>Enskild firma</td>
              <td>Du startar en enskild firma och fakturerar direkt. Du ansvarar själv för F-skatt och moms.</td>
              <td><a href="https://verksamt.se" target="_blank" rel="noopener noreferrer">Verksamt.se</a></td>
            </tr>
            <tr>
              <td>Deklarera som tjänst</td>
              <td>Du redovisar inkomsten i din inkomstdeklaration under tjänst (SKV 2050).</td>
              <td><a href="https://skatteverket.se" target="_blank" rel="noopener noreferrer">Skatteverket</a></td>
            </tr>
          </tbody>
        </table>

        <h3>4.3 Svart betalning är förbjudet</h3>
        <p>
          <strong>Det är förbjudet</strong> att ta emot betalning via Swish, kontant eller andra kanaler utan att
          redovisa inkomsten till Skatteverket. Detta gäller oavsett uppdragets storlek. Svippo tolererar inte svarta
          betalningar och kan stänga konton där sådant beteende misstänks eller bekräftas. Svippo är skyldig att
          rapportera inkomstuppgifter till Skatteverket för aktiva utförare enligt DAC7-direktivet.
        </p>

        <h3>4.4 Svippos rapporteringsskyldighet</h3>
        <p>
          Svippo rapporterar uppgifter om utförare till Skatteverket i enlighet med DAC7-direktivet. Det innebär att
          Skatteverket kan få information om de uppdrag du genomfört och de belopp som registrerats på plattformen.
          Detta är en lagstadgad skyldighet och inte något Svippo kan välja bort.
        </p>

        <h2>5. Ditt ansvar som utförare</h2>

        <h3>5.1 Ansvar för kvalitet och leverans</h3>
        <p>
          Du ansvarar fullt ut för kvaliteten på det arbete du utför och för att leverera det du och beställaren
          kommit överens om. Svippo tar inget ansvar för hur ett uppdrag genomförs, om det levereras i tid eller om
          beställaren är nöjd med resultatet.
        </p>
        <p>
          Om beställaren inte är nöjd med ditt arbete är det i första hand en fråga mellan dig och beställaren att
          lösa. Svippo kan agera som neutral medlare om parterna begär det, men fattar inga bindande beslut och är
          inte ekonomiskt ansvarig för utfallet.
        </p>

        <h3>5.2 Ansvar för skador</h3>
        <p>
          Om du orsakar skada på beställarens egendom eller person i samband med ett uppdrag är du personligen
          ansvarig för den skadan. Svippo ansvarar inte för skador som uppstår under uppdragets genomförande. Vi
          rekommenderar att du har en giltig ansvarsförsäkring som täcker din verksamhet.
        </p>

        <h3>5.3 Ansvar för korrekt information</h3>
        <p>
          Du ansvarar för att all information i din profil och dina annonser är korrekt och uppdaterad. Du får inte
          påstå att du har kompetenser, certifieringar eller erfarenheter som du inte har.
        </p>

        <h3>5.4 Ansvar för kommunikation</h3>
        <p>
          Du förbinder dig att kommunicera ärligt och respektfullt med beställare. Om du inte kan genomföra ett
          accepterat uppdrag ska du meddela beställaren så snart som möjligt – helst via Svippos plattform så att det
          finns en logg.
        </p>

        <h2>6. Förbjudet beteende</h2>
        <p>Utöver vad som anges i Svippos allmänna villkor är följande förbjudet för dig som utförare:</p>
        <ul>
          <li>Ta betalt utanför plattformen utan att redovisa inkomsten till Skatteverket</li>
          <li>Genomföra uppdrag som du saknar kompetens, tillstånd eller behörighet för</li>
          <li>Lämna falska eller missvisande uppgifter om din erfarenhet eller kompetens</li>
          <li>Kontakta beställare i syfte att kringgå plattformen och undvika framtida avgifter</li>
          <li>Ta emot betalning för uppdrag du inte har för avsikt att genomföra</li>
          <li>Använda Svippo för att bedriva verksamhet som kräver F-skatt utan att ha det</li>
          <li>Lämna falska omdömen om beställare eller manipulera betygsystemet</li>
          <li>Dela beställarens personuppgifter med tredje part utan samtycke</li>
        </ul>

        <h2>7. Konsekvenser vid brott mot villkoren</h2>
        <p>
          Svippo tar brott mot dessa villkor på allvar. Beroende på överträdelsens art och allvarlighetsgrad kan
          Svippo vidta följande åtgärder:
        </p>

        <h3>7.1 Varning</h3>
        <p>
          Vid mindre eller första överträdelser kan Svippo utfärda en skriftlig varning via e-post. Varningen
          dokumenteras och beaktas om ytterligare överträdelser sker.
        </p>

        <h3>7.2 Tillfällig begränsning</h3>
        <p>
          Svippo kan tillfälligt avpublicera dina annonser, begränsa din förmåga att ta emot nya beställningar eller
          pausera din utförarprofil under en utredning.
        </p>

        <h3>7.3 Permanent stängning av kontot</h3>
        <p>Vid allvarliga eller upprepade överträdelser kan Svippo permanent stänga ditt konto utan förvarning. Det gäller särskilt vid:</p>
        <ul>
          <li>Bekräftade svarta betalningar eller skattebrott</li>
          <li>Bedrägeri mot beställare</li>
          <li>Upprepat dåligt uppförande efter tidigare varningar</li>
          <li>Grova kränkningar av beställare</li>
          <li>Försök att kringgå en tidigare stängning</li>
        </ul>
        <p>
          Vid permanent stängning raderas dina aktiva annonser. Historik som krävs för pågående tvister eller
          lagstadgad rapportering bevaras. Du har rätt att begära omprövning av beslutet via{' '}
          <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a>.
        </p>

        <h2>8. Svippos roll – vad vi är och inte är</h2>
        <p>Det är viktigt att du förstår Svippos roll för att undvika missförstånd.</p>

        <h3>8.1 Svippo är en förmedlingstjänst</h3>
        <p>
          Svippo är en neutral marknadsplats. Vi är inte din arbetsgivare, din uppdragsgivare eller din agent. Vi
          förmedlar kontakten mellan dig och beställaren – resten är upp till er.
        </p>

        <h3>8.2 Svippo garanterar inget</h3>
        <p>
          Svippo garanterar inte att du kommer att få uppdrag, att beställare kommer att betala eller att plattformen
          alltid är tillgänglig. Vi gör vårt bästa men kan inte utlova ett visst antal uppdrag eller en viss inkomst.
        </p>

        <h3>8.3 Svippo lägger sig inte i betalningen</h3>
        <p>
          Betalning är en fråga uteslutande mellan dig och beställaren. Svippo förmedlar inga pengar, tar inga
          avgifter från betalningen och är inte ansvarig om betalning uteblir. Svippo loggar avtalade belopp som en
          del av uppdragsdokumentationen – det är allt.
        </p>

        <h3>8.4 Svippo kan agera medlare</h3>
        <p>
          Om en tvist uppstår mellan dig och en beställare kan ni kontakta Svippo och begära medling. Svippo kan
          granska kommunikation och orderhistorik som stöd i medlingen, men fattar inga bindande beslut och är inte
          ekonomiskt ansvarig för utfallet.
        </p>

        <h2>9. Ändringar av dessa villkor</h2>
        <p>
          Svippo kan uppdatera dessa villkor. Vid väsentliga ändringar meddelas du via e-post minst 14 dagar innan
          ändringarna träder i kraft. Fortsatt användning av utförarrollen efter att ändringarna trätt i kraft innebär
          att du accepterar de uppdaterade villkoren. Den senaste versionen finns alltid på svippo.se/villkor.
        </p>

        <h2>10. Kontakt</h2>
        <p>Frågor om dessa villkor besvaras på:</p>

        <div className={styles.villkor__contact}>
          <p><strong>Svippo AB</strong></p>
          <p>Org.nr: 559385-9928</p>
          <p>Postadress: Svartnoranästet 520, 872 94 Sandöverken</p>
          <p>E-post: <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a></p>
          <p>Telefon: 020-105 707</p>
          <p>Öppettider: Måndag–fredag 09–17</p>
        </div>

        <p className={styles.villkor__footer_note}>
          Villkor för utförare (privatperson) version 1.0 · Juni 2026 · Svippo AB · Org.nr 559385-9928 · Tillägg till allmänna villkor
        </p>
      </div>
    </div>
  )
}
