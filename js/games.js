// === games.js – Quiz-Runner: "Welcher Teen ist das?" + Schätzfragen ===
// Team-Wertung ist RELATIV (Trefferquote in %), nie absolut → kein
// Popularitäts-Contest, Teamgrösse egal.
const A = window.App, { db, ref, set, onValue, update, get, remove, $, toast, shuffle } = A;

// ── Individuelle Punkte (Kahoot-Stil, mit Zeitfaktor) ──────────
// Richtige Antwort: BASE..(BASE+BONUS) Punkte je nach Tempo.
// Wer SOFORT nach Erscheinen der Frage richtig tippt ≈ MAX,
// wer kurz vor Ablauf richtig tippt ≈ BASE. Falsch = 0.
const PTS_BASE  = 500;   // Sockel für jede richtige Antwort
const PTS_BONUS = 500;   // zusätzlicher Tempo-Bonus (max)
function speedPoints(elapsedMs, totalMs){
  if(elapsedMs == null || !(totalMs > 0)) return PTS_BASE; // keine Zeit gemessen → nur Sockel
  const f = Math.max(0, Math.min(1, 1 - elapsedMs / totalMs));
  return Math.round(PTS_BASE + PTS_BONUS * f);
}
// Antwort kann altes Format (Wert) oder neues Format ({v,t}) sein.
function ansVal(raw){ return (raw && typeof raw === "object") ? raw.v : raw; }
function ansTime(raw){ return (raw && typeof raw === "object") ? raw.t : null; }
// Text für ein HTML-Attribut absichern (Trivia-Optionen können Sonderzeichen haben).
function escAttr(s){ return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

// Progressive Bild-Freigabe (Alternative, standardmässig aus).
function photoRevealOn(){ return (window.TeensContent && window.TeensContent.photoReveal) === true; }
function photoBlurPx(leftMs, totalMs){
  const max = (window.TeensContent && window.TeensContent.photoBlurMax) || 26;
  if(!(totalMs > 0)) return 0;
  return Math.round(max * Math.max(0, Math.min(1, leftMs / totalMs)));
}

// Verzögerte Frage: Bei Bildfragen erscheint der Fragetext erst nach X Sek.
function hasPhoto(g){ return !!(g && (g.photoUrl || g.photobeamer)); }
function questionDelayMs(g){
  if(!g || g.phase !== "answer" || !hasPhoto(g)) return 0;
  const sec = (g.qdelay != null) ? g.qdelay : (window.TeensContent && window.TeensContent.questionDelaySec) || 0;
  return sec > 0 ? sec * 1000 : 0;
}
// noch im Verzögerungsfenster? (gemessen ab Frage-Start, beamer-/gerätesync)
function questionStillHidden(g){
  const d = questionDelayMs(g);
  return d > 0 && (Date.now() - g.startedAt) < d;
}

// Auto-Auflösung nach Countdown (global, Standard aus content.js).
A.autoReveal = (window.TeensContent && window.TeensContent.autoReveal) !== false;
let hostRevealTimer = null;
function scheduleAutoReveal(){
  if(hostRevealTimer){ clearTimeout(hostRevealTimer); hostRevealTimer = null; }
  if(!A.isHost || !A.autoReveal) return;
  const g = A.state.game;
  if(!g || g.phase !== "answer" || !g.endsAt) return;
  const left = Math.max(0, g.endsAt - Date.now());
  // kleiner Puffer (300ms), damit die letzten Antworten noch ankommen
  hostRevealTimer = setTimeout(()=>{
    if(A.state.game && A.state.game.phase === "answer") revealCurrent();
  }, left + 300);
}

// Lokale Antwort DIESES Geräts. Gäste lesen NICHT mehr alle fremden Antworten
// (Skalierung für ~300 Geräte) → der eigene Tipp wird nur lokal gemerkt.
A.myAnswer = undefined;
A.state.answers = {};

const prevReady = A.listeners.onReady;
A.listeners.onReady = ()=>{
  if(prevReady) prevReady();

  onValue(ref(db, `rooms/${A.room}/quiz`), snap=>{
    A.state.quiz = snap.val();
    renderHostStatus();
  });

  onValue(ref(db, `rooms/${A.room}/game`), snap => {
    const prevGame = A.state.game;
    const newGame = snap.val();
    A.state.game = newGame;

    // /game ist jetzt KLEIN (keine Antworten mehr drin) → ändert sich nur bei
    // neuer Frage/Phase und beim gedrosselten Zähler.
    const isNew = newGame && (!prevGame
        || prevGame.q !== newGame.q
        || prevGame.phase !== newGame.phase
        || prevGame.quizIdx !== newGame.quizIdx);

    if (isNew) {
      if (newGame.phase === "answer") {
        A.questionReceivedAt = Date.now();   // Tempo-Messung ab jetzt (pro Gerät)
        A.myAnswer = undefined;              // neue Frage → eigene Antwort zurücksetzen
      }
      if (!A.isHost && !A.isBeamer) A.switchTab("Game");
      renderGame();
    } else {
      updateLiveCounter(newGame);            // nur der "x/y"-Zähler
    }

    renderHostStatus();
    maybeStartClientTimer();
    scheduleAutoReveal();
  });

  bindHostUI();
  populateSetDropdown();
};

// ── NUR der Host abonniert den (grossen) Antworten-Knoten ──────────────
// Dadurch bekommen die ~300 Gäste-Geräte den Antworten-Strom NIE. Gäste &
// Beamer lesen nur den kleinen Zähler game/answered.
A.listeners.onBecomeHost = subscribeHostAnswers;
let hostAnswersSubscribed = false;
function subscribeHostAnswers(){
  if(hostAnswersSubscribed) return;
  hostAnswersSubscribed = true;
  onValue(ref(db, `rooms/${A.room}/answers`), snap=>{
    A.state.answers = snap.val() || {};
    scheduleAnsweredCountWrite();
    renderHostStatus();
  });
}

// Host schreibt die Antwort-Anzahl gedrosselt (~1/s) nach game/answered.
let answeredWriteTimer = null;
function scheduleAnsweredCountWrite(){
  if(answeredWriteTimer) return;
  answeredWriteTimer = setTimeout(async ()=>{
    answeredWriteTimer = null;
    if(!A.isHost) return;
    const g = A.state.game;
    if(!g || g.phase !== "answer") return;
    const cnt = Object.keys(A.state.answers || {}).length;
    await update(ref(db, `rooms/${A.room}/game`), { answered: cnt });
  }, 1000);
}

// Antwort-Anzahl: Host kennt sie exakt, Gäste/Beamer aus dem kleinen Zähler.
function answeredCount(g){
  if(A.isHost) return Object.keys(A.state.answers || {}).length;
  return (g && g.answered) || 0;
}

function updateLiveCounter(g) {
  if (!g || g.phase !== "answer") return;
  const answered = answeredCount(g);
  const total = Object.values(A.players).length;
  document.querySelectorAll(".live-counter-text").forEach(el => {
    el.innerText = `${answered} / ${total} haben geantwortet`;
  });
}

// ═══════════════════════════════════════════════════════════
// HOST-UI
// ═══════════════════════════════════════════════════════════
function populateSetDropdown(){
  const sel = $("setSel"); if(!sel) return;
  const sets = (window.TeensContent || {}).sets || [];
  sel.innerHTML = sets.map(s=>`<option value="${s.id}">${s.label}</option>`).join("");
}

function bindHostUI(){
  $("btnStartSet").onclick = startSelectedSet;
  $("btnReveal").onclick = revealCurrent;
  $("btnNextQ").onclick = nextQuestion;
  $("btnAddTime").onclick = ()=>addTimerSeconds(10);
  $("btnEndGame").onclick = abortGame;

  const ar = $("autoRevealToggle");
  if(ar){
    ar.checked = A.autoReveal;
    ar.onchange = ()=>{ A.autoReveal = ar.checked; scheduleAutoReveal(); toast(A.autoReveal ? "Auto-Auflösung an" : "Auto-Auflösung aus"); };
  }

  const bs = $("btnShowScores");
  if(bs) bs.onclick = async()=>{ if(!A.isHost) return; await set(ref(db, `rooms/${A.room}/show`), "scores"); toast("🏆 Rangliste am Beamer"); };
  const bh = $("btnHideScores");
  if(bh) bh.onclick = async()=>{ if(!A.isHost) return; await remove(ref(db, `rooms/${A.room}/show`)); toast("Beamer zurück zum Spiel"); };
}

function renderHostStatus(){
  const rs = $("runningStatus");
  const q = A.state.quiz, g = A.state.game;
  if(!rs) return;

  const revealBtn = $("btnReveal"), nextBtn = $("btnNextQ"), timeBtn = $("btnAddTime");
  revealBtn.disabled = !(g && g.phase === "answer");
  timeBtn.disabled = !(g && g.phase === "answer");

  if(!q && !g && !A.state.tapduel){
    rs.innerHTML = "Kein Spiel aktiv";
    nextBtn.classList.add("hidden");
    return;
  }
  if(A.state.tapduel){
    rs.innerHTML = `⚡ Tap-Duell läuft`;
    nextBtn.classList.add("hidden");
    return;
  }
  if(q && g){
    const answered = answeredCount(g);
    const total = Object.values(A.players).length;
    rs.innerHTML = `📋 ${q.setLabel}<br>
      Frage ${q.current + 1}/${q.total} · ${answered}/${total} geantwortet<br>
      Phase: <b>${g.phase === "answer" ? "Antworten" : "Auflösung"}</b>`;
    const isLast = q.current + 1 >= q.total;
    nextBtn.classList.toggle("hidden", !(g.phase === "reveal"));
    nextBtn.innerText = g.phase === "reveal" ? (isLast ? "🏁 Quiz beenden" : "➡️ Nächste Frage") : "";
  } else if(g){
    const answered = answeredCount(g);
    const total = Object.values(A.players).length;
    rs.innerHTML = `Einzelfrage · ${answered}/${total} geantwortet · Phase: <b>${g.phase}</b>`;
    nextBtn.classList.add("hidden");
  }
}

// ═══════════════════════════════════════════════════════════
// QUIZ-SET STARTEN
// ═══════════════════════════════════════════════════════════
async function startSelectedSet(){
  if(!A.isHost) return;
  await remove(ref(db, `rooms/${A.room}/tapduel`));
  await remove(ref(db, `rooms/${A.room}/show`));   // Rangliste-Overlay am Beamer aus

  const setId = $("setSel").value;
  const sets = (window.TeensContent || {}).sets || [];
  const setDef = sets.find(s=>s.id === setId);
  if(!setDef) return toast("Set nicht gefunden");

  const questions = buildQuestionList(setDef.pick);
  if(!questions.length) return toast("Keine Fragen in diesem Set");

  const overrideTimer = parseInt($("timerOverride").value);
  const timer = !isNaN(overrideTimer) && overrideTimer > 0 ? overrideTimer : setDef.timer;

  const quiz = {
    setId, setLabel: setDef.label,
    total: questions.length,
    current: 0,
    questions,
    timer,
    startedAt: Date.now()
  };
  await set(ref(db, `rooms/${A.room}/quiz`), quiz);
  await loadQuestion(0);
  toast(`🚀 ${setDef.label} gestartet`);
}

function buildQuestionList(pick){
  const pool = (window.TeensContent || {}).questions || {};
  const out = [];

  for(const [type, amount] of Object.entries(pick)){
    if(type === "random"){
      const all = [];
      for(const [t, arr] of Object.entries(pool)){
        (arr || []).forEach(q => all.push({ ...q, type: t }));
      }
      out.push(...shuffle(all).slice(0, amount));
    } else {
      const arr = pool[type] || [];
      if(amount === "all"){
        out.push(...arr.map(q => ({ ...q, type })));
      } else {
        out.push(...arr.slice(0, amount).map(q => ({ ...q, type })));
      }
    }
  }
  return out;
}

async function loadQuestion(idx){
  if(!A.isHost) return;
  const q = (await get(ref(db, `rooms/${A.room}/quiz`))).val();
  if(!q) return;
  if(idx >= q.total){ return finishQuiz(); }

  const qData = q.questions[idx];
  const endsAt = Date.now() + q.timer * 1000;
  const game = {
    type: qData.type,
    q: qData.q,
    phase: "answer",
    startedAt: Date.now(),
    endsAt,
    answered: 0,        // kleiner Live-Zähler (Antworten liegen in /answers)
    quizIdx: idx
  };
  if(qData.answer !== undefined) game.answer = qData.answer;
  if(qData.photoUrl) game.photoUrl = qData.photoUrl;        // klein → Handy
  if(qData.photobeamer) game.photobeamer = qData.photobeamer; // gross → Beamer
  if(qData.unit !== undefined) game.unit = qData.unit;
  if(qData.options) game.options = qData.options;   // Trivia: Antwort-Optionen
  if(qData.delay !== undefined) game.qdelay = qData.delay;  // Frage-Verzögerung (Sek), pro Frage

  // Antworten der vorigen Frage löschen, DANN neue Frage scharf schalten.
  A.state.answers = {};
  await remove(ref(db, `rooms/${A.room}/answers`));
  await set(ref(db, `rooms/${A.room}/game`), game);
  await update(ref(db, `rooms/${A.room}/quiz`), { current: idx });
}

async function nextQuestion(){
  if(!A.isHost) return;
  const q = (await get(ref(db, `rooms/${A.room}/quiz`))).val();
  if(!q) return;
  const nextIdx = (q.current || 0) + 1;
  if(nextIdx >= q.total) return finishQuiz();
  await loadQuestion(nextIdx);
}

async function finishQuiz(){
  if(!A.isHost) return;
  const q = (await get(ref(db, `rooms/${A.room}/quiz`))).val();
  if(!q) return;
  await set(ref(db, `rooms/${A.room}/game`), {
    type: "_quizdone",
    q: `Quiz "${q.setLabel}" beendet`,
    phase: "reveal",
    startedAt: Date.now(),
    quizSummary: true
  });
  await remove(ref(db, `rooms/${A.room}/quiz`));
  await remove(ref(db, `rooms/${A.room}/answers`));
  toast("Quiz beendet");
}

async function abortGame(){
  if(!A.isHost) return;
  if(!confirm("Laufendes Spiel abbrechen?")) return;
  await remove(ref(db, `rooms/${A.room}/quiz`));
  await remove(ref(db, `rooms/${A.room}/game`));
  await remove(ref(db, `rooms/${A.room}/answers`));
  await remove(ref(db, `rooms/${A.room}/tapduel`));
  toast("Abgebrochen");
}

async function addTimerSeconds(sec){
  if(!A.isHost) return;
  const g = (await get(ref(db, `rooms/${A.room}/game`))).val();
  if(!g || g.phase !== "answer") return;
  await update(ref(db, `rooms/${A.room}/game`), { endsAt: (g.endsAt || Date.now()) + sec * 1000 });
  toast(`+${sec} Sek`);
}

// ═══════════════════════════════════════════════════════════
// CLIENT-TIMER
// ═══════════════════════════════════════════════════════════
function maybeStartClientTimer(){
  A.clearTimers();
  const g = A.state.game;
  if(!g || g.phase !== "answer" || !g.endsAt) return;

  const tick = ()=>{
    const left = Math.max(0, g.endsAt - Date.now());
    updateTimerDisplay(left, g.endsAt - g.startedAt);
    maybeRevealQuestion(g);
    if(left <= 0){
      A.clearTimers();
      const num = document.getElementById("timerNum");
      if(num) num.innerText = "⏳";
    }
  };
  tick();
  A.timers.push(setInterval(tick, 250));
}

// Fragetext nach Ablauf der Verzögerung einblenden (bzw. Countdown anzeigen).
function maybeRevealQuestion(g){
  const d = questionDelayMs(g);
  if(!d) return;
  const el = document.getElementById("qtext");
  if(!el) return;
  const elapsed = Date.now() - g.startedAt;
  if(elapsed >= d){
    if(el.classList.contains("q-pending")){ el.className = "q-big"; el.textContent = g.q; }
  } else {
    const cd = document.getElementById("qcountdown");
    if(cd) cd.textContent = Math.ceil((d - elapsed) / 1000) + "s";
  }
}

function updateTimerDisplay(leftMs, totalMs){
  const leftSec = Math.ceil(leftMs / 1000);
  const pct = totalMs > 0 ? (leftMs / totalMs) * 100 : 0;
  const fill = document.getElementById("timerFill");
  const num = document.getElementById("timerNum");
  if(fill){
    fill.style.width = pct + "%";
    fill.classList.toggle("warn", leftSec <= 10 && leftSec > 5);
    fill.classList.toggle("crit", leftSec <= 5);
  }
  if(num) num.innerText = leftSec + "s";
  const img = document.getElementById("qphoto");
  if(img && photoRevealOn()) img.style.filter = `blur(${photoBlurPx(leftMs, totalMs)}px)`;
}

// ═══════════════════════════════════════════════════════════
// PLAYER-SICHT: Aktuelles Spiel
// ═══════════════════════════════════════════════════════════
function renderGame(){
  const g = A.state.game, q = A.state.quiz, tap = A.state.tapduel;
  const panel = $("gamePanel"), wait = $("gameWait");

  if(tap){
    panel.classList.add("hidden");
    wait.classList.add("hidden");
    return;
  }

  if(!g){
    panel.classList.add("hidden");
    wait.classList.remove("hidden");
    return;
  }
  panel.classList.remove("hidden");
  wait.classList.add("hidden");
  const body = $("gameBody");

  if(g.type === "_quizdone"){
    body.innerHTML = renderQuizSummary();
    return;
  }

  const myAns = A.myAnswer ? A.myAnswer.v : undefined;   // eigener Tipp (lokal)
  let html = "";

  if(q){
    html += `<div class="q-num">Frage ${q.current + 1} / ${q.total}</div>`;
  }
  // Bildfragen: Foto sofort, Fragetext (Hinweis) erst nach der Verzögerung.
  if(questionStillHidden(g)){
    html += `<div class="q-big q-pending" id="qtext">🔍 Schau genau hin … <span id="qcountdown"></span></div>`;
  } else {
    html += `<div class="q-big" id="qtext">${g.q}</div>`;
  }

  if(g.photoUrl){
    const blur = (g.phase === "answer" && photoRevealOn() && g.endsAt)
      ? photoBlurPx(g.endsAt - Date.now(), g.endsAt - g.startedAt) : 0;
    html += `<div class="photo-box"><img id="qphoto" style="filter:blur(${blur}px)" src="${g.photoUrl}" alt="" onerror="this.parentElement.innerHTML='<div class=&quot;ph&quot;>📷</div>'"></div>`;
  }

  if(g.phase === "answer"){
    if(g.endsAt){
      html += `<div class="timer-num" id="timerNum"></div>
        <div class="timer-bar"><div class="fill" id="timerFill"></div></div>`;
    }

    const cnt = answeredCount(g);
    const total = Object.values(A.players).length;

    if(A.isHost){
      html += `<div class="flash gold">👑 Du bist Host – du spielst nicht mit.</div>`;
      html += `<div class="flash live-counter-text">${cnt} / ${total} haben geantwortet</div>`;
      html += `<div class="sub" style="text-align:center">Steuerung im Host-Tab unten</div>`;
    } else if(myAns !== undefined){
      const label = labelForAnswer(g, myAns);
      html += `<div class="flash">✅ Deine Antwort: <b>${label}</b></div>`;
      html += `<div class="sub live-counter-text" style="text-align:center">${cnt} / ${total} haben geantwortet</div>`;
    } else {
      html += buildAnswerInput(g);
      html += `<div class="sub live-counter-text" style="text-align:center; margin-top: 15px;">${cnt} / ${total} haben geantwortet</div>`;
    }
  }
  else if(g.phase === "reveal"){
    html += buildRevealView(g);
  }

  body.innerHTML = html;
  wireAnswerInputs(g);
}

function labelForAnswer(g, ans){
  if(g.type === "guess" || g.type === "poll") return A.teamName(ans);
  if(g.type === "estimate") return g.unit ? `${ans} ${g.unit}` : String(ans);
  return String(ans);
}

function buildAnswerInput(g){
  // Teen wählen (mit Foto) – für "guess" (echte Antwort) und "poll" (Schwarm)
  if(g.type === "guess" || g.type === "poll"){
    const btns = A.teensOnly().map(t => `
      <button class="teen-btn" data-send="${t.id}" style="--tcol:${t.color}">
        ${A.avatarHtml(t)}<span class="tn">${t.name}</span>
      </button>`).join("");
    return `<div class="teen-grid" style="margin-top:16px">${btns}</div>`;
  }
  // Bibel-Trivia: eine der vorgegebenen Optionen wählen
  if(g.type === "trivia"){
    const cols = (window.TeensContent || {}).optionColors || ["#d4af37"];
    const btns = (g.options || []).map((opt, i) => {
      const col = cols[i % cols.length];
      return `<button class="opt-btn" data-send="${escAttr(opt)}" style="--tcol:${col}">
        <span class="opt-letter">${String.fromCharCode(65 + i)}</span>${opt}
      </button>`;
    }).join("");
    return `<div class="opt-grid" style="margin-top:16px">${btns}</div>`;
  }
  if(g.type === "estimate"){
    return `<input id="estInp" type="number" step="any" placeholder="Deine Schätzung${g.unit?' ('+g.unit+')':''}" autofocus>
      <button class="btn-green" id="estSend">Antwort senden</button>`;
  }
  return "";
}

// Antwort + Reaktionszeit (ms seit Erscheinen der Frage). Geschrieben wird in
// den separaten Knoten /answers/{uid} – nur der Host abonniert den. Der eigene
// Tipp wird lokal gemerkt und sofort angezeigt (kein Read-Back nötig).
async function sendAnswer(value){
  if(A.myAnswer) return;            // Doppel-Tipp verhindern
  const elapsed = Math.max(0, Date.now() - (A.questionReceivedAt || Date.now()));
  A.myAnswer = { v: value, t: elapsed };
  renderGame();                      // sofortiges Feedback ("Deine Antwort: …")
  try {
    await set(ref(db, `rooms/${A.room}/answers/${A.user}`), A.myAnswer);
  } catch(e){
    A.myAnswer = undefined;          // bei Fehler erneut versuchen lassen
    renderGame();
    toast("Antwort konnte nicht gesendet werden – nochmal tippen");
  }
}

function wireAnswerInputs(g){
  document.querySelectorAll("[data-send]").forEach(btn=>{
    btn.onclick = ()=> sendAnswer(btn.dataset.send);
  });
  const es = $("estSend");
  if(es) es.onclick = ()=>{
    const v = parseFloat($("estInp").value);
    if(isNaN(v)) return toast("Bitte Zahl eingeben!");
    sendAnswer(v);
  };
  const inp = $("estInp");
  if(inp) inp.onkeydown = e=>{ if(e.key === "Enter") es.click(); };
}

// ═══════════════════════════════════════════════════════════
// AUFLÖSUNG – Batch-Score-Update für viele Gäste
//
// ZWEI Wertungen (wie gewünscht):
//  • TEAM   : RELATIV zur Teamgrösse → Trefferquote in %. Das Team mit der
//             höchsten Quote gewinnt die Runde (+1). So gibt es über alle
//             Fragen ~20 Team-Punkte und die Teamgrösse spielt keine Rolle.
//  • EINZEL : Kahoot-Stil mit Zeitfaktor → schneller richtig = mehr Punkte.
//
// Frage-Typen:
//  • guess  : feste richtige Antwort (Teen-id)
//  • trivia : feste richtige Antwort (Options-Text, z.B. Bibel-Figur)
//  • poll   : KEINE feste Antwort → die MEHRHEIT bestimmt die "richtige"
//             Antwort ("errate, was der Saal denkt").
//  • estimate: Zahl, am nächsten dran punktet.
// ═══════════════════════════════════════════════════════════
async function revealCurrent() {
  if (!A.isHost) return;
  const g = (await get(ref(db, `rooms/${A.room}/game`))).val();
  if (!g || g.phase !== "answer") return;

  // Antworten aus dem separaten Knoten holen (frischester Stand).
  const rawAnswers = (await get(ref(db, `rooms/${A.room}/answers`))).val() || {};
  const players = A.players || {};
  const teamIds = A.allTeams().map(t => t.id);
  const totalMs = (g.endsAt && g.startedAt) ? (g.endsAt - g.startedAt) : null;

  // teamStats: pro Team correct/answered/rate + Ø-Punkte der Runde
  const teamStats = {};
  teamIds.forEach(id => teamStats[id] = { correct: 0, answered: 0, rate: 0, sumPts: 0, roundAvg: 0 });
  // Mitgliederzahl pro Team (für "members"-Nenner)
  const avgMode = (window.TeensContent && window.TeensContent.teamAvgDenominator) || "answered";
  const memberCount = {}; teamIds.forEach(id => memberCount[id] = 0);
  Object.values(players).forEach(p => { if (p.team && memberCount[p.team] !== undefined) memberCount[p.team]++; });
  const breakdown = {};   // Antwort-Verteilung (key = getippter Wert)
  const ranking = [];     // nur für estimate

  const scoreDeltas = {};
  const addScore = (uid, pts) => { scoreDeltas[uid] = (scoreDeltas[uid] || 0) + pts; };

  // Antworten in einheitliches { v, t } normalisieren
  const answers = {};
  for (const [uid, raw] of Object.entries(rawAnswers)) {
    answers[uid] = { v: ansVal(raw), t: ansTime(raw) };
  }

  for (const [uid, a] of Object.entries(answers)) {
    const p = players[uid];
    if (!p) continue;
    breakdown[a.v] = (breakdown[a.v] || 0) + 1;
    if (p.team && teamStats[p.team]) teamStats[p.team].answered++;
    if (g.type === "estimate") {
      const diff = Math.abs(a.v - g.answer);
      ranking.push({ uid, p: p.name || uid.split('_')[0], team: p.team, v: a.v, diff });
    }
  }

  let roundBest = null;          // Team mit dem höchsten Ø dieser Runde (nur Highlight)
  let finalCorrectAnswer = g.answer;
  const teamRoundPts = {};       // { teamId: Ø-Punkte dieser Runde } für die teams-Gutschrift

  if (g.type === "estimate") {
    // ── SCHÄTZFRAGE (Nebenmodus): nur Einzel-Top-3, keine Team-Punkte ──
    ranking.sort((a, b) => a.diff - b.diff);
    let currentPts = 3;
    let lastDiff = ranking.length > 0 ? ranking[0].diff : -1;
    let rankPosition = 0;
    for (let i = 0; i < ranking.length; i++) {
      if (ranking[i].diff > lastDiff) {
        rankPosition++;
        currentPts = 3 - rankPosition;
        lastDiff = ranking[i].diff;
      }
      if (currentPts <= 0) break;
      addScore(ranking[i].uid, currentPts);
      ranking[i].awardedPts = currentPts;
    }
  } else {
    // ── RATEN/TRIVIA/SCHWARM ─────────────────────────────────
    // Bei "poll" gibt es keine feste Antwort → Mehrheit = richtig.
    if (g.type === "poll") {
      finalCorrectAnswer = pickMaxStrict(breakdown); // meistgetippter Wert
    }
    if (finalCorrectAnswer != null) {
      for (const [uid, a] of Object.entries(answers)) {
        if (a.v === finalCorrectAnswer) {
          const p = players[uid];
          if (!p) continue;
          const pts = speedPoints(a.t, totalMs);      // zeitabhängige Punkte
          addScore(uid, pts);                          // EINZEL: jeder Richtige bekommt seine Punkte
          if (p.team && teamStats[p.team]) {
            teamStats[p.team].correct++;
            teamStats[p.team].sumPts += pts;           // für den Team-Ø
          }
        }
      }
    }
    // TEAM: Ø-Punkte der Runde = Summe der Punkte richtiger Tipps ÷ Nenner.
    // Nenner: Anzahl Antwortende ("answered", Standard) oder alle Fans ("members").
    let bestAvg = -1;
    teamIds.forEach(id => {
      const ts = teamStats[id];
      const denom = avgMode === "members" ? memberCount[id] : ts.answered;
      ts.rate = ts.answered > 0 ? ts.correct / ts.answered : 0;
      ts.roundAvg = denom > 0 ? Math.round(ts.sumPts / denom) : 0;
      if (ts.answered > 0) teamRoundPts[id] = ts.roundAvg;
      if (ts.roundAvg > bestAvg) { bestAvg = ts.roundAvg; roundBest = id; }
    });
    if (bestAvg <= 0) roundBest = null;
  }

  // ── BATCH: alle Punkte in einem einzigen Firebase-Update ──
  if (Object.keys(scoreDeltas).length > 0) {
    const scoreUpdates = {};
    for (const [uid, delta] of Object.entries(scoreDeltas)) {
      scoreUpdates[`${uid}/score`] = (players[uid]?.score || 0) + delta;
    }
    await update(ref(db, `rooms/${A.room}/players`), scoreUpdates);
  }

  // ── TEAM: jedem Team seine Ø-Punkte der Runde gutschreiben (kumuliert) ──
  if (Object.keys(teamRoundPts).length > 0) {
    const cur = (await get(ref(db, `rooms/${A.room}/teams`))).val() || {};
    const teamUpdates = {};
    for (const [id, avg] of Object.entries(teamRoundPts)) {
      if (avg > 0) teamUpdates[id] = (cur[id] || 0) + avg;
    }
    if (Object.keys(teamUpdates).length) await update(ref(db, `rooms/${A.room}/teams`), teamUpdates);
  }

  await update(ref(db, `rooms/${A.room}/game`), {
    phase: "reveal",
    answer: finalCorrectAnswer,
    answered: Object.keys(answers).length,
    result: { teamStats, breakdown, ranking, roundBest }
  });
  // Antworten-Knoten leeren (Verteilung steckt jetzt in result.breakdown).
  A.state.answers = {};
  await remove(ref(db, `rooms/${A.room}/answers`));
}

// Höchster Wert; bei Gleichstand an der Spitze → null (kein Sieger)
function pickMaxStrict(obj){
  const entries = Object.entries(obj);
  if(!entries.length) return null;
  let best = -Infinity, who = null, tie = false;
  for(const [k,v] of entries){
    if(v > best){ best = v; who = k; tie = false; }
    else if(v === best){ tie = true; }
  }
  return tie ? null : who;
}
function pickMax(obj){ return pickMaxStrict(obj); }

// ═══════════════════════════════════════════════════════════
// AUFLÖSUNGS-ANSICHT (Spieler)
// ═══════════════════════════════════════════════════════════
function buildRevealView(g){
  const r = g.result || {};
  let html = "";

  const rawMy = A.myAnswer;                       // eigener Tipp (lokal gemerkt)
  const myAns = rawMy ? rawMy.v : undefined;
  const totalMs = (g.endsAt && g.startedAt) ? (g.endsAt - g.startedAt) : null;
  const myPts = (myAns !== undefined && g.answer != null && myAns === g.answer)
    ? speedPoints(rawMy ? rawMy.t : null, totalMs) : 0;

  if (!A.isHost && !A.isBeamer) {
    if (g.type === "estimate") {
       const myEntry = (r.ranking || []).find(e => e.uid === A.user);
       if (myEntry && myEntry.awardedPts) {
         html += `<div class="flash gold" style="text-align:center;font-size:1.1rem">🎉 Stark geschätzt! Du holst <b>+${myEntry.awardedPts} Punkte</b>!</div>`;
       } else if (myAns !== undefined) {
         html += `<div class="flash" style="text-align:center">Guter Versuch, aber nicht in den Punkterängen.</div>`;
       }
    } else if (g.type === "poll") {
       if (myAns !== undefined && myAns === g.answer) {
         html += `<div class="flash gold" style="text-align:center;font-size:1.1rem">🎯 Du tippst mit der Mehrheit! <b>+${myPts} Punkte</b></div>`;
       } else if (myAns !== undefined) {
         html += `<div class="flash" style="text-align:center;font-size:1.05rem">Die Mehrheit sah es anders 😄</div>`;
       } else {
         html += `<div class="flash" style="text-align:center;opacity:.7">Du hast nicht abgestimmt.</div>`;
       }
    } else {
       if (myAns !== undefined && myAns === g.answer) {
         html += `<div class="flash gold" style="text-align:center;font-size:1.1rem">🎉 Richtig! <b>+${myPts} Punkte</b> für dich!</div>`;
       } else if (myAns !== undefined) {
         html += `<div class="flash warn" style="text-align:center;font-size:1.1rem">❌ Leider falsch!</div>`;
       } else {
         html += `<div class="flash" style="text-align:center;opacity:.7">Du hast keine Antwort abgegeben.</div>`;
       }
    }
  }

  if(g.type === "guess" || g.type === "poll"){
    const correct = A.teamById(g.answer) || {};
    const lbl = g.type === "poll" ? "🔮 Die Mehrheit sagt:" : "✓ Richtig:";
    if(g.answer != null){
      html += `<div class="flash gold"><b>${lbl}</b> ${correct.emoji||''} ${correct.name||g.answer}</div>`;
    } else {
      html += `<div class="flash warn">Kein eindeutiges Mehrheitsvotum (Gleichstand)</div>`;
    }
    html += buildDistribution(r.breakdown || {}, g.answer);
    html += teamResultRows(r, g.type === "poll");
  }
  else if(g.type === "trivia"){
    html += `<div class="flash gold"><b>✓ Richtig:</b> ${g.answer}</div>`;
    html += buildOptionDistribution(r.breakdown || {}, g.answer, g.options || []);
    html += teamResultRows(r, false);
  }
  else if(g.type === "estimate"){
    html += `<div class="flash gold"><b>✓ Richtige Antwort:</b> ${g.answer}${g.unit ? ' ' + g.unit : ''}</div>`;
    if(r.ranking && r.ranking.length){
      html += `<h3>Näher dran – besser:</h3>`;
      r.ranking.slice(0, 8).forEach((e) => {
        let medal = "🔹";
        if (e.awardedPts === 3) medal = "🥇";
        if (e.awardedPts === 2) medal = "🥈";
        if (e.awardedPts === 1) medal = "🥉";
        const ptsStr = e.awardedPts ? `+${e.awardedPts}` : '';
        html += `<div class="score-row"><span><span class="tm" style="background:${A.teamColor(e.team)}">${A.teamEmoji(e.team)}</span>${medal} ${e.p}: ${e.v}${g.unit?' '+g.unit:''} <span class="sub">(Δ ${e.diff.toFixed(1)})</span></span><strong>${ptsStr}</strong></div>`;
      });
    } else {
      html += `<div class="flash warn">Niemand hat geantwortet</div>`;
    }
  }

  if(r.roundBest && g.type !== "estimate"){
    const t = A.teamById(r.roundBest) || {};
    const avg = r.teamStats?.[r.roundBest]?.roundAvg;
    html += `<div class="flash gold" style="text-align:center;font-size:1.05rem;margin-top:14px">
      🏆 Beste Runde: ${t.emoji||''} <b>${t.name||r.roundBest}</b> – Ø ${avg} Pkt
    </div>`;
  }

  return html;
}

// Pro Team: Avatar + Name + Quote + Ø-Punkte. Farben sind ENTKOPPELT von den
// Antwort-Farben (Identifikation über Foto/Name), Prozent neutral dargestellt.
function teamResultRows(r, pollMode){
  if(!r.teamStats) return "";
  const rows = A.allTeams().slice()
    .filter(t => r.teamStats[t.id] && r.teamStats[t.id].answered > 0)
    .sort((a,b)=>(r.teamStats[b.id].roundAvg||0)-(r.teamStats[a.id].roundAvg||0));
  if(!rows.length) return "";
  let h = `<h3>${pollMode ? "Übereinstimmung mit der Mehrheit" : "Treffer & Ø-Punkte pro Team"}</h3>`;
  h += rows.map(t=>{
    const ts = r.teamStats[t.id];
    const best = r.roundBest === t.id;
    return `<div class="score-row trow ${best?'me':''}">
      <span class="trow-team">${A.avatarHtml(t)}<b>${t.name}</b></span>
      <span class="trow-stat">${ts.correct}/${ts.answered} · ${(ts.rate*100).toFixed(0)}%</span>
      <strong class="trow-pts">Ø ${ts.roundAvg}</strong>
    </div>`;
  }).join("");
  return h;
}

// Antwort-Verteilung als gestapelter Balken über alle getippten Teens
function buildDistribution(breakdown, correctId){
  const teens = A.teensOnly();
  const total = teens.reduce((s,t)=>s + (breakdown[t.id]||0), 0) || 1;
  const segs = teens.map(t=>{
    const c = breakdown[t.id] || 0;
    const pct = c / total * 100;
    if(pct === 0) return "";
    const ring = t.id === correctId ? "box-shadow:inset 0 0 0 3px var(--gold)" : "";
    return `<div class="rb" style="width:${pct}%;background:${t.color};color:#111;${ring}" title="${t.name}">${c>0?c:''}</div>`;
  }).join("");
  const legend = teens.filter(t=>breakdown[t.id]).map(t=>
    `<span style="white-space:nowrap"><span class="dot" style="background:${t.color}"></span>${t.name} (${breakdown[t.id]||0})</span>`
  ).join(" ");
  return `<div class="result-bar">${segs}</div>
    <div class="legend">${legend || '<span class="sub">Keine Antworten</span>'}</div>`;
}

// Antwort-Verteilung über Text-Optionen (Bibel-Trivia)
function buildOptionDistribution(breakdown, correctVal, options){
  const cols = (window.TeensContent || {}).optionColors || ["#d4af37"];
  const total = options.reduce((s,o)=>s + (breakdown[o]||0), 0) || 1;
  const segs = options.map((o,i)=>{
    const c = breakdown[o] || 0;
    const pct = c / total * 100;
    if(pct === 0) return "";
    const col = cols[i % cols.length];
    const ring = o === correctVal ? "box-shadow:inset 0 0 0 3px var(--gold)" : "";
    return `<div class="rb" style="width:${pct}%;background:${col};color:#111;${ring}" title="${o}">${c>0?c:''}</div>`;
  }).join("");
  const legend = options.filter(o=>breakdown[o]).map((o)=>{
    const i = options.indexOf(o); const col = cols[i % cols.length];
    return `<span style="white-space:nowrap"><span class="dot" style="background:${col}"></span>${o} (${breakdown[o]||0})</span>`;
  }).join(" ");
  return `<div class="result-bar">${segs}</div>
    <div class="legend">${legend || '<span class="sub">Keine Antworten</span>'}</div>`;
}

function renderQuizSummary(){
  const pts = A.teams || {};
  const teamsSorted = A.allTeams().slice().sort((a,b)=>(pts[b.id]||0)-(pts[a.id]||0));
  const topPlayers = Object.entries(A.players || {})
    .sort((a,b)=>(b[1].score||0)-(a[1].score||0)).slice(0, 5);
  const maxPts = Math.max(0, ...teamsSorted.map(t=>pts[t.id]||0));

  let html = `<div class="q-big">🏁 Quiz beendet!</div>`;
  html += `<h3>Team-Rangliste (Punkte)</h3><div class="team-board">`;
  html += teamsSorted.map(t=>{
    const w = pts[t.id]||0;
    const lead = w>0 && w===maxPts;
    return `<div class="team-card ${lead?'team-winning':''}" style="--tcol:${t.color}">
      <div class="nm">${t.emoji} ${t.name}</div>
      <div class="pts" style="color:${t.color}">${w}</div>
      <div class="pts-sub">Punkte</div>
    </div>`;
  }).join("");
  html += `</div>`;
  if(topPlayers.length){
    html += `<h3>Top-Tipper</h3>` + topPlayers.map(([n,d],i)=>{
      const medal = ['🥇','🥈','🥉'][i] || ((i+1)+'.');
      const displayName = d.name || n.split('_')[0];
      return `<div class="score-row"><span><span class="tm" style="background:${A.teamColor(d.team)}">${A.teamEmoji(d.team)}</span>${medal} ${displayName}</span><strong>${d.score||0} Pkt</strong></div>`;
    }).join("");
  }
  return html;
}

console.log("✅ games.js loaded (Teens)");
