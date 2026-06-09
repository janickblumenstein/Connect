// ════════════════════════════════════════════════════════════════════
// Teens Connect – Last-Test
// Simuliert viele gleichzeitige "Geräte" (jedes mit EIGENER Firebase-
// Verbindung + eigenem /game-Listener, genau wie die echte App).
// Jeder Sim-Gast: wählt zufällig ein Teen, wartet auf jede Frage und
// antwortet nach einer ZUFÄLLIGEN Reaktionszeit.
//
// Voraussetzung:  cd tools && npm install
// Start:          node loadtest.mjs --players 300
//
// Aufräumen passiert automatisch bei Strg+C (alle Sim-Gäste werden gelöscht).
// ════════════════════════════════════════════════════════════════════
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove, get } from "firebase/database";

// ── Firebase-Config (dieselbe wie js/core.js; per ENV überschreibbar) ──
const firebaseConfig = {
  apiKey:      process.env.FB_API_KEY     || "AIzaSyCQxhhkr-YF81rJ7J-ApwGmonB4CUywlp8",
  authDomain:  process.env.FB_AUTH_DOMAIN || "hochzeitesthermanuel.firebaseapp.com",
  databaseURL: process.env.FB_DB_URL      || "https://hochzeitesthermanuel-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId:   process.env.FB_PROJECT_ID  || "hochzeitesthermanuel"
};

// ── Parameter (CLI-Flags oder ENV) ─────────────────────────────────────
function arg(name, def){
  const i = process.argv.indexOf("--" + name);
  if(i >= 0 && process.argv[i+1]) return process.argv[i+1];
  return process.env[name.toUpperCase()] || def;
}
const ROOM          = arg("room", "TEENS");
const PLAYERS       = parseInt(arg("players", "300"), 10);
const RAMP_SEC      = parseFloat(arg("ramp", "20"));        // Login-Verteilung über X Sek
const MIN_DELAY     = parseInt(arg("min", "800"), 10);     // min. Reaktionszeit (ms)
const MAX_DELAY     = parseInt(arg("max", "18000"), 10);   // max. Reaktionszeit (ms)
const PARTICIPATION = parseFloat(arg("participation", "0.92")); // Anteil, der antwortet
const TEEN_IDS      = (arg("teens", "t1,t2,t3,t4,t5")).split(",").map(s=>s.trim());

const rnd  = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Statistik ──────────────────────────────────────────────────────────
let connected = 0, answersSent = 0, errors = 0, gameUpdatesSeen = 0;
const players = [];   // { app, db, uid }

// passende Antwort zum Fragetyp erzeugen
function answerFor(g){
  if(g.type === "trivia" && Array.isArray(g.options) && g.options.length) return pick(g.options);
  if(g.type === "estimate") return Math.floor(rnd(0, 25));
  return pick(TEEN_IDS);   // guess / poll
}

async function spawnPlayer(i){
  const app = initializeApp(firebaseConfig, "sim_" + i);
  const db  = getDatabase(app);
  const uid = `load_${i}_${Math.random().toString(36).slice(2, 6)}`;
  const team = pick(TEEN_IDS);

  // ZUERST registrieren, damit das Aufräumen den Gast auch dann kennt,
  // wenn das set() (Netzproblem) hängen bleibt.
  players.push({ app, db, uid });
  await set(ref(db, `rooms/${ROOM}/players/${uid}`), {
    name: `Sim ${i}`, team, uid, score: 0, joined: Date.now()
  });
  connected++;

  let handledKey = null;   // verhindert doppelte Antwort auf dieselbe Frage

  // Jeder Sim-Gast hört NUR auf /game – wie die echte App. (Wenn die
  // Skalierungs-Optimierung greift, kommen hier nur kleine Updates an.)
  onValue(ref(db, `rooms/${ROOM}/game`), snap => {
    gameUpdatesSeen++;
    const g = snap.val();
    if(!g || g.phase !== "answer") return;

    const key = (g.quizIdx ?? g.startedAt);
    if(key === handledKey) return;     // diese Frage schon beantwortet
    handledKey = key;

    if(Math.random() > PARTICIPATION) return;  // dieser Gast antwortet diesmal nicht

    const leftMs = (g.endsAt ? g.endsAt - Date.now() : 20000);
    const maxD = Math.max(MIN_DELAY + 200, Math.min(MAX_DELAY, leftMs - 800));
    const delay = rnd(MIN_DELAY, maxD);
    const recv = Date.now();

    setTimeout(async () => {
      const v = answerFor(g);
      const t = Date.now() - recv;   // Reaktionszeit dieses "Geräts"
      try {
        await set(ref(db, `rooms/${ROOM}/answers/${uid}`), { v, t });
        answersSent++;
      } catch(e) { errors++; }
    }, delay);
  });
}

async function main(){
  console.log(`\n🎬 Teens Connect – Last-Test`);
  console.log(`   Raum=${ROOM}  Geräte=${PLAYERS}  Ramp=${RAMP_SEC}s  Reaktion=${MIN_DELAY}-${MAX_DELAY}ms  Teilnahme=${Math.round(PARTICIPATION*100)}%`);
  console.log(`   DB=${firebaseConfig.databaseURL}\n`);
  console.log(`   Tipp: parallel als Host ein Quiz starten und auf dem Beamer (?beamer=1) zuschauen.\n`);

  const gap = (RAMP_SEC * 1000) / Math.max(1, PLAYERS);
  for(let i = 1; i <= PLAYERS; i++){
    spawnPlayer(i).catch(()=>errors++);
    if(gap > 0) await sleep(gap);
  }

  // Heartbeat alle 2s
  setInterval(() => {
    process.stdout.write(`\r⏱  verbunden=${connected}/${PLAYERS}  Antworten=${answersSent}  /game-Updates(Σ)=${gameUpdatesSeen}  Fehler=${errors}     `);
  }, 2000);
}

// ── sauberes Aufräumen ─────────────────────────────────────────────────
let cleaning = false;
async function cleanup(){
  if(cleaning) return; cleaning = true;
  console.log(`\n\n🧹 Räume ${players.length} Sim-Gäste auf …`);
  // in Schüben löschen, um nicht alles auf einmal zu feuern
  for(let i = 0; i < players.length; i += 50){
    const batch = players.slice(i, i + 50);
    await Promise.allSettled(batch.flatMap(p => [
      remove(ref(p.db, `rooms/${ROOM}/players/${p.uid}`)),
      remove(ref(p.db, `rooms/${ROOM}/answers/${p.uid}`))
    ]));
  }
  console.log(`✅ Fertig. Antworten gesendet: ${answersSent}, Fehler: ${errors}`);
  process.exit(0);
}
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

main().catch(e => { console.error(e); process.exit(1); });
