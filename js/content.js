// === content.js ===
// HIER werden Teens, Fragen, Fotos & Quiz-Sets vorbereitet.
// Der Host wählt am Abend nur noch "welches Set starten?" — fertig.
//
// THEMA: Hollywood-Gala – die Teens sind die VIPs auf dem roten Teppich,
// die Gäste sind Publikum/Reporter und raten/tippen mit.

window.TeensContent = {

  // Titel/Untertitel auf Login & Beamer (✦ wird automatisch ergänzt)
  eventTitle: "TEENS CONNECT",
  subtitle:   "LIFESTYLE · Teensabschluss",
  eventLocation: "Funkenpark",
  eventDate:     "21. Juni 2026 · 10:00 Uhr",

  // ─── HOST-SCHUTZ ───────────────────────────────────────
  // PIN, damit nicht jeder per 3×-Logo-Tipp Host werden kann.
  // (Steht im Quelltext → kein echtes Geheimnis, aber stoppt Spässe.)
  // Leer ("") = kein PIN nötig.
  hostPin: "4800",

  // ─── AUTO-AUFLÖSUNG ────────────────────────────────────
  // true  = nach Ablauf des Countdowns wird automatisch aufgelöst.
  // false = der Host löst jede Frage von Hand auf ("Jetzt auflösen").
  // (Global; im Host-Tab gibt es zusätzlich einen Schalter fürs Umstellen.)
  autoReveal: true,

  // ─── TEAM-WERTUNG (Ø-Punkte pro Runde, kumuliert) ──────
  // Pro Frage erhält jedes Team die DURCHSCHNITTLICHE Punktzahl seiner
  // abgegebenen Antworten: Summe der (zeitabhängigen) Punkte aller RICHTIGEN
  // Tipps ÷ Anzahl ABGEGEBENER Antworten des Teams. Beispiel: 40 von 50 Fans
  // tippen, 30 richtig → deren Zeitpunkte (500–1000) summiert ÷ 40 ≈ 630 Pkt.
  // Diese Ø-Punkte werden dem Team gutgeschrieben (kein "Rundensieg" mehr) →
  // alle werden belohnt, nicht nur der/die Erste.
  //  "answered" = ÷ Anzahl Antwortende (Standard, wie besprochen)
  //  "members"  = ÷ alle Fans des Teams (auch wer nicht tippt → senkt den Ø)
  teamAvgDenominator: "answered",

  // ─── BILD PROGRESSIV ENTPIXELN ─────────────────────────
  // true = Foto startet stark verpixelt/verschwommen und wird über den
  // Countdown stetig schärfer (früh antworten = schwerer, aber mehr Tempo-Pkt).
  photoReveal: false,
  photoBlurMax: 10,   // Stärke der Anfangs-Unschärfe in px

  // Login-Button für Gäste, die sich (noch) keinem Teen zuordnen wollen.
  // NEU: Wer das wählt, wird automatisch dem Team mit den AKTUELL wenigsten
  // Fans zugeteilt → die ~160 Gäste verteilen sich gleichmässig auf die 5
  // Teens (wichtig für die faire, relative Team-Wertung).
  neutralLabel: "🎲 Noch offen – automatisch zuteilen",

  // Farb-Palette für Antwort-Optionen bei den Bibel-Fragen (zyklisch)
  optionColors: ["#d4af37", "#e85a5a", "#6ba3c7", "#7ed987", "#b98ce8", "#e8a555"],

  // ═══════════════════════════════════════════════════════
  // DIE TEENS  (id = intern, name = Anzeige, color = Farbe)
  // Reihenfolge = Reihenfolge der Antwort-Buttons.
  //
  // FOTOS (siehe README → "Fotos ablegen"):
  //   1. Foto in Firebase Storage hochladen, Ordner z.B.  connect/teens/
  //      Dateinamen z.B.  t1.jpg, t2.jpg …
  //   2. In der Firebase-Konsole das Bild öffnen → "Download-URL" kopieren
  //   3. Die URL hier bei  photo:  einsetzen.
  //   (Leer lassen = es wird das emoji als Platzhalter angezeigt.)
  // ═══════════════════════════════════════════════════════
  // (Pseudo-Namen – am Event durch die echten Teens ersetzen)
  teens: [

    { id: "t1", name: "Jeditha",  emoji: "👧", color: "#e8a4b8", photo: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/TeensAbschluss_Welcome_Jeditha.jpeg?alt=media&token=a8ec1b54-3d68-403d-8cfc-7589c9be0ad7" },
    { id: "t2", name: "Linda",  emoji: "👧", color: "#6ba3c7", photo: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/TeensAbschluss_Welcome_Linda.jpeg?alt=media&token=ed162709-849c-4a3f-8400-afaca51539a6" },
    { id: "t3", name: "Joshua", emoji: "🧑", color: "#7ed987", photo: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/TeensAbschluss_Welcome_Joshi.jpeg?alt=media&token=f8ff2b09-e727-43b3-a580-89f1a62c5488" },
    { id: "t4", name: "Ruby",   emoji: "👧", color: "#e8a555", photo: "https://images.pexels.com/photos/3988848/pexels-photo-3988848.jpeg" },
    { id: "t5", name: "Gina", emoji: "👧", color: "#b98ce8", photo: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/TeensAbschluss_Welcome_Gina.jpeg?alt=media&token=03730952-690b-4674-b714-b2db6f4894f1" }
  ],

  // ═══════════════════════════════════════════════════════
  // FRAGEN-POOL  (NICHT randomisiert – Reihenfolge wie hier notiert)
  // ═══════════════════════════════════════════════════════
  questions: {

    // ─────────────────────────────────────────────────────
    // (1) TRIVIA – BIBEL-FIGUREN-RATEN  · 9 Fragen mit Foto
    // Auf Beamer UND auf jedem Handy erscheint ein Foto (ihr stellt
    // berühmte biblische Szenen nach, z.B. "Mose im Wasser mit dem Stab").
    // Die Gäste tippen den richtigen Namen aus 5 Optionen.
    //
    //   photoUrl : Bild der nachgestellten Szene (siehe README → Fotos)
    //   options  : die wählbaren Namen (5–6 Stück)
    //   answer   : der KORREKTE Name (muss exakt in options stehen)
    //
    // 👉 Text & Antworten gerne anpassen – das sind nur Beispiele.
    // ─────────────────────────────────────────────────────
    trivia: [

  {
    q: "Wer steht hier mit dem Stab am Wasser?",
    photoUrl: "BILD_URL_HIER",
    photobeamer: "BILD_URL_HIER",
    options: ["Noah", "Mose", "David", "Elia", "Josua"],
    answer: "Mose"
  },
  {
    q: "Wer ist dieser treue Begleiter und Ermutiger auf der Missionsreise?",
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Barnabas%20(Phone).jpg?alt=media&token=f15f37b9-6afb-4e74-b2d5-8cf06f7e8cf9",
    photobeamer:"https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Barnabas%20(Large).jpg?alt=media&token=039003a7-b43b-4604-b772-32bc4eb20a5c",
    options: ["Petrus", "Paulus", "Barnabas", "Silas", "Timotheus"],
    answer: "Barnabas"
  },
  {
    q: "Wer ist diese mutige junge Frau mit dem besonderen Kind?",
    photoUrl: "BILD_URL_HIER",
    photobeamer: "BILD_URL_HIER",
    options: ["Maria", "Martha", "Elisabeth", "Sara", "Rahel"],
    answer: "Maria"
  },
  {
    q: "Wer wurde hier durch ein helles Licht vom Verfolger zum Nachfolger?",
    photoUrl: "BILD_URL_HIER",
    photobeamer: "BILD_URL_HIER",
    options: ["Petrus", "Johannes", "Judas", "Saulus", "Stephanus"],
    answer: "Saulus"
  },
  {
    q: "Welche mutige Königin tritt hier für ihr Volk ein?",
    photoUrl: "BILD_URL_HIER",
    photobeamer: "BILD_URL_HIER",
    options: ["Ruth", "Hanna", "Esther", "Naomi", "Mirjam"],
    answer: "Esther"
  },
  {
    q: "Wer ist dieser junge Hirte, der später König wurde?",
    photoUrl: "BILD_URL_HIER",
    photobeamer: "BILD_URL_HIER",
    options: ["Saul", "Salomo", "Goliath", "Samuel", "David"],
    answer: "David"
  },
  {
    q: "Wer betet hier so innig im Tempel um ein Kind?",
    photoUrl: "BILD_URL_HIER",
    photobeamer: "BILD_URL_HIER",
    options: ["Hanna", "Peninna", "Debora", "Michal", "Lea"],
    answer: "Hanna"
  },
  {
    q: "Welche treue Schwiegertochter sammelt hier Ähren auf dem Feld?",
    photoUrl: "BILD_URL_HIER",
    photobeamer: "BILD_URL_HIER",
    options: ["Esther", "Rahel", "Rebekka", "Ruth", "Naomi"],
    answer: "Ruth"
  },
  {
    q: "Welcher Jünger steigt hier mutig aus dem Boot?",
    photoUrl: "BILD_URL_HIER",
    photobeamer: "BILD_URL_HIER",
    options: ["Andreas", "Jakobus", "Petrus", "Johannes", "Thomas"],
    answer: "Petrus"
  },
  {
    q: "Wer lacht hier ungläubig über die Zusage, im hohen Alter noch ein Kind zu bekommen?",
    photoUrl: "BILD_URL_HIER",
    photobeamer: "BILD_URL_HIER",
    options: ["Hagar", "Sara", "Rebekka", "Lea", "Rahel"],
    answer: "Sara"
  },
  {
    q: "Welcher Zöllner wurde hier von Jesus in die Nachfolge gerufen?",
    photoUrl: "BILD_URL_HIER",
    photobeamer: "BILD_URL_HIER",
    options: ["Lukas", "Markus", "Matthäus", "Johannes", "Judas"],
    answer: "Matthäus"
  },
  {
    q: "Welcher weinende Prophet warnt hier sein Volk?",
    photoUrl: "BILD_URL_HIER",
    photobeamer: "BILD_URL_HIER",
    options: ["Jesaja", "Jeremia", "Hesekiel", "Daniel", "Elia"],
    answer: "Jeremia"
  },
  {
    q: "Wer baut hier die große Arche, um seine Familie und die Tiere zu retten?",
    photoUrl: "BILD_URL_HIER",
    photobeamer: "BILD_URL_HIER",
    options: ["Abraham", "Mose", "Noah", "Jona", "Lot"],
    answer: "Noah"
  },
  {
    q: "Welcher Jünger zweifelt hier zuerst und möchte die Wunden Jesu berühren?",
    photoUrl: "BILD_URL_HIER",
    photobeamer: "BILD_URL_HIER",
    options: ["Petrus", "Thomas", "Judas", "Andreas", "Philippus"],
    answer: "Thomas"
  }
    ],

    // ─────────────────────────────────────────────────────
    // (2) ÜBER DIE TEENS  · 5 Fragen MIT richtiger Antwort
    // answer = id eines Teens (z.B. "t3"). Die Gäste tippen,
    // welcher der 5 Teens gemeint ist. Hier gibt es eine WAHRE Antwort.
    //
    // 👉 Tragt die echten Fakten + den korrekten Teen ein.
    //    (photoUrl ist optional – z.B. ein Beweisfoto.)
    // ─────────────────────────────────────────────────────
    guess: [
      { q: "Wer hat 10 Jahre lang Klavierunterricht genommen?", answer: "t1" },
      { q: "Wer von den fünf war schon auf drei Kontinenten?",   answer: "t2" },
      { q: "Wer hat einen Pokal in einer Sportart gewonnen?",    answer: "t3" },
      { q: "Wer spricht fliessend zwei Fremdsprachen?",          answer: "t4" },
      { q: "Wer hat das aussergewöhnlichste Haustier?",          answer: "t5" }
    ],

    // ─────────────────────────────────────────────────────
    // (3) SCHWARM-FRAGEN  · 5 Fragen OHNE feste Antwort
    // Es gibt keine objektiv richtige Lösung – die MEHRHEIT entscheidet.
    // "Errate, was der Saal denkt": Wer mit der Mehrheit tippt, punktet.
    // Die Gäste wählen jeweils einen der 5 Teens.
    //
    // 👉 Lustig & pointiert, aber nie gemein. Gerne anpassen.
    // ─────────────────────────────────────────────────────
    poll: [
    { q: "Wer von den fünf kocht in 5 Jahren am wenigsten selbst?" },
    { q: "Wer verschläft am ehesten den Gottesdienst-Wecker?" },
    { q: "Wer startet als Erstes einen viralen Trend?" },
    { q: "Wer gibt am meisten Geld für Kaffee & Bubble Tea aus?" },
    { q: "Wer wird in 10 Jahren am weitesten weg von zuhause wohnen?" },
    { q: "Wer schläft im Durchschnitt am wenigsten?" },
    { q: "Wem würde auf dem roten Teppich etwas Peinliches passieren?" },
    { q: "Wer würde an eine Pingpong-Weltmeisterschaft gehen?" },
    { q: "Wer würde auswandern?" },
    { q: "Wer fährt ein Elektroauto?" },
    { q: "Wer wird am meisten Kinder haben?" },
    { q: "Wer wird der Nachfolger von Matthias?" }
  ],

    // ─────────────────────────────────────────────────────
    // SCHÄTZFRAGEN (optional) – answer = Zahl
    // ─────────────────────────────────────────────────────
    estimate: [
      { q: "Wie viele Jahre sind die 5 Teens zusammen in der Gruppe?", answer: 5,  unit: "Jahre" },
      { q: "Wie viele Lager haben sie zusammen erlebt?",               answer: 12, unit: "Lager" }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // QUIZ-SETS: was der Host am Abend starten kann
  //   pick: { trivia: "all" }      = alle Bibel-Fragen in Reihenfolge
  //   pick: { guess: "all" }       = alle Teen-Fragen
  //   { trivia:"all", guess:"all", poll:"all" } = alles nacheinander
  // ═══════════════════════════════════════════════════════
  sets: [
    { id: "gala",      label: "🎬 Quiz", pick: { trivia: "all", //guess: "all", 
                                               poll: "all" }, timer: 20 },
    { id: "bibel",     label: "📖 Bibel-Figuren raten (9)",       pick: { trivia: "all" },   timer: 25 },
    { id: "teens",     label: "⭐ Über die Teens (5)",            pick: { guess: "all" },    timer: 25 },
    { id: "schwarm",   label: "🔮 Schwarm-Fragen (5)",           pick: { poll: "all" },     timer: 20 },
    { id: "schaetzen", label: "🔢 Schätz-Runde (2)",             pick: { estimate: "all" }, timer: 30 }
  ]
};

console.log("✅ content.js loaded — Teens:", window.TeensContent.teens.length,
            "· Bibel:", window.TeensContent.questions.trivia.length,
            "· Sets:", window.TeensContent.sets.length);
