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

  // ─── BILD PROGRESSIV ENTPIXELN (Alternative, standardmässig aus) ──
  // true = Foto startet verschwommen und wird über den Countdown schärfer.
  photoReveal: false,
  photoBlurMax: 10,   // Stärke der Anfangs-Unschärfe in px

  // ─── FRAGE VERZÖGERT EINBLENDEN (nur Bildfragen) ───────
  // Bei Fragen MIT Bild erscheint das Foto sofort, der Fragetext (der Hinweis)
  // aber erst nach X Sekunden → Spannung, ohne das Bild zu verpixeln.
  // 0 = aus. Pro Frage mit  delay: <Sek>  überschreibbar.
  questionDelaySec: 5,

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
  //   photo       = KLEINES Bild → Handy-Avatare (Datenvolumen für ~300 Geräte!)
  //   photobeamer = GROSSES Bild → nur Beamer (1 Gerät). Leer = nimmt photo.
  teens: [

    { id: "t1", name: "Jeditha",  emoji: "👧", 
     color: "#e8a4b8", 
     photo: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/TeensAbschluss_Welcome_Jeditha.jpeg?alt=media&token=a8ec1b54-3d68-403d-8cfc-7589c9be0ad7", 
     photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/TeensAbschluss_Welcome_Jeditha%20(Phone).jpeg?alt=media&token=836b74a9-f0ee-42ce-9187-2cf3c922694e" },
    { id: "t2", name: "Linda",  emoji: "👧", color: "#6ba3c7", 
     photo: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/TeensAbschluss_Welcome_Linda.jpeg?alt=media&token=ed162709-849c-4a3f-8400-afaca51539a6", 
     photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/TeensAbschluss_Welcome_Linda%20(Phone).jpeg?alt=media&token=fb53d0f1-99f4-4fc0-951f-46f43f0d3101" },
    { id: "t3", name: "Joshua", emoji: "🧑", color: "#7ed987", 
     photo: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/TeensAbschluss_Welcome_Joshi.jpeg?alt=media&token=f8ff2b09-e727-43b3-a580-89f1a62c5488", 
     photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/TeensAbschluss_Welcome_Joshi%20(Phone).jpeg?alt=media&token=235a228c-2d54-4ff9-aaa2-833b843a2278" },
    { id: "t4", name: "Ruby",   emoji: "👧", color: "#e8a555", 
     photo: "", 
     photobeamer: "" },
    { id: "t5", name: "Gina", emoji: "👧", color: "#b98ce8", 
     photo: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/TeensAbschluss_Welcome_Gina.jpeg?alt=media&token=03730952-690b-4674-b714-b2db6f4894f1", 
     photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/TeensAbschluss_Welcome_Gina%20(Phone).jpeg?alt=media&token=832ad5a3-891b-4ffc-9f09-c413cd690dbe" }
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
/*
  {
    q: "Wer hält hier Steintafeln mit den 10 Geboten in der Hand?",
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Mose%20(Phone).jpg?alt=media&token=6a23468e-7c94-47d9-9f90-b9e0bec51c4b",
    photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Mose%20(Large).jpg?alt=media&token=d04300f8-73bd-4b3a-be4b-e1fb94f9dc92",
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
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Maria%20(Phone).JPG?alt=media&token=4e5cb211-c0f6-470d-97b0-8bdfc68b38a7",
    photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Maria%20(Large).JPG?alt=media&token=d886f9eb-651e-4fe5-b333-fc9e5c314a59",
    options: ["Maria", "Martha", "Elisabeth", "Sara", "Rahel"],
    answer: "Maria"
  },
  {
    q: "Wer wurde hier durch ein helles Licht vom Verfolger zum Nachfolger?",
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Saulus%20(Phone).jpg?alt=media&token=d01b3117-e017-4eaf-a02b-19814071fe72",
    photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Saulus%20(Large).jpg?alt=media&token=0c4d35dd-7aab-4d65-987b-4e30869a43a4",
    options: ["Petrus", "Johannes", "Judas", "Saulus", "Stephanus"],
    answer: "Saulus"
  },
  {
    q: "Welche mutige Königin tritt hier für ihr Volk ein?",
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Esther%20(Phone).jpeg?alt=media&token=3566f5f7-abc8-42b7-b6a5-c0f889318bb0",
    photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Esther%20(Large).jpeg?alt=media&token=53384a1e-c641-42ca-ba92-4cd1071fbf6f",
    options: ["Ruth", "Hanna", "Esther", "Naomi", "Mirjam"],
    answer: "Esther"
  },
  {
    q: "Wer ist dieser junge Hirte, der später König wurde?",
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/David%20(Phone).JPG?alt=media&token=4cbf2248-581a-4d5a-8eb3-2ad6d06530f3",
    photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/David%20(Large).JPG?alt=media&token=1696f735-a714-46b1-8a88-c5109c2e4600",
    options: ["Saul", "Salomo", "Goliath", "Samuel", "David"],
    answer: "David"
  },
  {
    q: "Wer betet hier so innig im Tempel um ein Kind?",
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Hanna%20(Phone).jpg?alt=media&token=8d4ec16d-6399-42cb-bcd5-6c8f0140d6e8",
    photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Hanna%20(Large).jpg?alt=media&token=c18c747c-e176-4de8-94bf-131df998f4da",
    options: ["Hanna", "Peninna", "Debora", "Michal", "Lea"],
    answer: "Hanna"
  },
  {
    q: "Welche treue Schwiegertochter sammelt hier Ähren auf dem Feld?",
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Ruth%20(Phone).jpeg?alt=media&token=d7385f35-9439-4201-a541-18b948e42e00",
    photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Ruth%20(Large).jpeg?alt=media&token=faaf3017-3ece-4b13-9e8a-32688ffd81c2",
    options: ["Esther", "Rahel", "Rebekka", "Ruth", "Naomi"],
    answer: "Ruth"
  },
  {
    q: "Welcher Jünger steigt hier mutig aus dem Boot?",
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Petrus%20(Phone).jpg?alt=media&token=7db8cd4f-5291-4c9c-a73a-ae967fb488fa",
    photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Petrus%20(Large).jpg?alt=media&token=9a7edae1-fa29-4476-8695-a26289ef475b",
    options: ["Andreas", "Jakobus", "Petrus", "Johannes", "Thomas"],
    answer: "Petrus"
  },
  {
    q: "Wer lacht hier ungläubig über die Zusage, im hohen Alter noch ein Kind zu bekommen?",
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Sara%20(Phone).jpg?alt=media&token=34e8788b-7901-4959-8ed8-1dd785d1f329",
    photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Sara%20(Large).jpg?alt=media&token=943cd369-53db-4474-971a-2b00a6a21f44",
    options: ["Hagar", "Sara", "Rebekka", "Lea", "Rahel"],
    answer: "Sara"
  },
  {
    q: "Welcher Zöllner wurde hier von Jesus in die Nachfolge gerufen?",
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Matth%C3%A4us%20(Phone).jpg?alt=media&token=dc56084a-2c74-4154-8c1f-5fd0be938ed9",
    photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Matth%C3%A4us%20(Large).jpg?alt=media&token=b6afe947-b987-4bc7-bafa-e1212eee2167",
    options: ["Lukas", "Markus", "Matthäus", "Johannes", "Judas"],
    answer: "Matthäus"
  },
  {
    q: "Welcher weinende Prophet warnt hier sein Volk?",
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Jeremia%20(Large).jpg?alt=media&token=d72821bb-d175-415e-ac76-115cbb5f0d24",
    photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Jeremia%20(Phone).jpg?alt=media&token=c7947c51-4be4-4d18-8f43-9bf3c984aca5",
    options: ["Jesaja", "Jeremia", "Hesekiel", "Daniel", "Elia"],
    answer: "Jeremia"
  },
  {
    q: "Wer baut hier die große Arche, um seine Familie und die Tiere zu retten?",
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Noah%20(Phone).JPEG?alt=media&token=a55cfbd4-bd8b-4bd9-af32-15d35fe4c6c9",
    photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Noah%20(Large).JPEG?alt=media&token=20069b97-e5b3-4a2f-9769-43e1e6aa5e91",
    options: ["Abraham", "Mose", "Noah", "Jona", "Lot"],
    answer: "Noah"
  },
  {
    q: "Welcher Jünger zweifelt hier zuerst und möchte die Wunden Jesu berühren?",
    photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Thomas%20(Phone).JPG?alt=media&token=1aa2f305-b6fb-4ebe-8fa2-3a6ee86b3fa8",
    photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Thomas%20(Large).JPG?alt=media&token=a7d884e1-ac1f-4de3-baa0-2f2027a24c82",
    options: ["Petrus", "Thomas", "Judas", "Andreas", "Philippus"],
    answer: "Thomas"
  }*/
    
 
    {
      q: "Wer bekommt hier Besuch von einem Engel?",
      photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Maria%20(Phone).JPG?alt=media&token=4e5cb211-c0f6-470d-97b0-8bdfc68b38a7",
      photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Maria%20(Large).JPG?alt=media&token=d886f9eb-651e-4fe5-b333-fc9e5c314a59",
      options: ["Maria", "Martha", "Elisabeth", "Sara", "Rahel"],
      answer: "Maria"
    },
    {
      q: "Welche mutige Frau tritt hier ungefragt vor den König?",
      photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Esther%20(Phone).jpeg?alt=media&token=3566f5f7-abc8-42b7-b6a5-c0f889318bb0",
      photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Esther%20(Large).jpeg?alt=media&token=53384a1e-c641-42ca-ba92-4cd1071fbf6f",
      options: ["Ruth", "Hanna", "Esther", "Naomi", "Mirjam"],
      answer: "Esther"
    },
    {
      q: "Wer lacht hier im Zelt über die Zusage, im hohen Alter noch ein Kind zu bekommen?",
      photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Sara%20(Phone).jpg?alt=media&token=34e8788b-7901-4959-8ed8-1dd785d1f329",
      photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Sara%20(Large).jpg?alt=media&token=943cd369-53db-4474-971a-2b00a6a21f44",
      options: ["Hagar", "Sara", "Rebekka", "Lea", "Rahel"],
      answer: "Sara"
    },
    {
      q: "Wer wird hier von einem hellen Licht geblendet und fällt zu Boden?",
      photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Saulus%20(Phone).jpg?alt=media&token=d01b3117-e017-4eaf-a02b-19814071fe72",
      photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Saulus%20(Large).jpg?alt=media&token=0c4d35dd-7aab-4d65-987b-4e30869a43a4",
      options: ["Petrus", "Johannes", "Judas", "Saulus", "Stephanus"],
      answer: "Saulus"
    },
    {
      q: "Welcher Hirte wurde zum König von Israel?",
      photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/David%20(Phone).JPG?alt=media&token=4cbf2248-581a-4d5a-8eb3-2ad6d06530f3",
      photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/David%20(Large).JPG?alt=media&token=1696f735-a714-46b1-8a88-c5109c2e4600",
      options: ["Saul", "Salomo", "Goliath", "Samuel", "David"],
      answer: "David"
    },
    {
      q: "Wer betet hier so innig um ein Kind, dass der Priester Eli sie für betrunken hält?",
      photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Hanna%20(Phone).jpg?alt=media&token=8d4ec16d-6399-42cb-bcd5-6c8f0140d6e8",
      photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Hanna%20(Large).jpg?alt=media&token=c18c747c-e176-4de8-94bf-131df998f4da",
      options: ["Hanna", "Peninna", "Debora", "Michal", "Lea"],
      answer: "Hanna"
    },
    {
      q: "Welcher Jünger steigt hier mutig aus dem Boot aufs Wasser?",
      photoUrl: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Petrus%20(Phone).jpg?alt=media&token=7db8cd4f-5291-4c9c-a73a-ae967fb488fa",
      photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Petrus%20(Large).jpg?alt=media&token=9a7edae1-fa29-4476-8695-a26289ef475b",
      options: ["Andreas", "Jakobus", "Petrus", "Johannes", "Thomas"],
      answer: "Petrus"
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
    //{ q: "Wer von den fünf kocht in 5 Jahren am wenigsten selbst?" },
    //{ q: "Wer verschläft am ehesten den Gottesdienst-Wecker?" },
    //{ q: "Wer startet als Erstes einen viralen Trend?" },
    //{ q: "Wer gibt am meisten Geld für Kaffee & Bubble Tea aus?" },
    //{ q: "Wer wird in 10 Jahren am weitesten weg von zuhause wohnen?" },
    //{ q: "Wer schläft im Durchschnitt am wenigsten?" },
    //{ q: "Wem würde auf dem roten Teppich etwas Peinliches passieren?" },
    //{ q: "Wer würde an eine Pingpong-Weltmeisterschaft gehen?" },
    //{ q: "Wer würde auswandern?" },
    //{ q: "Wer fährt ein Elektroauto?" },
    //{ q: "Wer wird am meisten Kinder haben?" },
    //{ q: "Wer wird der Nachfolger von Matthias?" }

  
    { q: "Wer von den fünf verschläft am ehesten den Gottesdienst-Wecker?" },
    { q: "Wer kocht in 5 Jahren am wenigsten selbst?" },
    { q: "Wer startet als Erstes einen viralen Trend im Internet?" },
    { q: "Wem würde auf dem roten Teppich am ehesten ein Missgeschick passieren?" },
    { q: "Wer wird am ehesten der Nachfolger von Matthias (Connect-Pastor)?" }
  
  ],

    // ─────────────────────────────────────────────────────
    // SCHÄTZFRAGEN (optional) – answer = Zahl
    // ─────────────────────────────────────────────────────
    estimate: [
      { q: "Wie viele Jahre sind die 5 Teens zusammen in der Gruppe?", answer: 5,  unit: "Jahre" },
      { q: "Wie viele Lager haben sie zusammen erlebt?",               answer: 12, unit: "Lager" }
    ],

    // ─────────────────────────────────────────────────────
    // TEST-FRAGEN  (nur fürs Aufwärmen/Testen, NICHT im echten Quiz!)
    // Diese Kategorie wird nur vom Set "test" verwendet → taucht im echten
    // Quiz nie auf. Jede Frage trägt ihren eigenen  type:  ("trivia"/"poll"),
    // damit sie richtig dargestellt wird, obwohl sie hier zusammen liegen.
    // Danach einfach im Host-Tab "Alle Scores auf 0".
    // ─────────────────────────────────────────────────────
    test: [
      { type: "trivia",
        q: "Wer hält hier Steintafeln mit den 10 Geboten in der Hand?",
        photoUrl:    "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Mose%20(Phone).jpg?alt=media&token=6a23468e-7c94-47d9-9f90-b9e0bec51c4b",
        photobeamer: "https://firebasestorage.googleapis.com/v0/b/hochzeitesthermanuel.firebasestorage.app/o/Mose%20(Large).jpg?alt=media&token=d04300f8-73bd-4b3a-be4b-e1fb94f9dc92",
        options: ["Noah", "Mose", "David", "Elia", "Josua"], answer: "Mose" },
      { type: "poll",
        q: "Wer von den fünf lacht am lautesten?" }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // QUIZ-SETS: was der Host am Abend starten kann
  //   pick: { trivia: "all" }      = alle Bibel-Fragen in Reihenfolge
  //   pick: { guess: "all" }       = alle Teen-Fragen
  //   { trivia:"all", guess:"all", poll:"all" } = alles nacheinander
  // ═══════════════════════════════════════════════════════
  sets: [
    { id: "test",      label: "🧪 Test-Runde", pick: { test: "all" }, timer: 20 },
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
