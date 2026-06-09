// === core.js – Basis-Modul (Teens-Abschluss) ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ═══════════════════════════════════════════════════════════
// FIREBASE-CONFIG
// (eigener Raum "TEENS" → kollidiert NICHT mit der Hochzeits-App,
//  selbst wenn dieselbe Firebase-Datenbank genutzt wird)
// ═══════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyCQxhhkr-YF81rJ7J-ApwGmonB4CUywlp8",
  authDomain: "hochzeitesthermanuel.firebaseapp.com",
  databaseURL: "https://hochzeitesthermanuel-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "hochzeitesthermanuel"
};
// ═══════════════════════════════════════════════════════════

const fbApp = initializeApp(firebaseConfig);
const db = getDatabase(fbApp);
const ROOM = "TEENS";

// ── Team-Modell: ausschliesslich die Teens ───────────────────
// "Noch offen" ist KEIN eigenes Team mehr, sondern eine Login-Wahl
// (Sentinel AUTO_ID): wer das wählt, wird automatisch dem Team mit den
// aktuell wenigsten Fans zugeteilt → balancierte Gruppen für faire,
// relative Wertung. Ranglisten/Beamer zeigen nur die 5 Teens.
const AUTO_ID = "_auto";
// Alle wertbaren Teams = die Teens. Einzige Quelle der Wahrheit fürs UI.
function allTeams(){
  return [...((window.TeensContent && window.TeensContent.teens) || [])];
}
function teensOnly(){ return (window.TeensContent && window.TeensContent.teens) || []; }
function teamById(id){ return allTeams().find(t => t.id === id) || null; }
// Avatar eines Teens: Foto wenn vorhanden, sonst Emoji-Platzhalter.
function avatarHtml(t){
  if(t && t.photo) return `<span class="tav" style="background-image:url('${t.photo}')"></span>`;
  return `<span class="tav tav-ph">${(t && t.emoji) || "👤"}</span>`;
}
function teamName(id){ const t = teamById(id); return t ? t.name : (id || "—"); }
function teamColor(id){ const t = teamById(id); return t ? t.color : "#9a8fa5"; }
function teamEmoji(id){ const t = teamById(id); return t ? t.emoji : "👤"; }

const App = window.App = {
  db, ref, set, onValue, update, get, remove,
  user: null, userName: null, team: null, room: ROOM, isHost: false,
  state: {}, players: {}, meta: {}, teams: {},
  timers: [],
  listeners: {},
  $: id => document.getElementById(id),
  toast, awardScore, switchTab, clearTimers, shuffle, isBeamer: false,
  // Team-Helper für alle Module:
  allTeams, teensOnly, teamById, teamName, teamColor, teamEmoji, avatarHtml, AUTO_ID,
  questionReceivedAt: 0
};

function clearTimers(){ App.timers.forEach(t=>{clearInterval(t);clearTimeout(t)}); App.timers=[]; }
function shuffle(a){ return [...a].sort(()=>Math.random()-0.5); }

function toast(text, duration=2500){
  const c = App.$("toastContainer");
  const t = document.createElement("div");
  t.className = "toast"; t.innerText = text;
  c.appendChild(t);
  setTimeout(()=>t.remove(), duration);
}

async function awardScore(player, pts){
  const r = ref(db, `rooms/${App.room}/players/${player}/score`);
  const cur = (await get(r)).val() || 0;
  await set(r, cur + pts);
}

// === BEAMER ODER PLAYER START ===
const urlParams = new URLSearchParams(location.search);
if(urlParams.get("beamer") === "1"){
  App.isBeamer = true;
  document.body.classList.add("beamer-mode");
  App.$("login").classList.add("hidden");
  App.$("app").classList.add("hidden");
  App.$("beamer").classList.remove("hidden");
  connectBeamer();
} else {
  initLogin();
  attemptAutoLogin();
}

async function connectBeamer(){
  onValue(ref(db, `rooms/${App.room}/meta`),    snap=>{ App.meta = snap.val() || {}; beamerUpdate(); });
  onValue(ref(db, `rooms/${App.room}/players`), snap=>{ App.players = snap.val() || {}; beamerUpdate(); });
  onValue(ref(db, `rooms/${App.room}/teams`),   snap=>{ App.teams = snap.val() || {}; beamerUpdate(); });
  onValue(ref(db, `rooms/${App.room}/game`),    snap=>{ App.state.game = snap.val(); beamerUpdate(); });
  onValue(ref(db, `rooms/${App.room}/quiz`),    snap=>{ App.state.quiz = snap.val(); beamerUpdate(); });
  onValue(ref(db, `rooms/${App.room}/tapduel`), snap=>{ App.state.tapduel = snap.val(); beamerUpdate(); });
}
function beamerUpdate(){ if(App.listeners.onBeamerUpdate) App.listeners.onBeamerUpdate(); }

function initLogin() {
  // Titel/Untertitel aus content.js
  const c = window.TeensContent || {};
  if(App.$("landingLogo")) App.$("landingLogo").innerText = `✦ ${c.eventTitle || "Teens-Abschluss"} ✦`;
  if(App.$("coupleName"))  App.$("coupleName").innerText  = c.subtitle || "";
  const meta = App.$("landingMeta");
  if(meta){
    const parts = [c.eventLocation, c.eventDate].filter(Boolean).join("  ·  ");
    meta.innerText = parts;
  }

  let hostClicks = 0;
  App.$("landingLogo").onclick = () => {
    hostClicks++;
    if(hostClicks >= 3) App.$("btnHost").classList.remove("hidden");
  };

  // Team-Buttons dynamisch aus den Teens + "Noch offen"-Auto-Button bauen
  let selectedTeam = null;
  const pick = App.$("teamPick");
  if(pick){
    const teenBtns = teensOnly().map(t => `
      <button class="team-btn" data-team="${t.id}" style="--tcol:${t.color}">
        ${avatarHtml(t)}<span class="tn">${t.name}</span>
      </button>`).join("");
    const autoBtn = `
      <button class="team-btn team-auto" data-team="${AUTO_ID}" style="--tcol:var(--gold)">
        <span class="ic">🎲</span><span class="tn">${c.neutralLabel || "Noch offen"}</span>
      </button>`;
    pick.innerHTML = teenBtns + autoBtn;

    pick.querySelectorAll(".team-btn").forEach(btn => {
      btn.onclick = () => {
        pick.querySelectorAll(".team-btn").forEach(b => b.classList.remove("sel"));
        selectedTeam = btn.dataset.team;
        btn.classList.add("sel");
      };
    });
  }

  App.$("btnJoin").onclick = () => start(false, selectedTeam);
  App.$("btnHost").onclick = () => {
    // Host-PIN abfragen (verhindert, dass jeder per Logo-Tipp übernimmt)
    const pin = (window.TeensContent && window.TeensContent.hostPin) || "";
    if(pin){
      const entered = prompt("Host-PIN eingeben:");
      if(entered === null) return;            // abgebrochen
      if(entered.trim() !== String(pin)){ alert("Falsche PIN."); return; }
    }
    start(true, null);
  };
}

async function attemptAutoLogin() {
  const savedUid = localStorage.getItem("teens_uid");
  if (!savedUid) return;

  const savedName = localStorage.getItem("teens_name") || savedUid.split('_')[0];
  if (App.$("nameInp")) App.$("nameInp").value = savedName;

  try {
    const pSnap = await get(ref(db, `rooms/${App.room}/players/${savedUid}`));
    if (pSnap.exists()) {
      const data = pSnap.val();
      App.user = savedUid;
      App.userName = data.name;
      App.team = data.team;
      finishLogin();
      return;
    }

    const mSnap = await get(ref(db, `rooms/${App.room}/meta`));
    if (mSnap.exists()) {
      const meta = mSnap.val();
      if (meta.host === savedUid) {
        App.user = savedUid;
        App.userName = meta.hostName || savedName;
        finishLogin();
      }
    }
  } catch (error) {
    console.error("Auto-login Fehler:", error);
  }
}

async function start(takeHost, team) {
  const inputName = App.$("nameInp").value.trim();
  // Name ist OPTIONAL → leer = automatischer Gast-Name
  if (!takeHost && !team) return alert("Bitte ein Teen oder „" + (window.TeensContent?.neutralLabel || "Noch offen") + "“ wählen!");

  const playersSnap = await get(ref(db, `rooms/${App.room}/players`));
  const players = playersSnap.val() || {};

  // "Noch offen" → automatisch dem Team mit den AKTUELL wenigsten Fans
  // zuteilen. Bei Gleichstand zufällig unter den kleinsten wählen, damit
  // sich bei vielen gleichzeitigen Logins keine Schlange auf EIN Team bildet.
  if (team === AUTO_ID) {
    const counts = {};
    teensOnly().forEach(t => counts[t.id] = 0);
    Object.values(players).forEach(p => { if (p.team && counts[p.team] !== undefined) counts[p.team]++; });
    const min = Math.min(...Object.values(counts));
    const smallest = Object.keys(counts).filter(id => counts[id] === min);
    team = smallest[Math.floor(Math.random() * smallest.length)];
    const t = teamById(team);
    if (t) toast(`Du bist im Team ${t.emoji} ${t.name}!`);
  }

  let finalName = inputName;
  if (!finalName) {
    // automatischer, freundlicher Gast-Name
    let n = Object.keys(players).length + 1;
    while (Object.values(players).some(p => p.name === ("Gast " + n))) n++;
    finalName = "Gast " + n;
  }

  let uid = localStorage.getItem("teens_uid") || (finalName.replace(/\s+/g,'') + "_" + Math.random().toString(36).substr(2, 4));

  if (!takeHost) {
    let nameExists = Object.values(players).some(p => p.name === finalName && p.uid !== uid);
    if (nameExists) {
      let count = 2;
      while (Object.values(players).some(p => p.name === (finalName + " " + count))) { count++; }
      finalName = finalName + " " + count;
      toast(`Name angepasst: ${finalName}`);
    }
  }

  App.user = uid;
  App.userName = finalName;
  App.team = team;

  localStorage.setItem("teens_uid", uid);
  localStorage.setItem("teens_name", finalName);

  if (takeHost) {
    await update(ref(db, `rooms/${App.room}/meta`), { host: uid, hostName: finalName });
  } else {
    await update(ref(db, `rooms/${App.room}/players/${uid}`), {
      name: finalName, team: team, uid: uid,
      score: players[uid]?.score || 0, joined: Date.now()
    });
  }
  finishLogin();
}

function finishLogin() {
  App.$("login").classList.add("hidden");
  App.$("app").classList.remove("hidden");
  attachListeners();
  bindCoreUI();
  if (App.listeners.onReady) App.listeners.onReady();
  switchTab("Game");
}

function attachListeners() {
  onValue(ref(db, `rooms/${App.room}/meta`), snap => {
    const m = snap.val() || {};
    App.meta = m;

    App.isHost = (m.host === App.user);

    renderBadge();

    const hStat = App.$("hostStatus");
    if(hStat) hStat.innerHTML = `Aktueller Host: <b>${m.hostName || '-'}</b>`;

    const controls = App.$("hostControls");
    if(controls) controls.classList.toggle("hidden", !App.isHost);
    document.querySelectorAll(".hostOnly").forEach(el => el.classList.toggle("hidden", !App.isHost));

    // Beim Host-Werden: nur DER Host abonniert den grossen /answers-Knoten.
    if(App.isHost && !App._wasHost){
      App._wasHost = true;
      if(App.listeners.onBecomeHost) App.listeners.onBecomeHost();
    }

    if(App.isHost) renderModeration();
  });

  onValue(ref(db, `rooms/${App.room}/players`), snap => {
    App.players = snap.val() || {};

    // Selbst-Namens-Sync: hat der Host MEINEN Namen geändert (Moderation),
    // übernimmt mein Gerät den neuen Namen.
    const me = App.players[App.user];
    if(me && me.name && me.name !== App.userName){
      App.userName = me.name;
      localStorage.setItem("teens_name", me.name);
      renderBadge();
    }

    renderTeamBoard();
    renderLeaderboard();
    renderModeration();
  });

  onValue(ref(db, `rooms/${App.room}/teams`), snap => {
    App.teams = snap.val() || {};
    renderTeamBoard();
  });
}

function renderBadge(){
  const badge = App.$("userBadge");
  if(!badge) return;
  const emoji = App.isHost ? "👑" : teamEmoji(App.team);
  badge.innerHTML = `<span class="badge" style="color:${App.isHost?'var(--gold)':teamColor(App.team)}">${emoji} ${App.userName}</span>` +
                    (App.isHost ? ' <span class="badge host"> (Host)</span>' : '');
}

function bindCoreUI(){
  document.querySelectorAll(".tab").forEach(t=>{
    t.onclick = ()=>switchTab(t.dataset.tab);
  });

  const modFilter = App.$("modFilter");
  if(modFilter) modFilter.oninput = ()=>renderModeration();

  const btnReset = App.$("btnResetScores");
  if(btnReset) btnReset.onclick = async()=>{
    if(!App.isHost || !confirm("Alle Scores auf 0?")) return;
    const upd = {};
    Object.keys(App.players).forEach(p=>{ upd[`${p}/score`] = 0; });
    await update(ref(db, `rooms/${App.room}/players`), upd);
    await remove(ref(db, `rooms/${App.room}/teams`));
    toast("Alles zurückgesetzt");
  };

  const btnFull = App.$("btnFullReset");
  if(btnFull) btnFull.onclick = async()=>{
    if(!App.isHost || !confirm("WIRKLICH ALLES löschen? Alle Spieler fliegen raus.")) return;
    await remove(ref(db, `rooms/${App.room}`));
    localStorage.removeItem("teens_uid");
    localStorage.removeItem("teens_name");
    location.reload();
  };

  const bu = location.origin + location.pathname + "?beamer=1";
  const bUrl = App.$("beamerUrl");
  if(bUrl) bUrl.innerText = bu;
  const btnCopy = App.$("btnCopyUrl");
  if(btnCopy) btnCopy.onclick = ()=>{
    navigator.clipboard.writeText(bu);
    toast("URL kopiert");
  };
}

function switchTab(name){
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active", x.dataset.tab === name));
  document.querySelectorAll(".tabPane").forEach(p=>p.classList.add("hidden"));
  const t = App.$("tab"+name);
  if(t) t.classList.remove("hidden");
}

// ── Team-Board: eine Karte pro Teen-Team ────────────────────
function renderTeamBoard(){
  const board = App.$("teamBoard"); if(!board) return;
  const players = App.players || {};
  const wins = App.teams || {};

  // Mitgliederzahl pro Team
  const memberCount = {};
  Object.values(players).forEach(p=>{ if(p.team) memberCount[p.team] = (memberCount[p.team]||0)+1; });

  const maxWins = Math.max(0, ...allTeams().map(t => wins[t.id] || 0));

  board.innerHTML = allTeams().map(t=>{
    const w = wins[t.id] || 0;
    const winning = w > 0 && w === maxWins;
    return `
      <div class="team-card ${winning?'team-winning':''}" style="--tcol:${t.color}">
        <div class="nm">${t.emoji} ${t.name}</div>
        <div class="pts" style="color:${t.color}">${w}</div>
        <div class="pts-sub">Rundensiege</div>
        <div class="mem">${memberCount[t.id]||0} Fans</div>
      </div>`;
  }).join("");
}

function renderLeaderboard(){
  const lb = App.$("leaderboard"); if(!lb) return;
  const sorted = Object.entries(App.players).sort((a,b)=>(b[1].score||0)-(a[1].score||0));
  lb.innerHTML = sorted.map(([n, d], i)=>{
    const medal = ['🥇','🥈','🥉'][i] || ((i+1)+'. ');
    const displayName = d.name || n.split('_')[0];
    return `<div class="score-row ${n===App.user?'me':''}">
      <span><span class="tm" style="background:${teamColor(d.team)}">${teamEmoji(d.team)}</span>${medal}${displayName}</span>
      <strong>${d.score||0} Pkt</strong>
    </div>`;
  }).join("") || '<div class="sub">Noch keine Spieler</div>';
}

// ── NAMENS-MODERATION (nur Host) ────────────────────────────
// Liste aller Gäste; der Host kann einen unpassenden Namen mit einem Klick
// auf "Gast N" umbenennen (erscheint dann auch auf der Leinwand neutral).
function renderModeration(){
  const box = App.$("modList");
  if(!box || !App.isHost) return;
  const filter = (App.$("modFilter")?.value || "").trim().toLowerCase();

  let entries = Object.entries(App.players);
  if(filter) entries = entries.filter(([uid,d]) => (d.name||uid).toLowerCase().includes(filter));
  // Neueste zuerst – unpassende Namen tauchen meist beim Beitritt auf.
  entries.sort((a,b)=>(b[1].joined||0)-(a[1].joined||0));

  const total = Object.keys(App.players).length;
  const cap = 60;
  const shown = entries.slice(0, cap);

  const rows = shown.map(([uid,d])=>{
    const nm = d.name || uid.split('_')[0];
    const isGuest = /^Gast \d+$/.test(nm);
    return `<div class="score-row">
      <span><span class="tm" style="background:${teamColor(d.team)}">${teamEmoji(d.team)}</span>${nm}</span>
      <button class="btn-sm ${isGuest?'btn-ghost':'btn-red'}" data-rename="${uid}" ${isGuest?'disabled':''}>→ Gast</button>
    </div>`;
  }).join("");

  box.innerHTML = `<div class="sub">${total} Gäste${filter?` · gefiltert: ${shown.length}`:(total>cap?` · zeige neueste ${cap}`:'')}</div>` +
                  (rows || '<div class="sub">Niemand da</div>');

  box.querySelectorAll("[data-rename]").forEach(b=>{
    b.onclick = ()=>renameToGuest(b.dataset.rename);
  });
}

async function renameToGuest(uid){
  if(!App.isHost) return;
  const cur = App.players[uid];
  if(!cur) return;
  // nächste freie "Gast N"-Nummer suchen
  let n = 1;
  const names = Object.values(App.players).map(p=>p.name);
  while(names.includes("Gast " + n)) n++;
  const newName = "Gast " + n;
  await update(ref(db, `rooms/${App.room}/players/${uid}`), { name: newName });
  toast(`Umbenannt zu ${newName}`);
}

console.log("✅ core.js loaded (Teens)");
