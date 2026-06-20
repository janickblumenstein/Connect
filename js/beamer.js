// === beamer.js – Großbild-Ansicht für den Beamer (Teens) ===
const A = window.App;
if(!A.isBeamer){ console.log("beamer.js: nicht im Beamer-Modus, skip"); }

// URL, auf die der QR-Code zeigt (am besten eure öffentliche App-URL eintragen)
const GAME_URL = location.origin + location.pathname;
let beamerTimerInterval = null;

if(A.isBeamer){
  A.listeners.onBeamerUpdate = render;
  injectQrOverlay();
  render();
}

// Während einer laufenden Frage: QR oben rechts (nicht unten – damit Personen
// auf der Bühne ihn nicht verdecken), gut sichtbar.
function injectQrOverlay(){
  const overlay = document.createElement("div");
  overlay.id = "beamerQrOverlay";
  overlay.innerHTML = `
    <div style="background:#fff;padding:10px;border-radius:12px;display:inline-block;box-shadow:0 2px 16px rgba(0,0,0,.6)">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&qzone=1&data=${encodeURIComponent(GAME_URL)}" width="200" height="200" alt="QR">
    </div>
    <div style="font-size:1rem;font-weight:bold;color:var(--gold);margin-top:6px;text-align:center">
      📲 Scan & mach mit
    </div>`;
  Object.assign(overlay.style, {
    position: "fixed", top: "24px", right: "28px", zIndex: "999",
    textAlign: "center", pointerEvents: "none"
  });
  document.body.appendChild(overlay);
}

function startBeamerTimer(){
  if(beamerTimerInterval) clearInterval(beamerTimerInterval);
  beamerTimerInterval = setInterval(render, 300);
}
function stopBeamerTimer(){
  if(beamerTimerInterval){ clearInterval(beamerTimerInterval); beamerTimerInterval = null; }
}

function render(){
  const view = document.getElementById("beamerView");
  if(!view) return;
  const g = A.state.game, q = A.state.quiz, tap = A.state.tapduel;
  const show = A.state.show;

  // Eck-QR nur während laufender Frage zeigen.
  const ov = document.getElementById("beamerQrOverlay");
  const showCornerQr = !show && !!g && g.type !== "_quizdone" && !tap;
  if(ov) ov.style.display = showCornerQr ? "" : "none";

  // Host kann jederzeit die Rangliste auf den Beamer holen (Vorrang).
  if(show === "scores"){ stopBeamerTimer(); renderScores(view); return; }

  if(tap){ renderTapDuel(view, tap); return; }
  if(!g){ stopBeamerTimer(); renderIdle(view); return; }
  if(g.type === "_quizdone"){ stopBeamerTimer(); renderQuizDone(view); return; }
  renderActiveGame(view, g, q);
}

// Kompakte Team-Übersicht (Karten) für den Beamer – kumulierte Punkte
function teamCardsBig(){
  const pts = A.teams || {};
  const maxPts = Math.max(0, ...A.allTeams().map(t=>pts[t.id]||0));
  const sorted = A.allTeams().slice().sort((a,b)=>(pts[b.id]||0)-(pts[a.id]||0));
  return `<div class="team-score-big">` + sorted.map(t=>{
    const w = pts[t.id]||0;
    const lead = w>0 && w===maxPts;
    return `<div class="tcard ${lead?'team-winning':''}" style="--tcol:${t.color}">
      <div class="label">${avatarChip(t)} ${t.name}</div>
      <div class="value" style="color:${t.color}">${w}</div>
      <div class="sublabel">Punkte</div>
    </div>`;
  }).join("") + `</div>`;
}

// kleiner runder Avatar für Beamer-Labels – nutzt das GROSSE Bild (photobeamer),
// Fallback auf photo, sonst Emoji.
function avatarChip(t){
  const url = t && (t.photobeamer || t.photo);
  if(url) return `<span class="bav" style="background-image:url('${url}')"></span>`;
  return `<span>${(t&&t.emoji)||"👤"}</span>`;
}

// Grosser Teen-Avatar für die Beamer-Chips (nutzt .tav-Sizing aus dem CSS).
function bigTeenAvatar(t){
  const url = t && (t.photobeamer || t.photo);
  if(url) return `<span class="tav" style="background-image:url('${url}')"></span>`;
  return `<span class="tav tav-ph">${(t&&t.emoji)||"👤"}</span>`;
}

// Verzögerung des Fragetexts (ms) – nur Bildfragen. Gleiche Logik wie auf dem Gerät.
function beamerQuestionDelayMs(g){
  if(!g || g.phase !== "answer") return 0;
  if(!(g.photoUrl || g.photobeamer)) return 0;
  const sec = (g.qdelay != null) ? g.qdelay : (window.TeensContent && window.TeensContent.questionDelaySec) || 0;
  return sec > 0 ? sec * 1000 : 0;
}

// Vollbild-Rangliste (Host-Button "Rangliste am Beamer") – Teams + Top-20 Einzel
function renderScores(view){
  const topPlayers = Object.entries(A.players || {})
    .sort((a,b)=>(b[1].score||0)-(a[1].score||0)).slice(0, 20);
  let html = `<h1>🏆 Rangliste</h1>`;
  html += teamCardsBig();
  if(topPlayers.length){
    const row = ([n,d], rank)=>{
      const medal = ['🥇','🥈','🥉'][rank-1] || (rank+'.');
      const displayName = d.name || n.split('_')[0];
      return `<div style="padding:9px 18px;background:rgba(255,255,255,.04);border-left:5px solid ${A.teamColor(d.team)};border-radius:8px;display:flex;justify-content:space-between;gap:14px;font-size:1.3rem">
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${medal} ${displayName} <span style="opacity:.5;font-size:.95rem">· ${A.teamName(d.team)}</span></span><strong style="color:var(--gold)">${d.score||0}</strong>
      </div>`;
    };
    const colA = topPlayers.slice(0,10).map((p,idx)=>row(p, idx+1)).join("");
    const colB = topPlayers.slice(10,20).map((p,idx)=>row(p, idx+11)).join("");
    html += `<div class="sub-big" style="margin-top:30px">🌟 Top-Stars (Einzel)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 30px;max-width:1100px;margin:10px auto 0">
        <div style="display:flex;flex-direction:column;gap:8px">${colA}</div>
        <div style="display:flex;flex-direction:column;gap:8px">${colB}</div>
      </div>`;
  }
  view.innerHTML = html;
}

function renderIdle(view){
  const c = window.TeensContent || {};
  const guestCount = Object.keys(A.players||{}).length;
  const meta = [c.eventLocation, c.eventDate].filter(Boolean).join("  ·  ");
  const steps = [
    ["📷", "QR-Code scannen"],
    ["✍️", "Name eingeben <span style='opacity:.6'>(freiwillig)</span>"],
    ["⭐", "Teen wählen<br>oder „Noch offen“"],
    ["🎬", "„Roten Teppich<br>betreten“"]
  ].map((s,i)=>`<div class="istep"><div class="istep-no">${i+1}</div><div class="istep-ic">${s[0]}</div><div class="istep-tx">${s[1]}</div></div>`).join("");
  // Im Wartezustand: GROSSER QR-Code mittig (aus 30m scannbar) + Login-Schritte.
  view.innerHTML = `
    <h1 style="margin-bottom:6px">✦ ${c.eventTitle || "Teens-Abschluss"} ✦</h1>
    <div class="sub-big">${c.subtitle || ""}</div>
    ${meta ? `<div class="sub-big" style="color:var(--gold);margin-top:4px">${meta}</div>` : ""}
    <div class="idle-wrap">
      <div>
        <div style="background:#fff;padding:20px;border-radius:22px;display:inline-block;box-shadow:0 6px 30px rgba(0,0,0,.6)">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=600x600&qzone=1&data=${encodeURIComponent(GAME_URL)}"
               style="width:min(42vh,400px);height:min(42vh,400px);display:block" alt="QR">
        </div>
        <div style="font-size:1.6rem;font-weight:bold;color:var(--gold);margin-top:10px">📲 Handy-Kamera auf den Code halten</div>
        <div style="font-size:1.05rem;opacity:.7;margin-top:6px">oder im Browser eingeben:<br><span style="font-family:monospace;color:var(--gold);font-size:1.2rem;word-break:break-all">${GAME_URL.replace(/^https?:\/\//,'').replace(/\/$/,'')}</span></div>
      </div>
      <div class="idle-steps">${steps}</div>
    </div>
    <div class="sub-big" style="margin-top:16px;opacity:.6">${guestCount} Gäste bereits verbunden</div>`;
}

function renderQuizDone(view){
  const pts = A.teams || {};
  const teamsSorted = A.allTeams().slice().sort((a,b)=>(pts[b.id]||0)-(pts[a.id]||0));
  const leader = teamsSorted[0];
  const leadPts = pts[leader?.id]||0;
  const topPlayers = Object.entries(A.players || {})
    .sort((a,b)=>(b[1].score||0)-(a[1].score||0)).slice(0, 5);

  let html = `<h1>🏁 Quiz beendet!</h1>`;
  if(leadPts > 0){
    html += `<div class="question" style="color:var(--gold)">🏆 ${leader.emoji} ${leader.name} gewinnt!</div>`;
  }
  html += teamCardsBig();
  if(topPlayers.length){
    html += `<div style="margin-top:40px;max-width:700px;margin-left:auto;margin-right:auto">
      <div class="sub-big">🏆 Top-Tipper</div>`;
    topPlayers.forEach(([n,d],i)=>{
      const medal = ['🥇','🥈','🥉'][i] || ((i+1)+'.');
      const displayName = d.name || n.split('_')[0];
      html += `<div style="padding:12px 24px;margin:8px 0;background:rgba(255,255,255,.04);border-left:5px solid ${A.teamColor(d.team)};border-radius:8px;display:flex;justify-content:space-between;font-size:1.6rem">
        <span>${medal} ${displayName}</span>&nbsp;<strong style="color:var(--gold)">${(d.score || 0).toLocaleString('de-CH')} Pkt</strong>
      </div>`;
    });
    html += `</div>`;
  }
  view.innerHTML = html;
}

function renderActiveGame(view, g, q){
  const total = Object.keys(A.players).length;
  const cnt = g.answered || 0;   // kleiner Live-Zähler (Antworten liegen in /answers)

  // Verzögerte Frage: Bildfragen zeigen das Foto sofort, den Text erst nach X Sek.
  const dMs = beamerQuestionDelayMs(g);
  const stillHidden = dMs > 0 && (Date.now() - g.startedAt) < dMs;

  // ── Foto (linke Spalte bei Bildfragen) · Beamer nutzt photobeamer ──
  const bImg = g.photobeamer || g.photoUrl;
  let photoHtml = "";
  if(bImg){
    const reveal = (window.TeensContent && window.TeensContent.photoReveal) === true;
    const maxB = (window.TeensContent && window.TeensContent.photoBlurMax) || 26;
    let blur = 0;
    if(g.phase === "answer" && reveal && g.endsAt && g.startedAt){
      const f = Math.max(0, Math.min(1, (g.endsAt - Date.now()) / (g.endsAt - g.startedAt)));
      blur = Math.round(maxB * f * 1.4);
    }
    photoHtml = `<div class="photo-box"><img src="${bImg}" style="filter:blur(${blur}px)" alt="" onerror="this.parentElement.innerHTML='<div class=&quot;ph&quot;>📷</div>'"></div>`;
  }

  // ── Infos (rechte Spalte, bzw. ganze Breite ohne Bild) ──
  let info = q
    ? `<div class="qprog">${q.setLabel} · Frage ${q.current + 1} / ${q.total}</div>`
    : `<div class="qprog">${typeLabel(g.type)}</div>`;
  if(stillHidden){
    const left = Math.ceil((dMs - (Date.now() - g.startedAt)) / 1000);
    info += `<div class="question" style="opacity:.85">🔍 Schau genau hin … <b>${left}s</b></div>`;
  } else {
    info += `<div class="question">${g.q}</div>`;
  }

  if(g.phase === "reveal"){
    stopBeamerTimer();
    renderRevealScreen(view, g);   // eigenes Layout: Rangliste | Lösung (kein Bild)
    return;
  }

  if(g.endsAt){
    const left = Math.max(0, Math.ceil((g.endsAt - Date.now()) / 1000));
    const cls = left <= 5 ? "crit" : left <= 10 ? "warn" : "";
    info += `<div class="big-timer ${cls}">${left}s</div>`;
    startBeamerTimer();
  }
  info += `<div class="big-counter">${cnt} / ${total}</div>`;
  info += `<div class="sub-big">haben geantwortet</div>`;
  if(g.type === "guess" || g.type === "poll"){
    info += `<div class="teen-row-big">` + A.teensOnly().map(t=>
      `<div class="tchip" style="--tcol:${t.color}">${bigTeenAvatar(t)}<span>${t.name}</span></div>`
    ).join("") + `</div>`;
  } else if(g.type === "trivia"){
    // Antwort-Optionen UNTEREINANDER (eine pro Zeile)
    const cols = (window.TeensContent || {}).optionColors || ["#d4af37"];
    info += `<div class="opt-col">` + (g.options || []).map((o,i)=>
      `<div class="opt-line" style="--tcol:${cols[i % cols.length]}"><span class="opt-let">${String.fromCharCode(65+i)}</span>${o}</div>`
    ).join("") + `</div>`;
  } else if(g.type === "estimate" && g.unit){
    info += `<div class="sub-big" style="margin-top:20px;opacity:.5">Tipp in ${g.unit}</div>`;
  }

  // Mit Bild → zwei Spalten (passt auf einen Screen); ohne Bild → wie bisher.
  view.innerHTML = bImg
    ? `<div class="bg2"><div class="bg2-photo">${photoHtml}</div><div class="bg2-info">${info}</div></div>`
    : info;
}

// ── AUFLÖSUNG: links Gesamt-Rangliste (mit Count-up + Rang-Verschiebung),
//    rechts die Lösung dieser Frage. Kein Bild mehr. ──────────────────────
const REVEAL_ANIM = true;   // Rang-Verschiebung an/aus (Count-up läuft immer)

function renderRevealScreen(view, g){
  const r = g.result || {};
  view.innerHTML = `<div class="bg2 rv">
    <div class="bg2-info rv-left">${revealRankingHtml(r)}</div>
    <div class="bg2-info rv-right">${revealSolutionHtml(g, r)}</div>
  </div>`;
  const left = view.querySelector(".rv-left");
  animateCountUps(view);
  if(REVEAL_ANIM && left){
    setTimeout(()=>{ if(view.querySelector(".rv-left") === left) animateRankReorder(left); }, 1500);
  }
}

// LINKS: aktuelle Gesamt-Rangliste aller Teens (kumulierte Punkte)
function revealRankingHtml(r){
  const pts = A.teams || {};
  const ra = id => (r.teamStats && r.teamStats[id] && r.teamStats[id].roundAvg) || 0;
  const newTot = id => pts[id] || 0;
  const oldTot = id => newTot(id) - ra(id);
  const teams = A.allTeams().slice();
  const byNew = teams.slice().sort((a,b)=> newTot(b.id)-newTot(a.id) || a.name.localeCompare(b.name));
  const byOld = teams.slice().sort((a,b)=> oldTot(b.id)-oldTot(a.id) || a.name.localeCompare(b.name));
  const oldRank = {}; byOld.forEach((t,i)=> oldRank[t.id] = i+1);
  const medals = ['🥇','🥈','🥉'];

  let h = `<h2 class="rv-title">🏆 Gesamt-Rangliste</h2>`;
  h += byNew.map((t,i)=>{
    const add  = ra(t.id);
    const move = oldRank[t.id] - (i+1);   // >0 = nach oben
    const arrow = move>0 ? `<span class="mv up">▲${move}</span>`
                : move<0 ? `<span class="mv dn">▼${-move}</span>` : "";
    const medal = medals[i] || `${i+1}.`;
    const addBadge = add>0 ? `<span class="rv-add">+${add}</span>` : `<span class="rv-add"></span>`;
    return `<div class="rv-row ${i===0?'lead':''}" style="--tcol:${t.color};order:${oldRank[t.id]}">
      <span class="rv-medal">${medal}</span>
      ${bigTeenAvatar(t)}
      <span class="rv-name">${t.name}${arrow}</span>
      <span class="rv-pts countup" data-from="${oldTot(t.id)}" data-to="${newTot(t.id)}">${oldTot(t.id)}</span>
      ${addBadge}
    </div>`;
  }).join("");
  return h;
}

// RECHTS: Lösung der aktuellen Frage + Hinweis zur Punktevergabe
function revealSolutionHtml(g, r){
  // Frage weiterhin zeigen, damit klar ist, wofür die Punkte vergeben wurden.
  let h = `<div class="rv-q">${g.q}</div>`;
  if(g.type === "guess" || g.type === "poll"){
    if(g.answer != null){
      const c = A.teamById(g.answer);
      const pre = g.type === "poll" ? "🔮 Mehrheit:" : "✓ Richtig:";
      h += `<div class="rv-correct" style="color:var(--green)">${pre} ${bigTeenAvatar(c)} <span>${c ? c.name : g.answer}</span></div>`;
    } else {
      h += `<div class="rv-correct" style="color:var(--orange)">Gleichstand – kein Mehrheitsvotum</div>`;
    }
    h += bigDistribution(r.breakdown || {}, g.answer);
  }
  else if(g.type === "trivia"){
    h += `<div class="rv-correct" style="color:var(--green)">✓ ${g.answer}</div>`;
    h += bigOptionDistribution(r.breakdown || {}, g.answer, g.options || []);
  }
  else if(g.type === "estimate"){
    h += `<div class="rv-correct" style="color:var(--green)">✓ ${g.answer}${g.unit?' '+g.unit:''}</div>`;
    if(r.ranking && r.ranking.length){
      h += `<div style="max-width:700px;margin:10px auto 0;text-align:left;font-size:1.4rem">`;
      r.ranking.slice(0, 5).forEach((e)=>{
        const medal = e.awardedPts===3?"🥇":e.awardedPts===2?"🥈":e.awardedPts===1?"🥉":"🔹";
        h += `<div style="padding:8px 16px;margin:6px 0;background:rgba(255,255,255,.04);border-left:4px solid ${A.teamColor(e.team)};border-radius:8px;display:flex;justify-content:space-between">
          <span>${medal} ${e.p}: ${e.v}${g.unit?' '+g.unit:''}</span><strong style="color:var(--gold)">${e.awardedPts?'+'+e.awardedPts:''}</strong></div>`;
      });
      h += `</div>`;
    }
  }
  // Punktevergabe erklären (für die meisten nicht intuitiv) – je nach Fragetyp.
  if(g.type === "poll"){
    h += `<div class="rv-hint">💡 <b>Schwarm-Frage:</b> Richtig ist, was die <b>Mehrheit</b> tippt. Punkte bekommt, <b>wer mit der Mehrheit lag</b> – nicht der genannte Teen selbst. Je schneller, desto mehr. Ein Team zählt den <b>Ø</b> seiner Tipps.</div>`;
  } else {
    h += `<div class="rv-hint">💡 <b>So gibt's Punkte:</b> Wer die <b>richtige Antwort</b> tippt, punktet – <b>je schneller, desto mehr</b>. Ein Team bekommt den <b>Durchschnitt</b> aus den Punkten seiner Mitglieder.</div>`;
  }
  return h;
}

// Zahlen von data-from nach data-to hochzählen
function animateCountUps(view){
  view.querySelectorAll(".countup").forEach(el=>{
    const from = +el.dataset.from || 0, to = +el.dataset.to || 0;
    if(from === to){ el.textContent = to; return; }
    const dur = 1300, t0 = performance.now();
    const step = (now)=>{
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(from + (to - from) * (p*(2-p)));  // easeOut
      if(p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// Rang-Verschiebung (FLIP): von alter zu neuer Reihenfolge gleiten.
// Degradiert gefahrlos – fällt nichts an, bleibt die finale Reihenfolge stehen.
function animateRankReorder(container){
  const rows = [...container.querySelectorAll(".rv-row")];
  if(rows.length < 2) return;
  const first = rows.map(r=> r.getBoundingClientRect().top);
  rows.forEach(r=>{ r.style.order = ""; });            // → natürliche (neue) Ordnung
  const last = rows.map(r=> r.getBoundingClientRect().top);
  rows.forEach((r,i)=>{
    const dy = first[i] - last[i];
    r.style.transition = "none";
    r.style.transform = dy ? `translateY(${dy}px)` : "";
  });
  void container.offsetHeight;                          // Reflow erzwingen
  requestAnimationFrame(()=>{
    rows.forEach(r=>{
      r.style.transition = "transform .9s cubic-bezier(.2,.8,.2,1)";
      r.style.transform = "";
    });
  });
}

// Gestapelter Balken über alle getippten Teens (Beamer-Grösse)
function bigDistribution(breakdown, correctId){
  const items = A.teensOnly().map(t => ({ key: t.id, label: t.name, color: t.color, c: breakdown[t.id]||0 }));
  return distributionBar(items, correctId);
}

// Gestapelter Balken über Text-Optionen (Bibel-Trivia, Beamer-Grösse)
function bigOptionDistribution(breakdown, correctVal, options){
  const cols = (window.TeensContent || {}).optionColors || ["#d4af37"];
  const items = options.map((o,i) => ({ key: o, label: o, color: cols[i % cols.length], c: breakdown[o]||0 }));
  return distributionBar(items, correctVal);
}

// Gemeinsame Verteilungs-Darstellung. Die KORREKTE Antwort wird mit einem
// klaren WEISSEN Ring + ✓ markiert (NICHT mit einer Antwort-Farbe) → keine
// Verwechslung mit benachbarten Segmenten. Robust auch bei starker Schieflage
// (z.B. 95% gleiche Antwort): schmale Segmente zeigen keine Zahl, die Legende
// listet alle Werte; die korrekte Antwort steht immer in der Legende.
function distributionBar(items, correctKey){
  const total = items.reduce((s,it)=>s+it.c,0) || 1;
  const segs = items.map(it=>{
    const pct = it.c/total*100;
    if(pct === 0) return "";
    const correct = it.key === correctKey;
    const ring = correct ? "box-shadow:inset 0 0 0 5px #fff;z-index:2" : "";
    const num = pct >= 8 ? (correct ? "✓ " + it.c : it.c) : "";
    return `<div title="${it.label}" style="position:relative;width:${pct}%;background:${it.color};color:#111;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:bold;${ring}">${num}</div>`;
  }).join("");
  const legend = items.filter(it=> it.c>0 || it.key===correctKey).map(it=>{
    const correct = it.key === correctKey;
    return `<span style="white-space:nowrap;margin:0 10px;${correct?'font-weight:800;color:#fff':''}"><span class="dot" style="background:${it.color}"></span>${correct?'✓ ':''}${it.label} (${it.c})</span>`;
  }).join("");
  return `<div style="display:flex;height:80px;max-width:1000px;margin:0 auto;border-radius:14px;overflow:hidden;background:var(--card2)">${segs}</div>
    <div style="font-size:1.3rem;opacity:.9;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:12px">${legend}</div>`;
}

function renderTapDuel(view, d){
  if(d.phase === "countdown"){
    const left = Math.max(0, Math.ceil((d.startsAt - Date.now()) / 1000));
    view.innerHTML = `<h1>⚡ Tap-Duell</h1>
      <div class="question">Bereit machen!</div>
      <div class="big-timer crit">${left}</div>
      <div class="sub-big">Welches Fan-Team tippt am schnellsten?</div>`;
    startBeamerTimer();
    return;
  }
  if(d.phase === "running"){
    const leftMs = Math.max(0, d.endsAt - Date.now());
    const leftSec = Math.ceil(leftMs / 1000);
    const cls = leftSec <= 5 ? "crit" : leftSec <= 10 ? "warn" : "";
    const ts = {};
    A.allTeams().forEach(t=>ts[t.id]={sum:0,n:0});
    for(const [p,c] of Object.entries(d.taps||{})){
      const team = (A.players[p]||{}).team;
      if(!team || !ts[team]) continue;
      ts[team].sum += c; ts[team].n++;
    }
    view.innerHTML = `<h1>⚡ TAP-DUELL</h1>
      <div class="big-timer ${cls}">${leftSec}s</div>
      <div class="team-score-big" style="margin-top:20px">` +
      A.allTeams().map(t=>{
        const s = ts[t.id];
        const avg = s.n ? (s.sum/s.n).toFixed(1) : "0";
        return `<div class="tcard" style="--tcol:${t.color}">
          <div class="label">${t.emoji} ${t.name}</div>
          <div class="value tap-live" style="color:${t.color}">${s.sum}</div>
          <div class="sublabel">Ø ${avg} pro Person (${s.n})</div>
        </div>`;
      }).join("") + `</div>`;
    startBeamerTimer();
    return;
  }
  if(d.phase === "done"){
    stopBeamerTimer();
    const ts = d.teamStats || {};
    const winner = d.winner;
    let html = `<h1>⚡ Tap-Duell beendet!</h1>`;
    html += `<div class="team-score-big">` + A.allTeams().map(t=>{
      const s = ts[t.id] || {};
      const win = winner === t.id;
      return `<div class="tcard ${win?'team-winning':''}" style="--tcol:${t.color}">
        <div class="label">${t.emoji} ${t.name}</div>
        <div class="value" style="color:${t.color}">${(s.avg||0).toFixed(1)}</div>
        <div class="sublabel">Ø pro Person</div>
      </div>`;
    }).join("") + `</div>`;
    if(winner){
      const t = A.teamById(winner) || {};
      html += `<div class="question" style="color:var(--gold);margin-top:30px">🏆 +1 Runde: ${t.emoji||''} ${t.name||winner}</div>`;
    } else {
      html += `<div class="sub-big" style="margin-top:30px">Unentschieden</div>`;
    }
    view.innerHTML = html;
  }
}

function typeLabel(t){
  return { guess:"Welcher Teen ist das?", trivia:"Bibel-Figuren raten",
           poll:"Schwarm-Frage – was denkt der Saal?", estimate:"Schätzfrage" }[t] || "";
}

console.log("✅ beamer.js loaded (Teens)");
