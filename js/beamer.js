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

// kleiner runder Avatar (Foto/Emoji) für Beamer-Labels
function avatarChip(t){
  if(t && t.photo) return `<span class="bav" style="background-image:url('${t.photo}')"></span>`;
  return `<span>${(t&&t.emoji)||"👤"}</span>`;
}

// Vollbild-Rangliste (Host-Button "Rangliste am Beamer")
function renderScores(view){
  const pts = A.teams || {};
  const topPlayers = Object.entries(A.players || {})
    .sort((a,b)=>(b[1].score||0)-(a[1].score||0)).slice(0, 8);
  let html = `<h1>🏆 Rangliste</h1>`;
  html += teamCardsBig();
  if(topPlayers.length){
    html += `<div style="margin-top:40px;max-width:760px;margin-left:auto;margin-right:auto">
      <div class="sub-big">🌟 Top-Stars (Einzel)</div>`;
    topPlayers.forEach(([n,d],i)=>{
      const medal = ['🥇','🥈','🥉'][i] || ((i+1)+'.');
      const displayName = d.name || n.split('_')[0];
      html += `<div style="padding:12px 24px;margin:8px 0;background:rgba(255,255,255,.04);border-left:5px solid ${A.teamColor(d.team)};border-radius:8px;display:flex;justify-content:space-between;font-size:1.6rem">
        <span>${medal} ${displayName} <span style="opacity:.5;font-size:1.1rem">· ${A.teamName(d.team)}</span></span><strong style="color:var(--gold)">${d.score||0} Pkt</strong>
      </div>`;
    });
    html += `</div>`;
  }
  view.innerHTML = html;
}

function renderIdle(view){
  const c = window.TeensContent || {};
  const guestCount = Object.keys(A.players||{}).length;
  const meta = [c.eventLocation, c.eventDate].filter(Boolean).join("  ·  ");
  // Im Wartezustand: GROSSER QR-Code mittig – aus 30m gut scannbar.
  view.innerHTML = `
    <h1>✦ ${c.eventTitle || "Teens-Abschluss"} ✦</h1>
    <div class="sub-big">${c.subtitle || ""}</div>
    ${meta ? `<div class="sub-big" style="color:var(--gold);margin-top:6px">${meta}</div>` : ""}
    <div style="background:#fff;padding:24px;border-radius:24px;display:inline-block;margin:34px auto 14px;box-shadow:0 6px 30px rgba(0,0,0,.6)">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=600x600&qzone=1&data=${encodeURIComponent(GAME_URL)}"
           style="width:min(46vh,440px);height:min(46vh,440px);display:block" alt="QR">
    </div>
    <div style="font-size:2rem;font-weight:bold;color:var(--gold)">📲 QR scannen & mitmachen</div>
    <div class="sub-big" style="margin-top:18px;opacity:.6">${guestCount} Gäste bereits verbunden</div>`;
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

  let html = "";
  if(q){
    html += `<div class="qprog">${q.setLabel} · Frage ${q.current + 1} / ${q.total}</div>`;
  } else {
    html += `<div class="qprog">${typeLabel(g.type)}</div>`;
  }
  html += `<div class="question">${g.q}</div>`;

  if(g.photoUrl){
    // Progressive Freigabe: im Antwort-Modus startet das Bild unscharf.
    const reveal = (window.TeensContent && window.TeensContent.photoReveal) !== false;
    const maxB = (window.TeensContent && window.TeensContent.photoBlurMax) || 26;
    let blur = 0;
    if(g.phase === "answer" && reveal && g.endsAt && g.startedAt){
      const f = Math.max(0, Math.min(1, (g.endsAt - Date.now()) / (g.endsAt - g.startedAt)));
      blur = Math.round(maxB * f * 1.4);   // auf der grossen Leinwand etwas stärker
    }
    html += `<div class="photo-box" style="margin:20px auto;max-width:500px;aspect-ratio:1"><img src="${g.photoUrl}" style="filter:blur(${blur}px)" alt=""></div>`;
  }

  if(g.phase === "answer"){
    if(g.endsAt){
      const left = Math.max(0, Math.ceil((g.endsAt - Date.now()) / 1000));
      const cls = left <= 5 ? "crit" : left <= 10 ? "warn" : "";
      html += `<div class="big-timer ${cls}">${left}s</div>`;
      startBeamerTimer();
    }
    html += `<div class="big-counter">${cnt} / ${total}</div>`;
    html += `<div class="sub-big">haben geantwortet</div>`;
    if(g.type === "guess" || g.type === "poll"){
      // Die wählbaren Teens als Hinweis gross zeigen (mit Foto)
      html += `<div class="teen-row-big">` + A.teensOnly().map(t=>
        `<div class="tchip" style="--tcol:${t.color}">${A.avatarHtml(t)}<span>${t.name}</span></div>`
      ).join("") + `</div>`;
    } else if(g.type === "trivia"){
      const cols = (window.TeensContent || {}).optionColors || ["#d4af37"];
      html += `<div class="teen-row-big">` + (g.options || []).map((o,i)=>
        `<div class="tchip" style="--tcol:${cols[i % cols.length]}"><span>${String.fromCharCode(65+i)}. ${o}</span></div>`
      ).join("") + `</div>`;
    } else if(g.type === "estimate" && g.unit){
      html += `<div class="sub-big" style="margin-top:20px;opacity:.5">Tipp in ${g.unit}</div>`;
    }
  }
  else if(g.phase === "reveal"){
    stopBeamerTimer();
    html += renderRevealBeamer(g);
  }

  view.innerHTML = html;
}

function renderRevealBeamer(g){
  const r = g.result || {};
  let html = "";

  if(g.type === "guess" || g.type === "poll"){
    const correct = A.teamById(g.answer) || {};
    if(g.answer != null){
      const pre = g.type === "poll" ? "🔮 Mehrheit:" : "✓";
      html += `<div class="question" style="color:var(--green);font-size:3.5rem">${pre} ${correct.emoji||''} ${correct.name||g.answer}</div>`;
    } else {
      html += `<div class="question" style="color:var(--orange);font-size:3rem">Gleichstand – kein Mehrheitsvotum</div>`;
    }
    html += bigDistribution(r.breakdown || {}, g.answer);
    html += teamResultsBig(r);
  }
  else if(g.type === "trivia"){
    html += `<div class="question" style="color:var(--green);font-size:3.5rem">✓ ${g.answer}</div>`;
    html += bigOptionDistribution(r.breakdown || {}, g.answer, g.options || []);
    html += teamResultsBig(r);
  }
  else if(g.type === "estimate"){
    html += `<div class="question" style="color:var(--green);font-size:3.5rem">✓ ${g.answer}${g.unit?' '+g.unit:''}</div>`;
    if(r.ranking && r.ranking.length){
      html += `<div style="max-width:700px;margin:0 auto;text-align:left;font-size:1.5rem">`;
      r.ranking.slice(0, 5).forEach((e) => {
        let medal = "🔹";
        if (e.awardedPts === 3) medal = "🥇";
        if (e.awardedPts === 2) medal = "🥈";
        if (e.awardedPts === 1) medal = "🥉";
        const ptsStr = e.awardedPts ? `+${e.awardedPts}` : '';
        html += `<div style="padding:10px 20px;margin:8px 0;background:rgba(255,255,255,.04);border-left:4px solid ${A.teamColor(e.team)};border-radius:8px;display:flex;justify-content:space-between">
          <span>${medal} ${e.p}: ${e.v}${g.unit?' '+g.unit:''}</span>
          <strong style="color:var(--gold)">${ptsStr}</strong>
        </div>`;
      });
      html += `</div>`;
    }
  }

  if(r.roundBest && g.type !== "estimate"){
    const t = A.teamById(r.roundBest) || {};
    const avg = r.teamStats?.[r.roundBest]?.roundAvg;
    html += `<div class="question" style="color:var(--gold);margin-top:24px">🏆 Beste Runde: ${t.emoji||''} ${t.name||r.roundBest} · Ø ${avg} Pkt</div>`;
  }
  return html;
}

// Team-Auflösung gross: pro Team Foto + Name + Treffer + Ø-Punkte.
// Farblich ENTKOPPELT von den Antwort-Optionen → keine falsche Verbindung.
function teamResultsBig(r){
  if(!r.teamStats) return "";
  const rows = A.allTeams().slice()
    .filter(t => r.teamStats[t.id] && r.teamStats[t.id].answered > 0)
    .sort((a,b)=>(r.teamStats[b.id].roundAvg||0)-(r.teamStats[a.id].roundAvg||0));
  if(!rows.length) return "";
  let h = `<div style="max-width:900px;margin:26px auto 0;display:flex;flex-direction:column;gap:10px">`;
  h += rows.map(t=>{
    const ts = r.teamStats[t.id];
    const best = r.roundBest === t.id;
    const bg = best ? "rgba(212,175,55,.18)" : "rgba(255,255,255,.04)";
    const bd = best ? "var(--gold)" : t.color;
    return `<div style="display:flex;align-items:center;gap:18px;padding:12px 22px;border-radius:14px;background:${bg};border-left:8px solid ${bd};font-size:1.7rem">
      <span style="display:flex;align-items:center;gap:12px;flex:1;text-align:left">${avatarChip(t)} <b>${t.name}</b></span>
      <span style="opacity:.8;font-size:1.4rem">${ts.correct}/${ts.answered} · ${(ts.rate*100).toFixed(0)}%</span>
      <strong style="color:var(--gold);min-width:160px;text-align:right">Ø ${ts.roundAvg} Pkt</strong>
    </div>`;
  }).join("");
  h += `</div>`;
  return h;
}

// Gestapelter Balken über alle getippten Teens (Beamer-Grösse)
function bigDistribution(breakdown, correctId){
  const teens = A.teensOnly();
  const total = teens.reduce((s,t)=>s+(breakdown[t.id]||0),0) || 1;
  const segs = teens.map(t=>{
    const c = breakdown[t.id]||0;
    const pct = c/total*100;
    if(pct===0) return "";
    const ring = t.id === correctId ? "box-shadow:inset 0 0 0 6px var(--gold)" : "";
    return `<div style="width:${pct}%;background:${t.color};color:#111;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:bold;${ring}">${c>0?c:''}</div>`;
  }).join("");
  const legend = teens.filter(t=>breakdown[t.id]).map(t=>
    `<span style="white-space:nowrap;margin:0 10px"><span class="dot" style="background:${t.color}"></span>${t.name} (${breakdown[t.id]||0})</span>`
  ).join("");
  return `<div style="display:flex;height:80px;max-width:1000px;margin:30px auto;border-radius:14px;overflow:hidden">${segs}</div>
    <div style="font-size:1.3rem;opacity:.85;display:flex;flex-wrap:wrap;justify-content:center;gap:6px">${legend}</div>`;
}

// Gestapelter Balken über Text-Optionen (Bibel-Trivia, Beamer-Grösse)
function bigOptionDistribution(breakdown, correctVal, options){
  const cols = (window.TeensContent || {}).optionColors || ["#d4af37"];
  const total = options.reduce((s,o)=>s+(breakdown[o]||0),0) || 1;
  const segs = options.map((o,i)=>{
    const c = breakdown[o]||0;
    const pct = c/total*100;
    if(pct===0) return "";
    const col = cols[i % cols.length];
    const ring = o === correctVal ? "box-shadow:inset 0 0 0 6px var(--gold)" : "";
    return `<div style="width:${pct}%;background:${col};color:#111;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:bold;${ring}">${c>0?c:''}</div>`;
  }).join("");
  const legend = options.filter(o=>breakdown[o]).map((o)=>{
    const i = options.indexOf(o); const col = cols[i % cols.length];
    return `<span style="white-space:nowrap;margin:0 10px"><span class="dot" style="background:${col}"></span>${o} (${breakdown[o]||0})</span>`;
  }).join("");
  return `<div style="display:flex;height:80px;max-width:1000px;margin:30px auto;border-radius:14px;overflow:hidden">${segs}</div>
    <div style="font-size:1.3rem;opacity:.85;display:flex;flex-wrap:wrap;justify-content:center;gap:6px">${legend}</div>`;
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
