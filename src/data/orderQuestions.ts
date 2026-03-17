type Question = {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea'
  placeholder?: string
  options?: string[]
  required?: boolean
}

type SubcategoryQuestions = {
  [subcategory: string]: Question[]
}

export const orderQuestions: SubcategoryQuestions = {

  // Hushållstjänster
  'Städning': [
    { id: 'rooms', label: 'Antal rum', type: 'number', placeholder: 'T.ex. 4', required: true },
    { id: 'size', label: 'Bostadens storlek (kvm)', type: 'number', placeholder: 'T.ex. 80' },
    { id: 'equipment', label: 'Har du städutrustning?', type: 'select', options: ['Ja', 'Nej', 'Delvis'], required: true },
    { id: 'frequency', label: 'Hur ofta?', type: 'select', options: ['Engångsstädning', 'Varje vecka', 'Varannan vecka', 'En gång i månaden'] },
  ],
  'Fönsterputsning': [
    { id: 'windows', label: 'Antal fönster', type: 'number', placeholder: 'T.ex. 10', required: true },
    { id: 'floors', label: 'Antal våningar', type: 'number', placeholder: 'T.ex. 2' },
    { id: 'equipment', label: 'Har du utrustning?', type: 'select', options: ['Ja', 'Nej'] },
  ],
  'Trädgård & utemiljö': [
    { id: 'size', label: 'Trädgårdens storlek (kvm)', type: 'number', placeholder: 'T.ex. 200' },
    { id: 'tasks', label: 'Vad behöver göras?', type: 'select', options: ['Gräsklippning', 'Ogräsrensning', 'Häckklippning', 'Allt', 'Annat'] },
    { id: 'equipment', label: 'Har du utrustning?', type: 'select', options: ['Ja', 'Nej', 'Delvis'] },
  ],
  'Hundvakt & djurskötsel': [
    { id: 'animal', label: 'Vilket djur?', type: 'select', options: ['Hund', 'Katt', 'Kanin', 'Annat'], required: true },
    { id: 'count', label: 'Antal djur', type: 'number', placeholder: 'T.ex. 2', required: true },
    { id: 'food', label: 'Har du mat till djuret?', type: 'select', options: ['Ja', 'Nej'] },
    { id: 'duration', label: 'Hur länge?', type: 'select', options: ['Några timmar', 'En dag', 'Flera dagar', 'En vecka eller mer'] },
  ],
  'Barnpassning': [
    { id: 'count', label: 'Antal barn', type: 'number', placeholder: 'T.ex. 2', required: true },
    { id: 'age', label: 'Barnens ålder', type: 'text', placeholder: 'T.ex. 3 och 6 år', required: true },
    { id: 'duration', label: 'Hur länge?', type: 'select', options: ['Några timmar', 'Halvdag', 'Heldag', 'Flera dagar'] },
    { id: 'tasks', label: 'Ingår matlagning?', type: 'select', options: ['Ja', 'Nej', 'Spelar ingen roll'] },
  ],
  'Matlagning': [
    { id: 'people', label: 'Antal personer', type: 'number', placeholder: 'T.ex. 4', required: true },
    { id: 'diet', label: 'Kostrestriktioner?', type: 'text', placeholder: 'T.ex. vegetarisk, glutenfri' },
    { id: 'shopping', label: 'Ska utföraren handla?', type: 'select', options: ['Ja', 'Nej'] },
  ],
  'Däckbyte': [
    { id: 'carModel', label: 'Bilmodell', type: 'text', placeholder: 'T.ex. Volvo V70 2018', required: true },
    { id: 'tireType', label: 'Däcktyp', type: 'select', options: ['Sommardäck', 'Vinterdäck', 'Helårsdäck'], required: true },
    { id: 'rimType', label: 'Fälgtyp', type: 'select', options: ['Stålfälgar', 'Alufälgar'] },
    { id: 'storage', label: 'Behöver däck lagras?', type: 'select', options: ['Ja', 'Nej'] },
  ],
  'Biltvätt': [
    { id: 'carModel', label: 'Bilmodell', type: 'text', placeholder: 'T.ex. BMW 3-serie', required: true },
    { id: 'type', label: 'Typ av tvätt', type: 'select', options: ['Utvändig', 'Invändig', 'Både och'], required: true },
    { id: 'extras', label: 'Tillval', type: 'select', options: ['Ingen', 'Polering', 'Vaxning', 'Motortvättning'] },
  ],
  'Bilreparation': [
    { id: 'carModel', label: 'Bilmodell', type: 'text', placeholder: 'T.ex. Toyota Corolla 2015', required: true },
    { id: 'problem', label: 'Beskriv problemet', type: 'textarea', placeholder: 'Vad är det för fel på bilen?', required: true },
  ],
  'Körning & transport': [
    { id: 'from', label: 'Från', type: 'text', placeholder: 'Adress eller stad', required: true },
    { id: 'to', label: 'Till', type: 'text', placeholder: 'Adress eller stad', required: true },
    { id: 'when', label: 'När?', type: 'text', placeholder: 'T.ex. imorgon kl 14:00' },
  ],
  'Webbutveckling': [
    { id: 'domain', label: 'Har du en domän?', type: 'select', options: ['Ja', 'Nej', 'Vet ej'], required: true },
    { id: 'cms', label: 'Vilket CMS/plattform?', type: 'select', options: ['WordPress', 'Squarespace', 'Wix', 'Eget', 'Vet ej'] },
    { id: 'pages', label: 'Antal sidor', type: 'number', placeholder: 'T.ex. 5' },
    { id: 'deadline', label: 'Önskad deadline', type: 'text', placeholder: 'T.ex. inom 2 veckor' },
  ],
  'App-utveckling': [
    { id: 'platform', label: 'Plattform', type: 'select', options: ['iOS', 'Android', 'Båda', 'Webb-app'], required: true },
    { id: 'description', label: 'Beskriv appen', type: 'textarea', placeholder: 'Vad ska appen göra?', required: true },
    { id: 'deadline', label: 'Önskad deadline', type: 'text', placeholder: 'T.ex. inom 3 månader' },
  ],
  'SEO & marknadsföring': [
    { id: 'platform', label: 'Vilken plattform?', type: 'select', options: ['Google', 'Instagram', 'Facebook', 'TikTok', 'Flera'] },
    { id: 'goal', label: 'Mål', type: 'select', options: ['Fler besökare', 'Fler följare', 'Fler köp', 'Varumärkeskännedom'] },
    { id: 'budget', label: 'Månatlig budget (kr)', type: 'number', placeholder: 'T.ex. 2000' },
  ],
  'Sociala medier': [
    { id: 'platform', label: 'Vilken plattform?', type: 'select', options: ['Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'Flera'], required: true },
    { id: 'posts', label: 'Antal inlägg per månad', type: 'number', placeholder: 'T.ex. 8' },
    { id: 'tone', label: 'Ton/stil', type: 'select', options: ['Professionell', 'Lekfull', 'Inspirerande', 'Informativ'] },
  ],
  'IT-support': [
    { id: 'device', label: 'Enhet', type: 'select', options: ['Dator (Windows)', 'Dator (Mac)', 'Telefon', 'Surfplatta', 'Annat'], required: true },
    { id: 'problem', label: 'Beskriv problemet', type: 'textarea', placeholder: 'Vad är det för problem?', required: true },
    { id: 'remote', label: 'Kan det lösas på distans?', type: 'select', options: ['Ja', 'Nej', 'Vet ej'] },
  ],
  'Programmering': [
    { id: 'language', label: 'Programmeringsspråk', type: 'text', placeholder: 'T.ex. Python, JavaScript' },
    { id: 'description', label: 'Beskriv uppdraget', type: 'textarea', placeholder: 'Vad ska byggas/fixas?', required: true },
    { id: 'deadline', label: 'Deadline', type: 'text', placeholder: 'T.ex. inom 1 vecka' },
  ],
  'Grafisk design': [
    { id: 'format', label: 'Vad behöver du?', type: 'select', options: ['Logotyp', 'Banner', 'Affisch', 'Visitkort', 'Annat'], required: true },
    { id: 'colors', label: 'Har du färger/varumärke?', type: 'select', options: ['Ja', 'Nej'] },
    { id: 'fileFormat', label: 'Filformat', type: 'select', options: ['PNG', 'SVG', 'PDF', 'Spelar ingen roll'] },
    { id: 'deadline', label: 'Deadline', type: 'text', placeholder: 'T.ex. inom 1 vecka' },
  ],
  'Logotyp & varumärke': [
    { id: 'style', label: 'Stil', type: 'select', options: ['Minimalistisk', 'Lekfull', 'Professionell', 'Vintage', 'Modern'] },
    { id: 'colors', label: 'Önskade färger', type: 'text', placeholder: 'T.ex. blå och vit' },
    { id: 'references', label: 'Har du inspirationsbilder?', type: 'select', options: ['Ja, bifogar separat', 'Nej'] },
  ],
  'Foto & video': [
    { id: 'type', label: 'Vad ska fotograferas/filmas?', type: 'select', options: ['Porträtt', 'Produkt', 'Event', 'Fastighet', 'Annat'], required: true },
    { id: 'duration', label: 'Ungefärlig tid', type: 'select', options: ['1 timme', '2-3 timmar', 'Heldag', 'Flera dagar'] },
    { id: 'editing', label: 'Ingår redigering?', type: 'select', options: ['Ja', 'Nej', 'Diskuteras'] },
  ],
  'Redigering': [
    { id: 'type', label: 'Typ av redigering', type: 'select', options: ['Foto', 'Video', 'Podcast', 'Annat'], required: true },
    { id: 'length', label: 'Längd/antal filer', type: 'text', placeholder: 'T.ex. 5 min video eller 20 bilder' },
    { id: 'deadline', label: 'Deadline', type: 'text', placeholder: 'T.ex. inom 3 dagar' },
  ],
  'Illustration': [
    { id: 'style', label: 'Stil', type: 'select', options: ['Realistisk', 'Cartoon', 'Minimalistisk', 'Abstrakt', 'Annat'] },
    { id: 'usage', label: 'Användningsområde', type: 'select', options: ['Webb', 'Print', 'Social media', 'Personligt', 'Annat'] },
    { id: 'deadline', label: 'Deadline', type: 'text', placeholder: 'T.ex. inom 2 veckor' },
  ],
  'UX & UI design': [
    { id: 'platform', label: 'Plattform', type: 'select', options: ['Webb', 'iOS', 'Android', 'Båda'], required: true },
    { id: 'screens', label: 'Antal skärmar/sidor', type: 'number', placeholder: 'T.ex. 10' },
    { id: 'tool', label: 'Designverktyg', type: 'select', options: ['Figma', 'Adobe XD', 'Sketch', 'Spelar ingen roll'] },
  ],
  'Läxhjälp': [
    { id: 'subject', label: 'Ämne', type: 'text', placeholder: 'T.ex. Matematik', required: true },
    { id: 'level', label: 'Nivå', type: 'select', options: ['Grundskola', 'Gymnasium', 'Universitet'], required: true },
    { id: 'frequency', label: 'Hur ofta?', type: 'select', options: ['En gång', 'Varje vecka', 'Varannan vecka'] },
    { id: 'online', label: 'Digitalt eller fysiskt?', type: 'select', options: ['Digitalt', 'Fysiskt', 'Spelar ingen roll'] },
  ],
  'Språkundervisning': [
    { id: 'language', label: 'Vilket språk?', type: 'text', placeholder: 'T.ex. Spanska', required: true },
    { id: 'level', label: 'Nuvarande nivå', type: 'select', options: ['Nybörjare', 'Grundläggande', 'Medel', 'Avancerad'] },
    { id: 'goal', label: 'Mål', type: 'text', placeholder: 'T.ex. klara ett prov, resa' },
    { id: 'frequency', label: 'Hur ofta?', type: 'select', options: ['En gång', 'Varje vecka', 'Varannan vecka'] },
  ],
  'Musikundervisning': [
    { id: 'instrument', label: 'Instrument', type: 'text', placeholder: 'T.ex. gitarr, piano', required: true },
    { id: 'level', label: 'Nivå', type: 'select', options: ['Nybörjare', 'Grundläggande', 'Medel', 'Avancerad'] },
    { id: 'age', label: 'Ålder på elev', type: 'text', placeholder: 'T.ex. 12 år eller vuxen' },
  ],
  'Coaching': [
    { id: 'area', label: 'Område', type: 'select', options: ['Karriär', 'Hälsa', 'Relationer', 'Ledarskap', 'Annat'], required: true },
    { id: 'goal', label: 'Vad vill du uppnå?', type: 'textarea', placeholder: 'Beskriv ditt mål' },
    { id: 'sessions', label: 'Antal sessioner', type: 'select', options: ['En testsession', '5 sessioner', '10 sessioner', 'Diskuteras'] },
  ],
  'Körkortsundervisning': [
    { id: 'type', label: 'Typ', type: 'select', options: ['Manuell', 'Automat'], required: true },
    { id: 'experience', label: 'Tidigare erfarenhet', type: 'select', options: ['Nybörjare', 'Lite erfarenhet', 'Haft uppehåll'] },
    { id: 'goal', label: 'Mål', type: 'select', options: ['Ta körkort', 'Öva inför prov', 'Fräscha upp'] },
  ],
  'Frisör': [
    { id: 'service', label: 'Tjänst', type: 'select', options: ['Klippning', 'Färgning', 'Slingor', 'Styling', 'Annat'], required: true },
    { id: 'hairLength', label: 'Hårlängd', type: 'select', options: ['Kort', 'Medel', 'Långt'] },
    { id: 'location', label: 'Var?', type: 'select', options: ['Hos utföraren', 'Hemma hos mig'] },
  ],
  'Naglar': [
    { id: 'service', label: 'Tjänst', type: 'select', options: ['Manikyr', 'Pedikyr', 'Gelé', 'Akryl', 'Nageldekoration'], required: true },
    { id: 'location', label: 'Var?', type: 'select', options: ['Hos utföraren', 'Hemma hos mig'] },
  ],
  'Massage': [
    { id: 'type', label: 'Typ av massage', type: 'select', options: ['Klassisk', 'Djupvävnad', 'Sportmassage', 'Avslappning'], required: true },
    { id: 'duration', label: 'Längd', type: 'select', options: ['30 min', '60 min', '90 min'] },
    { id: 'location', label: 'Var?', type: 'select', options: ['Hos utföraren', 'Hemma hos mig'] },
  ],
  'Makeup': [
    { id: 'occasion', label: 'Tillfälle', type: 'select', options: ['Vardag', 'Fest', 'Bröllop', 'Foto/video', 'Annat'], required: true },
    { id: 'location', label: 'Var?', type: 'select', options: ['Hos utföraren', 'Hemma hos mig'] },
  ],
  'Personlig träning': [
    { id: 'goal', label: 'Träningsmål', type: 'select', options: ['Gå ner i vikt', 'Bygga muskler', 'Förbättra kondition', 'Rehabilitering', 'Annat'], required: true },
    { id: 'level', label: 'Träningsnivå', type: 'select', options: ['Nybörjare', 'Medel', 'Erfaren'] },
    { id: 'location', label: 'Var?', type: 'select', options: ['Gym', 'Utomhus', 'Hemma', 'Digitalt'] },
    { id: 'frequency', label: 'Hur ofta?', type: 'select', options: ['En gång/vecka', 'Två gånger/vecka', 'Tre gånger/vecka', 'Diskuteras'] },
  ],
  'Kostrådgivning': [
    { id: 'goal', label: 'Mål', type: 'select', options: ['Gå ner i vikt', 'Bygga muskler', 'Äta hälsosammare', 'Hantera sjukdom', 'Annat'], required: true },
    { id: 'diet', label: 'Kostrestriktioner?', type: 'text', placeholder: 'T.ex. vegetarisk, laktosintolerant' },
    { id: 'sessions', label: 'Antal sessioner', type: 'select', options: ['En konsultation', 'Löpande', 'Diskuteras'] },
  ],
  'Snickeri': [
    { id: 'task', label: 'Vad ska göras?', type: 'textarea', placeholder: 'T.ex. bygga staket, montera hyllor', required: true },
    { id: 'materials', label: 'Har du material?', type: 'select', options: ['Ja', 'Nej', 'Delvis'] },
    { id: 'timeline', label: 'Tidsram', type: 'text', placeholder: 'T.ex. nästa vecka' },
  ],
  'Målning': [
    { id: 'area', label: 'Vad ska målas?', type: 'select', options: ['Innerväggar', 'Ytterväggar', 'Tak', 'Möbler', 'Annat'], required: true },
    { id: 'size', label: 'Ungefärlig yta (kvm)', type: 'number', placeholder: 'T.ex. 40' },
    { id: 'paint', label: 'Har du färg?', type: 'select', options: ['Ja', 'Nej'] },
  ],
  'El-arbeten': [
    { id: 'task', label: 'Beskriv uppdraget', type: 'textarea', placeholder: 'T.ex. installera uttag, byta säkring', required: true },
    { id: 'urgent', label: 'Brådskande?', type: 'select', options: ['Ja', 'Nej'] },
  ],
  'VVS': [
    { id: 'task', label: 'Beskriv problemet', type: 'textarea', placeholder: 'T.ex. läckande kran, igensatt avlopp', required: true },
    { id: 'urgent', label: 'Brådskande?', type: 'select', options: ['Ja', 'Nej'] },
  ],
  'Kakling': [
    { id: 'area', label: 'Vad ska kaklas?', type: 'select', options: ['Badrum', 'Kök', 'Annat'], required: true },
    { id: 'size', label: 'Yta (kvm)', type: 'number', placeholder: 'T.ex. 10' },
    { id: 'tiles', label: 'Har du kakel?', type: 'select', options: ['Ja', 'Nej'] },
  ],
  'Montering': [
    { id: 'task', label: 'Vad ska monteras?', type: 'text', placeholder: 'T.ex. IKEA möbler, TV-väggfäste', required: true },
    { id: 'items', label: 'Antal föremål', type: 'number', placeholder: 'T.ex. 3' },
    { id: 'tools', label: 'Har du verktyg?', type: 'select', options: ['Ja', 'Nej', 'Delvis'] },
  ],
  'Flyttpjälp': [
    { id: 'from', label: 'Från', type: 'text', placeholder: 'Adress', required: true },
    { id: 'to', label: 'Till', type: 'text', placeholder: 'Adress', required: true },
    { id: 'volume', label: 'Ungefärlig volym', type: 'select', options: ['Några kartonger', 'Ett rum', 'Lägenhet', 'Villa'] },
    { id: 'elevator', label: 'Finns hiss?', type: 'select', options: ['Ja', 'Nej', 'På en adress'] },
    { id: 'date', label: 'Önskat datum', type: 'text', placeholder: 'T.ex. 2026-04-15' },
  ],
  'Budtjänst': [
    { id: 'from', label: 'Upphämtning', type: 'text', placeholder: 'Adress', required: true },
    { id: 'to', label: 'Leverans', type: 'text', placeholder: 'Adress', required: true },
    { id: 'size', label: 'Paketets storlek', type: 'select', options: ['Litet (passar i ryggsäck)', 'Medel (passar i bil)', 'Stort (skåpbil behövs)'] },
    { id: 'urgent', label: 'Brådskande?', type: 'select', options: ['Ja, samma dag', 'Nästa dag', 'Spelar ingen roll'] },
  ],
  'Skräphantering': [
    { id: 'type', label: 'Typ av skräp', type: 'select', options: ['Bohag/möbler', 'Byggavfall', 'Trädgårdsavfall', 'Blandat'], required: true },
    { id: 'volume', label: 'Ungefärlig mängd', type: 'select', options: ['Lite (några säckar)', 'Medel (halvt flak)', 'Mycket (fullt flak)'] },
    { id: 'location', label: 'Var finns skräpet?', type: 'text', placeholder: 'T.ex. källare, trädgård' },
  ],
  'Möbeltransport': [
    { id: 'items', label: 'Vad ska transporteras?', type: 'textarea', placeholder: 'T.ex. soffa, säng, matbord', required: true },
    { id: 'from', label: 'Från', type: 'text', placeholder: 'Adress', required: true },
    { id: 'to', label: 'Till', type: 'text', placeholder: 'Adress', required: true },
    { id: 'floor', label: 'Våning', type: 'text', placeholder: 'T.ex. 3 trappor upp' },
  ],
}