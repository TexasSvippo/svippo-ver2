import styles from './villkor.module.scss'

export const metadata = {
  title: 'Allmänna villkor – Svippo',
  description: 'Svippos allmänna villkor för användare av plattformen.',
}

export default function VillkorPage() {
  return (
    <div className={styles.villkor}>
      <div className={styles.villkor__banner}>
        <div className={styles.villkor__banner_inner}>
          <h1 className={styles.villkor__title}>Allmänna villkor</h1>
          <p className={styles.villkor__subtitle}>Version 1.1 · Juni 2026</p>
        </div>
      </div>

      <div className={styles.villkor__content}>
        <p>
          Läs detta innan du skapar ett konto. Dessa allmänna villkor gäller för alla som skapar ett konto på Svippo,
          oavsett om du är privatperson, företag eller UF-företag. Genom att skapa ett konto och använda Svippo
          accepterar du dessa villkor i sin helhet.
        </p>

        <h2>1. Om Svippo</h2>

        <h3>1.1 Vad är Svippo?</h3>
        <p>
          Svippo är en svensk digital marknadsplats som förmedlar kontakt mellan den som söker tjänster (beställare)
          och den som erbjuder tjänster (utföraren – privatperson, företag eller UF-företag). Svippo tillhandahåller en
          plattform där parterna kan hitta varandra, kommunicera och komma överens om uppdrag.
        </p>

        <h3>1.2 Vad Svippo inte är</h3>
        <p>
          Svippo är inte part i avtalet mellan beställare och utförare. Svippo hanterar inte betalningar och är inte
          ansvarig för att tjänster utförs, levereras eller håller en viss kvalitet. Svippo är en förmedlingstjänst – inte en
          arbetsgivare, uppdragsgivare eller garantigivare.
        </p>

        <h3>1.3 Tillämplig lagstiftning</h3>
        <p>
          Svippo är en svensk tjänst och dessa villkor styrs av svensk rätt. Svippo omfattas av EU:s förordning om
          digitala tjänster (DSA – Digital Services Act) som gäller från och med den 17 februari 2024.
        </p>

        <h2>2. Konto och registrering</h2>

        <h3>2.1 Vem kan skapa ett konto?</h3>
        <p>För att skapa ett konto på Svippo måste du:</p>
        <ul>
          <li>Vara minst 18 år gammal. Personer under 18 år får inte skapa konto på Svippo.</li>
          <li>Ha en giltig e-postadress.</li>
          <li>Lämna korrekta och fullständiga uppgifter vid registreringen.</li>
          <li>Acceptera dessa allmänna villkor samt Svippos integritetspolicy.</li>
        </ul>
        <p>
          Företag och UF-företag registrerar sig med organisationsnummer och ansvarar för att den person som
          registrerar kontot har befogenhet att företräda organisationen.
        </p>
        <p>
          Om Svippo upptäcker att ett konto skapats av en person under 18 år stängs kontot omedelbart och eventuellt
          publicerat innehåll tas bort.
        </p>

        <h3>2.2 Ditt ansvar för kontot</h3>
        <p>
          Du ansvarar för att hålla dina inloggningsuppgifter hemliga och säkra. Du är ansvarig för all aktivitet som sker
          via ditt konto. Om du misstänker obehörig åtkomst ska du omedelbart kontakta Svippo på{' '}
          <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a>.
        </p>

        <h3>2.3 Ett konto per person eller organisation</h3>
        <p>
          Varje person eller organisation får ha ett konto på Svippo. Svippo förbehåller sig rätten att stänga
          duplicerade konton.
        </p>

        <h3>2.4 Korrekt information</h3>
        <p>
          Du är skyldig att hålla dina kontouppgifter uppdaterade. Felaktig information, falsk identitet eller
          missvisande uppgifter om dig själv eller din verksamhet är förbjudet och kan leda till att kontot stängs.
        </p>

        <h3>2.5 Avsluta ditt konto</h3>
        <p>
          Du kan när som helst begära att ditt konto avslutas genom att kontakta{' '}
          <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a>. Svippo behandlar din begäran inom 10 arbetsdagar.
          Vid kontoavslutning raderas dina personuppgifter i enlighet med vår integritetspolicy, med undantag för
          uppgifter som Svippo är skyldigt att bevara enligt lag – exempelvis för skattemässig rapportering. Aktiva
          uppdrag bör avslutas innan kontot stängs.
        </p>

        <h2>3. Plattformens funktion</h2>

        <h3>3.1 Tjänster och förfrågningar</h3>
        <p>
          På Svippo kan beställare hitta och boka tjänster som utförare erbjuder, samt lägga ut egna förfrågningar som
          utförare kan anmäla intresse till. Svippo erbjuder verktyg för kommunikation, orderhantering och
          dokumentation av uppdrag.
        </p>

        <h3>3.2 Orderbekräftelse</h3>
        <p>
          När ett uppdrag bekräftas och ett pris godkänts genererar Svippo automatiskt en orderbekräftelse – ett
          neutralt dokument som sammanfattar vad parterna kommit överens om via plattformen. Dokumentet upprättas
          av parterna och är ett hjälpmedel för dokumentation, inte ett juridiskt bindande avtal från Svippo. Svippo
          ansvarar inte för innehållet i orderbekräftelsen utöver att den återspeglar den information parterna
          registrerat.
        </p>

        <h3>3.3 Kommunikation</h3>
        <p>
          Svippo tillhandahåller en inbyggd kommunikationsfunktion för dialog mellan beställare och utförare. Svippo
          kan ta del av kommunikation i chattfunktionen om det behövs för att hantera ett tvisteärende eller vid
          misstanke om brott mot dessa villkor.
        </p>

        <h3>3.4 Marknadsföring av publicerat innehåll</h3>
        <p>
          Svippo förbehåller sig rätten att använda publicerade annonser och förfrågningar i marknadsföringssyfte –
          exempelvis i sociala medier, digital annonsering, TV, radio och tryckt media – i syfte att sprida kännedom om
          plattformen och öka synligheten för utförarnas tjänster. Personuppgifter hanteras i enlighet med
          integritetspolicyn. Vill du att din annons eller ditt innehåll inte används i marknadsföring, kontakta{' '}
          <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a>.
        </p>

        <h2>4. Betalning</h2>

        <h3>4.1 Betalning sker utanför Svippo</h3>
        <p>
          Svippo hanterar inga betalningar. All ersättning för utförda tjänster betalas direkt mellan beställaren och
          utföraren, utanför plattformen. Parterna ansvarar själva för att komma överens om betalningssätt, belopp och
          tidpunkt.
        </p>

        <h3>4.2 Priser och prisförändringar</h3>
        <p>
          Priser som anges på Svippo är de priser utföraren erbjuder. Prisändringar under ett pågående uppdrag kan
          föreslås av utföraren och måste godkännas av beställaren via plattformen innan de träder i kraft. Svippo
          loggar godkända prisförändringar som en del av uppdragsdokumentationen.
        </p>

        <h3>4.3 Svippos ansvar för betalning</h3>
        <p>
          Svippo tar inget ansvar för betalningar som inte genomförs, betalningar som sker i strid med gällande
          lagstiftning, eller tvister som rör betalningens storlek eller tidpunkt. Svippo kan agera som medlare vid
          tvister men är aldrig ekonomiskt ansvarig för utfallet.
        </p>

        <h2>5. Användares ansvar och förbjudet beteende</h2>

        <h3>5.1 Allmänt ansvar</h3>
        <p>
          Du ansvarar för allt innehåll du publicerar på Svippo och för hur du agerar gentemot andra användare. Du
          förbinder dig att använda plattformen på ett lagligt, hederligt och respektfullt sätt.
        </p>

        <h3>5.2 Förbjudet beteende</h3>
        <p>Det är förbjudet att på Svippo:</p>
        <ul>
          <li>Publicera falsk, vilseledande eller felaktig information om dig själv, dina tjänster eller din verksamhet.</li>
          <li>Använda en annan persons identitet eller utge sig för att representera en organisation utan befogenhet.</li>
          <li>Erbjuda eller efterfråga tjänster som är olagliga enligt svensk eller EU-rättslig lagstiftning.</li>
          <li>Trakassera, hota eller kränka andra användare.</li>
          <li>Sprida spam, oönskad marknadsföring eller skadlig kod.</li>
          <li>Försöka kringgå Svippos system, säkerhetsåtgärder eller dessa villkor.</li>
          <li>Genomföra betalningar på ett sätt som strider mot gällande skattelagstiftning.</li>
          <li>
            Använda plattformen för att ingå avtal som sedan genomförs utanför Svippo i syfte att kringgå
            plattformens villkor.
          </li>
        </ul>

        <h3>5.3 Innehåll du publicerar</h3>
        <p>
          Allt innehåll du publicerar på Svippo – annonser, beskrivningar, bilder, meddelanden – måste vara korrekt,
          lagligt och inte kränkande. Du får inte publicera innehåll som kränker upphovsrätt eller andra immateriella
          rättigheter.
        </p>

        <h3>5.4 Marknadsföring</h3>
        <p>
          Svippo skickar inte marknadsföring utan ditt samtycke. Om du väljer att prenumerera på nyhetsbrev eller
          liknande kan du när som helst avregistrera dig via länken i utskicket eller genom att kontakta{' '}
          <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a>.
        </p>

        <h2>6. Svippos roll och ansvar</h2>

        <h3>6.1 Svippo som förmedlare</h3>
        <p>
          Svippo är en neutral plattform som förmedlar kontakt mellan användare. Svippo verifierar inte utförares
          kompetens, bakgrund eller identitet utöver vad som anges vid registreringen. Svippo garanterar inte att en
          tjänst kommer att utföras, levereras i tid eller hålla en viss kvalitet.
        </p>

        <h3>6.2 Tillgänglighet och driftstopp</h3>
        <p>
          Svippo garanterar inte att plattformen är tillgänglig utan avbrott. Svippo ansvarar inte för förluster eller
          olägenheter som uppstår till följd av tekniska fel, planerat underhåll eller oförutsedda driftstopp. Svippo
          strävar efter att meddela användare om planerade avbrott i god tid.
        </p>

        <h3>6.3 Ansvarsbegränsning</h3>
        <p>Svippo ansvarar inte för:</p>
        <ul>
          <li>Skador som uppstår till följd av uppdrag som förmedlats via plattformen.</li>
          <li>Utebliven betalning mellan parterna.</li>
          <li>Förlust av data, intäkter eller affärsmöjligheter till följd av tekniska fel eller driftstopp.</li>
          <li>Innehåll som publiceras av användare på plattformen.</li>
          <li>Handlingar eller underlåtenheter av utförare eller beställare.</li>
        </ul>
        <p>
          Svippos totala ansvar gentemot en enskild användare är under alla omständigheter begränsat till 1 000
          kronor. Svippo är en kostnadsfri tjänst och ansvarsbegränsningen återspeglar detta.
        </p>

        <h3>6.4 Force majeure</h3>
        <p>
          Svippo ansvarar inte för förseningar eller misslyckanden att uppfylla sina åtaganden om detta beror på
          omständigheter utanför Svippos rimliga kontroll, inklusive men inte begränsat till naturkatastrofer, krig,
          pandemi, strömavbrott, cyberattacker eller beslut av myndigheter. Svippo meddelar drabbade användare så
          snart det är möjligt och strävar efter att återuppta normal drift så snabbt som möjligt.
        </p>

        <h3>6.5 Svippos rätt att agera</h3>
        <p>Svippo förbehåller sig rätten att:</p>
        <ul>
          <li>Ta bort innehåll som bryter mot dessa villkor eller gällande lag.</li>
          <li>Tillfälligt eller permanent stänga konton som bryter mot dessa villkor.</li>
          <li>Neka registrering utan att ange skäl.</li>
          <li>Ändra, begränsa eller avveckla delar av plattformens funktionalitet.</li>
        </ul>

        <h3>6.6 Avveckling av tjänsten</h3>
        <p>
          Om Svippo beslutar att avveckla plattformen helt meddelas registrerade användare via e-post minst 30 dagar i
          förväg. Uppgifter om pågående uppdrag och orderhistorik görs tillgängliga för nedladdning under
          avvecklingsperioden.
        </p>

        <h2>7. Tvister mellan användare</h2>

        <h3>7.1 Parterna löser tvisten i första hand</h3>
        <p>
          Om en tvist uppstår mellan en beställare och en utförare uppmanas parterna i första hand att lösa den
          sinsemellan via Svippos kommunikationsverktyg.
        </p>

        <h3>7.2 Svippos medling</h3>
        <p>
          Om parterna inte kan lösa tvisten på egen hand kan de kontakta Svippo på{' '}
          <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a> och begära medling. Svippo kan granska
          kommunikation, prishistorik och orderbekräftelsen som stöd i medlingen. Svippo fattar inga bindande beslut
          men kan agera som neutral part.
        </p>

        <h3>7.3 Externa tvistlösningsorgan</h3>
        <p>Om en tvist inte kan lösas via Svippos medling kan parterna vända sig till:</p>
        <ul>
          <li>
            Allmänna reklamationsnämnden (ARN) – för tvister mellan konsumenter och näringsidkare. Kostnadsfritt.{' '}
            <a href="https://www.arn.se" target="_blank" rel="noopener noreferrer">arn.se</a>
          </li>
          <li>Hallakonsument.se – råd och vägledning för konsumenter. Drivs av Konsumentverket.</li>
          <li>
            Konsumentverket – tillsynsmyndighet för konsumentfrågor.{' '}
            <a href="https://www.konsumentverket.se" target="_blank" rel="noopener noreferrer">konsumentverket.se</a>
          </li>
          <li>Allmän domstol – tvister kan alltid prövas i allmän domstol.</li>
        </ul>
        <p>
          <em>
            Notera: ARN prövar i första hand tvister där en konsument köper av ett företag. Tvister mellan två
            privatpersoner faller i regel utanför ARNs prövningsområde.
          </em>
        </p>

        <h3>7.4 Tillämplig lag och forum</h3>
        <p>
          Dessa villkor styrs av svensk rätt. Tvister prövas av svensk allmän domstol med Kramfors tingsrätt som
          första instans.
        </p>

        <h2>8. Ångerrätt</h2>
        <p>
          Svippo är en kostnadsfri tjänst och erbjuder för närvarande inga betalda prenumerationer eller produkter.
          Ångerrätten enligt distansavtalslagen är därför inte tillämplig på registrering av ett gratiskonto.
        </p>
        <p>
          Om Svippo i framtiden erbjuder betalda tjänster kommer information om ångerrätt att lämnas i samband med
          köpet i enlighet med distansavtalslagen (2005:59). Konsumenter har då i regel 14 dagars ångerrätt från
          köpdatumet.
        </p>

        <h2>9. Personuppgifter och GDPR</h2>
        <p>
          Svippo behandlar personuppgifter i enlighet med EU:s dataskyddsförordning (GDPR). Hur vi samlar in, lagrar
          och använder dina personuppgifter – inklusive uppdragshistorik, belopp, kategorier och beteendedata på
          plattformen – beskrivs i vår integritetspolicy på svippo.se/integritetspolicy.
        </p>
        <p>
          Svippo är personuppgiftsansvarig. Frågor om din data eller utövande av dina GDPR-rättigheter skickas till{' '}
          <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a>.
        </p>
        <p>
          Den svenska tillsynsmyndigheten är Integritetsskyddsmyndigheten (IMY). Du har rätt att lämna klagomål till
          IMY om du anser att vi hanterar dina personuppgifter felaktigt.{' '}
          <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer">imy.se</a>
        </p>
        <p>
          Svippo använder cookies på plattformen. Information om vilka cookies vi använder och hur du hanterar dem
          finns i vår cookiepolicy på svippo.se/cookies.
        </p>

        <h2>10. Immateriella rättigheter</h2>

        <h3>10.1 Svippos rättigheter</h3>
        <p>
          Svippo äger alla rättigheter till plattformen, dess design, kod, logotyp och varumärke. Inget i dessa villkor
          ger användare rätt att använda Svippos varumärke eller immateriella egendom utan skriftligt tillstånd.
        </p>

        <h3>10.2 Ditt innehåll</h3>
        <p>
          Du behåller äganderätten till det innehåll du publicerar på Svippo. Genom att publicera innehåll ger du
          Svippo en icke-exklusiv, royaltyfri licens att använda, visa, lagra och marknadsföra innehållet i syfte att driva
          och marknadsföra plattformen, i enlighet med avsnitt 3.4.
        </p>

        <h2>11. Moderering, avstängningar och borttagning av innehåll</h2>
        <p>Svippo är en öppen plattform men inte en oreglerad en. Vi har nolltolerans mot bedrägeri, hat och missbruk.</p>

        <h3>11.1 Innehåll vi tar bort</h3>
        <p>Svippo förbehåller sig rätten att omedelbart ta bort innehåll som:</p>
        <ul>
          <li>Är falskt, vilseledande eller bedrägligt – t.ex. bluffannonser eller falska recensioner.</li>
          <li>Innehåller hat, diskriminering, hotelser eller trakasserier.</li>
          <li>Strider mot svensk lag eller EU-rätt.</li>
          <li>Marknadsför olagliga varor eller tjänster.</li>
          <li>Innehåller personuppgifter om tredje part utan samtycke.</li>
          <li>Är spam eller automatgenererat innehåll utan värde för plattformen.</li>
        </ul>
        <p>
          Svippo behöver inte meddela användaren i förväg vid borttagning av innehåll som bedöms vara skadligt,
          olagligt eller bedrägligt.
        </p>

        <h3>11.2 Varningar och tillfälliga avstängningar</h3>
        <p>
          Vid mindre eller första överträdelser kan Svippo utfärda en varning och tillfälligt begränsa kontots
          funktionalitet, t.ex. avpublicera annonser, begränsa meddelandemöjligheten eller förhindra nya beställningar
          under utredningsperioden. Svippo strävar efter att meddela användaren om åtgärden och skälen, utom när ett
          meddelande kan försvåra en utredning.
        </p>

        <h3>11.3 Permanent bannlysning</h3>
        <p>Svippo kan permanent stänga ett konto utan förvarning om användaren:</p>
        <ul>
          <li>Upprepat brutit mot dessa villkor efter tidigare varning.</li>
          <li>Bedrivit bedrägeri eller försökt lura andra användare.</li>
          <li>Publicerat hat, hot eller trakasserier av allvarlig karaktär.</li>
          <li>Använt plattformen för olaglig verksamhet.</li>
          <li>Skapat ett falskt konto eller utgivit sig för att vara någon annan.</li>
          <li>Försökt kringgå en tidigare avstängning genom att skapa ett nytt konto.</li>
        </ul>
        <p>
          Vid permanent bannlysning raderas aktiva annonser och förfrågningar. Historik som krävs för pågående tvister
          eller lagstadgad rapportering bevaras.
        </p>

        <h3>11.4 Rapportera missbruk</h3>
        <p>
          Missbruk rapporteras via rapportera-knappen på annonser och profiler i plattformen, eller via{' '}
          <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a> med ämnesraden &quot;Rapportera missbruk&quot;. Svippo
          återkopplar inom 5 arbetsdagar. Den som rapporteras meddelas inte vem som lämnat rapporten.
        </p>

        <h3>11.5 Överklaga ett beslut</h3>
        <p>
          Om ditt konto eller innehåll har tagits bort och du anser att beslutet är felaktigt kan du begära omprövning
          via <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a> med ämnesraden &quot;Överklaga beslut&quot;. Svippo
          återkopplar inom 10 arbetsdagar.
        </p>

        <h2>12. Ändringar av villkoren</h2>
        <p>
          Svippo kan uppdatera dessa allmänna villkor. Vid väsentliga ändringar meddelas registrerade användare via
          e-post minst 14 dagar innan ändringarna träder i kraft. Fortsatt användning av plattformen innebär att du
          accepterar de uppdaterade villkoren. Den senaste versionen finns alltid på svippo.se/villkor.
        </p>

        <h2>13. Kontakt och klagomål</h2>
        <p>Om du har frågor om dessa villkor eller vill lämna ett klagomål:</p>

        <div className={styles.villkor__contact}>
          <p><strong>Svippo AB</strong></p>
          <p>Org.nr: 559385-9928</p>
          <p>Postadress: Svartnoranästet 520, 872 94 Sandöverken</p>
          <p>E-post: <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a></p>
          <p>Telefon: 020-105 707</p>
          <p>Öppettider: Måndag–fredag 09–17</p>
        </div>

        <p>Klagomål besvaras inom 5 arbetsdagar.</p>

        <p className={styles.villkor__footer_note}>Svippo AB · Org.nr 559385-9928 · kontakt@svippo.se</p>
      </div>
    </div>
  )
}
