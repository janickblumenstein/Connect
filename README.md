# 🎬 Connect Gala – Mitmach-Spiel

Web-App für den Teens-Abschluss im Stil einer **Hollywood-Gala**: roter Teppich,
goldene Absperrbänder, die Teens sind die **VIPs**, die Gäste sind das Publikum
(„Reporter"). Auf dem Beamer erscheint ein Foto oder eine Frage, alle ~160 Gäste
tippen am Handy mit.

> Aus dem bewährten Hochzeits-Rate-Spiel entstanden. Aus *„Wer von beiden?"* wurde
> *„Welcher der Teens?"* – plus Bibel-Quiz und Schwarm-Fragen.

## 🎯 Konzept

- **Login = roter Teppich:** Gast gibt **optional** einen Namen ein und wählt einen
  Teen als Fan-Team – oder **„🎲 Noch offen"**. Wer „Noch offen" wählt, wird
  **automatisch dem Team mit den aktuell wenigsten Fans** zugeteilt → die Gruppen
  bleiben gleich gross (wichtig für die faire, relative Wertung).
- **Drei Fragetypen** (Reihenfolge fest, nicht randomisiert):
  1. **📖 Bibel-Figuren raten (9):** Foto einer nachgestellten Szene (Beamer **und**
     Handy), Gäste wählen den richtigen Namen aus 5–6 Optionen.
  2. **⭐ Über die Teens (5):** Fragen mit *echter* Antwort (z.B. „Wer hat 10 Jahre
     Klavierunterricht?") → richtiger Teen.
  3. **🔮 Schwarm-Fragen (5):** Keine objektive Antwort – die **Mehrheit** entscheidet
     („errate, was der Saal denkt", z.B. „Wer kocht in 5 Jahren am wenigsten?").

## 🏆 Wertung – zwei Ranglisten

- **Einzel (Kahoot-Stil mit Tempo):** Richtige Antwort gibt **500–1000 Punkte** je
  nach Reaktionszeit – **wer schneller richtig tippt, bekommt mehr**. Falsch = 0.
  Die Zeit wird **pro Gerät** ab Erscheinen der Frage gemessen (fair trotz Latenz).
- **Team (Ø-Punkte pro Runde, kumuliert):** Jedes Team erhält pro Frage die
  **durchschnittliche Punktzahl** seiner abgegebenen Antworten — Summe der
  (zeitabhängigen) Punkte aller Richtigen ÷ Anzahl Antwortende. Beispiel: 40 von
  50 Fans tippen, 30 richtig → deren Punkte ÷ 40 ≈ **630 Pkt fürs Team**. Diese
  Ø-Punkte werden kumuliert (keine „Rundensiege" mehr) → **alle werden belohnt**,
  nicht nur der/die Schnellste, und der Wettkampf läuft auch zwischen den Gruppen.
  Nenner konfigurierbar (`teamAvgDenominator`: `answered`/`members`). Bei
  Schwarm-Fragen zählt „mit der Mehrheit getippt" als richtig.
- **Tap-Duell** als Zwischenspiel: schnellstes Fan-Team bekommt **+800 Team-Punkte**,
  die schnellsten Finger 1000/600/300 Einzelpunkte.
- **Bild-Freigabe:** Foto-Fragen starten verpixelt und werden über den Countdown
  scharf (`photoReveal`) – früh tippen ist schwerer, aber bringt mehr Tempo-Punkte.

## 📁 Projekt-Struktur

```
├── index.html       ← Layout & Gala-Styles (roter Teppich, Absperrbänder)
└── js/
    ├── content.js   ← HIER: Teens, Fotos, Fragen & Sets anpassen
    ├── core.js      ← Firebase, Login, Auto-Team-Zuteilung, Team-Modell
    ├── games.js     ← Quiz-Runner: guess / trivia / poll / estimate + Wertung
    ├── tapduel.js   ← Tap-Duell aller Fan-Teams
    └── beamer.js    ← Beamer-Großansicht
```

## 📸 Fotos ablegen (Firebase Storage)

Du brauchst Bild-**URLs** für (a) die 5 Teens und (b) die 9 Bibel-Szenen.
Empfohlen über **Firebase Storage** (gleiches Projekt wie die Datenbank):

1. **Firebase-Konsole** → dein Projekt → **Build → Storage** → *Get started*
   (Test-Modus reicht für ein Event).
2. Lege zwei Ordner an, z.B.:
   - `connect/teens/`  → Teen-Porträts: `t1.jpg`, `t2.jpg`, … `t5.jpg`
   - `connect/bibel/`  → die Szenen-Fotos: `bibel1.jpg` … `bibel9.jpg`
3. Bild anklicken → rechts **„Download-URL"** kopieren (lange URL mit `?alt=media&token=…`).
4. URL in `js/content.js` eintragen:
   - Teen-Foto → Feld **`photo:`** beim jeweiligen Teen.
   - Bibel-Foto → Feld **`photoUrl:`** bei der jeweiligen Trivia-Frage.

**Storage-Rules** (öffentlich lesbar für das Event – Schreiben gesperrt):
```json
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /connect/{allPaths=**} {
      allow read: if true;
      allow write: if false;   // Uploads nur du in der Konsole
    }
  }
}
```

> Tipp: Bilder vorher auf ~800×800 px / unter ~300 KB verkleinern – bei 160
> Geräten gleichzeitig lädt das viel angenehmer. Leeres `photo`/`photoUrl` zeigt
> einfach ein Emoji bzw. 📷 als Platzhalter.
>
> Alternativ gehen auch beliebige andere öffentliche Bild-URLs (z.B. imgur).

## 🚀 Setup

### 1. Firebase Realtime Database
`firebaseConfig` in `js/core.js` eintragen. Raum = **`TEENS`** (Konstante `ROOM`).
Database-Rules (für ein Event):
```json
{ "rules": { ".read": "now < 1830000000000", ".write": "now < 1830000000000" } }
```

### 2. Teens & Fragen → `js/content.js`
- **`teens`**: id, Name, Emoji, `color`, `photo`. Reihenfolge = Button-Reihenfolge.
- **`questions.trivia`**: Bibel-Fragen mit `photoUrl`, `options` (5–6) und `answer`
  (der korrekte Options-Text). 👉 Text & Antworten anpassen.
- **`questions.guess`**: Teen-Fragen mit `answer: "<teen-id>"`.
- **`questions.poll`**: Schwarm-Fragen (nur `q`, keine Antwort).
- **`questions.estimate`**: Schätzfragen mit Zahl-`answer`.
- **`sets`**: was der Host starten kann. `🎬 Gala-Show` spielt alle 19 nacheinander.

### 3. Hosten
**Netlify Drop** (https://netlify.com/drop): Ordner in den Browser ziehen → fertig.
Alternativ Vercel oder GitHub Pages.

## 🎮 Ablauf am Abend

**Host:** 3× auf den Titel/Logo tippen → Host-Button → **PIN** (Standard `4800`)
→ ohne Team starten → Host-Tab → Set wählen (z.B. „🎬 Gala-Show") → auflösen
(oder Auto-Auflösung) → nächste Frage. Unpassende Namen im Host-Tab unter
„🧹 Gäste & Namen" mit einem Klick auf „→ Gast" neutralisieren. Mit
**„🏆 Rangliste zeigen"** kann der Host die Rangliste jederzeit (auch nach dem
Quiz) auf den Beamer holen.

**Beamer-Laptop:** gleiche URL mit `?beamer=1` (Vollbild). Grosser QR im
Wartezustand, kleiner QR oben rechts während einer Frage.

**Gäste:** QR scannen → (Name optional) → Teen wählen oder „🎲 Noch offen" → mitmachen.

## 🧪 Last-Test (viele Geräte simulieren) → `tools/`

Vor dem Event realistisch testen, ob alles mit z.B. 300 Geräten läuft:

```bash
cd tools
npm install
node loadtest.mjs --players 300        # 300 Sim-Gäste, je eigene Verbindung
```
Jeder Sim-Gast wählt zufällig ein Teen, wartet auf jede Frage und antwortet
nach **zufälliger Reaktionszeit**. Parallel im Browser als Host ein Quiz starten
und auf dem Beamer (`?beamer=1`) zuschauen. **Strg+C** räumt alle Sim-Gäste auf.

Optionen: `--players 300 --ramp 20 --min 800 --max 18000 --participation 0.92`
`--teens t1,t2,t3,t4,t5`. Andere DB via ENV `FB_DB_URL=…`.

> Hinweis: Der Test schreibt echte (temporäre) Sim-Gäste in deine DB und löscht
> sie beim Beenden. Am besten vorab einmal mit `--players 20` testen.

## ⚖️ Skalierung (~160–300 Gleichzeitig)

- 🔴 **Firebase-Plan:** Der kostenlose **Spark-Plan erlaubt nur 100 gleichzeitige
  Verbindungen** → bei mehr Geräten bricht es ab. Vor dem Event auf **Blaze**
  (pay-as-you-go) umstellen (für diese Nutzung praktisch gratis, Limit 200'000).
- **Antworten-Architektur:** Antworten liegen im Knoten `rooms/TEENS/answers`,
  den **nur der Host** abonniert. Die Gäste-Geräte hören nur auf das kleine
  `rooms/TEENS/game` (Frage + gedrosselter „x/y"-Zähler). Dadurch bekommen die
  ~300 Geräte **nicht** den ganzen Antworten-Strom → drastisch weniger Last.
- Fotos klein halten (s.o.) – sonst der grösste Bandbreiten-Faktor.
- **Tap-Duell** ist bei >150 Geräten die lastintensivste Komponente
  (laufende Taps an alle). Fürs Quiz selbst kein Problem; Tap-Duell bei sehr
  vielen Gästen besser weglassen.
- Auto-Zuteilung von „Noch offen" balanciert gut, ist aber kein Transaktions-Lock
  (bei exakt gleichzeitigen Logins minim ungleich – durch %-Wertung unkritisch).
- `color-mix()` im CSS → moderne Browser nötig (aktuelle Handys: kein Problem).

## 💡 Ideen für später

- **Foto-Reveal:** Bibel-Szene erst verpixelt, schärft sich über den Timer.
- **Steckbrief je Teen**, der nach jeder Runde ein Stück mehr enthüllt wird.
- **Live-Interview-Slide** pro Teen (VIP-Karte mit Foto + ein Satz).
- **Sound:** Tusch beim Auflösen, Applaus für den Rundensieger.
- **Abschluss-Slide** pro Teen mit Foto & Segenswunsch.
