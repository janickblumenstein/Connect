// === content.js ===
// HIER werden Teens, Fragen, Fotos & Quiz-Sets vorbereitet.
// Der Host wählt am Abend nur noch "welches Set starten?" — fertig.
//
// THEMA: Hollywood-Gala – die Teens sind die VIPs auf dem roten Teppich,
// die Gäste sind Publikum/Reporter und raten/tippen mit.

window.TeensContent = {

  // Titel/Untertitel auf Login & Beamer (✦ wird automatisch ergänzt)
  eventTitle: "LIFESTYLE Teensabschluss",
  subtitle:   "Roter Teppich · heute sind die Teens die Stars",

  // Login-Button für Gäste, die sich (noch) keinem Teen zuordnen wollen.
  // NEU: Wer das wählt, wird automatisch dem Team mit den AKTUELL wenigsten
  // Fans zugeteilt → die ~160 Gäste verteilen sich gleichmässig auf die 5
  // Teens (wichtig für die faire, relative Team-Wertung).
  neutralLabel: "🎲 Noch offen – überrasch mich",

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

    Jeditha Linda Joshua Ruby Gina 
    { id: "t1", name: "Jeditha",  emoji: "👧", color: "#e8a4b8", photo: "" },
    { id: "t2", name: "Linda",  emoji: "👧", color: "#6ba3c7", photo: "" },
    { id: "t3", name: "Joshua", emoji: "🧑", color: "#7ed987", photo: "" },
    { id: "t4", name: "Ruby",   emoji: "👧", color: "#e8a555", photo: "" },
    { id: "t5", name: "Gina", emoji: "👧", color: "#b98ce8", photo: "" }
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
      { q: "Wer steht hier mit dem Stab im Wasser?",
        photoUrl: "https://cdn.pixabay.com/photo/2024/05/27/13/03/moses-leads-out-8791210_1280.png",
        options: ["Mose", "Noah", "David", "Elia", "Josua"], answer: "Mose" },

      { q: "Welche Figur baute hier das grosse Boot?",
        photoUrl: "https://images.pexels.com/photos/31918251/pexels-photo-31918251.jpeg",
        options: ["Noah", "Abraham", "Jona", "Salomo", "Mose"], answer: "Noah" },

      { q: "Wer besiegt hier den Riesen mit einer Schleuder?",
        photoUrl: "https://images.pexels.com/photos/30610666/pexels-photo-30610666.jpeg",
        options: ["David", "Simson", "Gideon", "Saul", "Josua"], answer: "David" },

      { q: "Wer steckt hier im Bauch des grossen Fisches?",
        photoUrl: "https://images.pexels.com/photos/13028012/pexels-photo-13028012.jpeg",
        options: ["Jona", "Petrus", "Paulus", "Daniel", "Noah"], answer: "Jona" },

      { q: "Wer sitzt hier ruhig zwischen den Löwen?",
        photoUrl: "https://images.pexels.com/photos/11630769/pexels-photo-11630769.jpeg",
        options: ["Daniel", "David", "Josef", "Elia", "Mose"], answer: "Daniel" },

      { q: "Welcher Starke hat hier die langen Haare?",
        photoUrl: "https://images.pexels.com/photos/12383166/pexels-photo-12383166.jpeg",
        options: ["Simson", "Goliath", "Esau", "Saul", "David"], answer: "Simson" },

      { q: "Wer hält hier das Jesuskind im Arm?",
        photoUrl: "https://images.pexels.com/photos/36588118/pexels-photo-36588118.jpeg",
        options: ["Maria", "Marta", "Ruth", "Ester", "Hanna"], answer: "Maria" },

      { q: "Wer tauft hier am Jordan?",
        photoUrl: "https://images.pexels.com/photos/10619928/pexels-photo-10619928.jpeg",
        options: ["Johannes der Täufer", "Petrus", "Paulus", "Andreas", "Elia"],
        answer: "Johannes der Täufer" },

      { q: "Wer hält hier die Schlüssel und stand im Boot?",
        photoUrl: "https://images.pexels.com/photos/8892874/pexels-photo-8892874.jpeg",
        options: ["Petrus", "Johannes", "Thomas", "Judas", "Matthäus"], answer: "Petrus" }
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
      { q: "Wer wird in 10 Jahren am weitesten weg von zuhause wohnen?" }
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
    { id: "gala",      label: "🎬 Gala-Show – alles (19 Fragen)", pick: { trivia: "all", guess: "all", poll: "all" }, timer: 25 },
    { id: "bibel",     label: "📖 Bibel-Figuren raten (9)",       pick: { trivia: "all" },   timer: 25 },
    { id: "teens",     label: "⭐ Über die Teens (5)",            pick: { guess: "all" },    timer: 25 },
    { id: "schwarm",   label: "🔮 Schwarm-Fragen (5)",           pick: { poll: "all" },     timer: 20 },
    { id: "schaetzen", label: "🔢 Schätz-Runde (2)",             pick: { estimate: "all" }, timer: 30 }
  ]
};

console.log("✅ content.js loaded — Teens:", window.TeensContent.teens.length,
            "· Bibel:", window.TeensContent.questions.trivia.length,
            "· Sets:", window.TeensContent.sets.length);
