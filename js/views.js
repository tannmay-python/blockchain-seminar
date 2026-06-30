/* ============================================================
   views.js — Home, the Journey map, and Lesson explorables.
   No points, no levels — just clean progress + a lot to play with.
   ============================================================ */
window.VIEWS = (function () {
  "use strict";
  const S = window.STORE, L = window.LESSONS;
  const root = () => document.getElementById("root");
  const go = (h) => { location.hash = h; };
  const LOGO = `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.6" stroke="#fff" stroke-width="1.7"/><rect x="14" y="14" width="7" height="7" rx="1.6" stroke="#fff" stroke-width="1.7"/><path d="M10 6.5h2.5A1.5 1.5 0 0 1 14 8v6" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>`;

  function progMini() {
    const d = S.totalDone(), t = S.lessonsTotal;
    return `<div class="progmini"><span>${d} / ${t}</span><div class="bar"><i style="width:${(d / t * 100).toFixed(0)}%"></i></div></div>`;
  }
  function nav(active) {
    return `<nav class="nav"><div class="brand" data-go="#/"><div class="mk">${LOGO}</div><div class="bt">Chain<span>World</span></div></div>
      <div class="links"><a data-go="#/" class="${active === "home" ? "on" : ""}">Home</a><a data-go="#/map" class="${active === "map" ? "on" : ""}">The Journey</a></div>
      <div class="right">${progMini()}</div></nav>`;
  }
  function wireGo(scope) { (scope || document).querySelectorAll("[data-go]").forEach(e => e.onclick = (ev) => { ev.preventDefault(); go(e.dataset.go); }); }

  /* ---------------- HOME ---------------- */
  function home() {
    const done = S.totalDone(), total = S.lessonsTotal, resume = done > 0 && done < total, startId = S.firstUndone();
    root().innerHTML = nav("home") + `
      <section class="hero"><canvas id="heroCanvas"></canvas><div class="hero-in">
        <div class="eyebrow">A visual companion</div>
        <h1>Blockchain<br>you can <em>see</em>.</h1>
        <p class="sub">Fourteen short, hands-on explainers across five worlds. Almost no jargon — you move things, watch what happens, and the idea clicks.</p>
        <div class="cta">
          <button class="btn primary lg" data-go="#/lesson/${startId}">${resume ? "Continue" : done === total ? "Revisit the journey" : "Start exploring"} →</button>
          <button class="btn lg ghost" data-go="#/map">See the map</button>
        </div></div><div class="scroll-hint">SCROLL</div>
      </section>
      <section class="section">
        <div class="section-h"><div class="k">The curriculum</div><h2>Five worlds, one machine</h2><p>Each world builds on the last — from why blockchain exists, to the cryptography, to consensus and the wider ecosystem.</p></div>
        <div class="worlds-grid">${S.WORLDS.map(worldCard).join("")}</div>
      </section>
      <footer>Every demo runs locally in your browser — the hashing is real SHA-256, the signatures real ECDSA.</footer>`;
    wireGo();
    root().querySelectorAll(".wcard").forEach(c => c.onclick = () => go("#/map"));
    if (window.APP) window.APP.heroCanvas();
  }
  function worldCard(w) {
    const d = S.worldDone(w), t = w.lessons.length, pct = d / t * 100, complete = d === t;
    return `<div class="wcard"><div class="orb" style="background:${w.color}"></div>
      ${complete ? `<div class="wdone" style="background:${w.color}22;color:${w.color}">✓</div>` : ""}
      <div class="wnum" style="color:${w.color}">WORLD ${w.n}</div><h3>${w.title}</h3><div class="wsub">${w.sub}</div>
      <div class="wmeta"><div class="wbar"><i style="width:${pct}%;background:${w.color}"></i></div><span>${d}/${t}</span></div></div>`;
  }

  /* ---------------- MAP ---------------- */
  function map() {
    root().innerHTML = nav("map") + `
      <div class="map-wrap"><div class="map-head"><h1>The Journey</h1><p>Pick any stop. The path runs simple to deep — but you can wander.</p></div>
      ${S.WORLDS.map(mapWorld).join("")}</div>
      <footer>${S.totalDone()} of ${S.lessonsTotal} explored</footer>`;
    wireGo();
    root().querySelectorAll(".lnode").forEach(n => n.onclick = () => go("#/lesson/" + n.dataset.id));
  }
  function mapWorld(w) {
    const cur = S.firstUndone();
    const nodes = w.lessons.map(id => {
      const l = L[id], done = S.isDone(id), isCur = id === cur && !done;
      return `<div class="lnode ${done ? "done" : ""} ${isCur ? "cur" : ""}" data-id="${id}">
        ${done ? '<div class="check">✓</div>' : ""}
        <div class="ic" style="background:${w.color}1c;color:${w.color}">${l.icon}</div>
        <div class="lt">${l.title}</div><div class="lo">${l.oneliner}</div>
        ${isCur ? '<div class="lx" style="color:' + w.color + '">start here</div>' : ""}</div>`;
    }).join("");
    return `<div class="world-block"><div class="world-rail"><span class="wdot" style="background:${w.color}"></span><span class="wt">${w.title}</span><span class="ws">${w.sub}</span><span class="wprog">${S.worldDone(w)}/${w.lessons.length}</span></div><div class="nodes">${nodes}</div></div>`;
  }

  /* ---------------- LESSON (vertical explorable) ---------------- */
  function lesson(id) {
    const l = L[id]; if (!l) { go("#/map"); return; }
    const w = S.worldOf[id], gpos = S.ORDER.indexOf(id), prev = S.prevOf(id), next = S.nextOf(id);
    root().innerHTML = `
      <div class="lesson-bar">
        <a class="back" data-go="#/map">← Map</a>
        <span class="wchip" style="background:${w.color}1c;color:${w.color}">${w.title}</span>
        <span class="lttl">${l.title}</span>
        <span class="nums">${gpos + 1} / ${S.lessonsTotal}</span>
        <div class="barnav"><button class="lbtn" id="lPrev" ${prev ? "" : "disabled"}>←</button><button class="lbtn next" id="lNext">${next ? "Next →" : "Done"}</button></div>
      </div>
      <div class="explorable">
        <div class="lesson-hero"><div class="icbig" style="background:${w.color}1c;color:${w.color}">${l.icon}</div><h1>${l.title}</h1><p>${l.hero}</p></div>
        <div id="beats"></div>
        ${l.deeper ? `<details class="deeper"><summary>Go deeper — the technical detail</summary><div class="dbody">${l.deeper}</div></details>` : ""}
        <div class="lesson-end">
          <div class="done-tog ${S.isDone(id) ? "on" : ""}" id="doneTog"><span class="box">${S.isDone(id) ? "✓" : ""}</span> ${S.isDone(id) ? "Marked as explored" : "Mark as explored"}</div>
          <div class="btn-row" style="justify-content:center">${prev ? `<button class="btn ghost" data-go="#/lesson/${prev}">← ${L[prev].title}</button>` : ""}${next ? `<button class="btn primary" data-go="#/lesson/${next}">${L[next].title} →</button>` : `<button class="btn primary" data-go="#/map">Back to the map</button>`}</div>
        </div>
      </div>`;
    wireGo();
    // build beats
    const beatsEl = document.getElementById("beats");
    l.beats.forEach((b, i) => {
      const beat = document.createElement("div"); beat.className = "beat reveal";
      beat.innerHTML = `<div class="beat-cap"><span class="bn">BEAT ${b.n || String(i + 1).padStart(2, "0")}</span><h3>${b.h}</h3><p>${b.cap}</p></div><div class="beat-viz"></div>`;
      beatsEl.appendChild(beat);
      try { b.build(beat.querySelector(".beat-viz")); } catch (e) { console.error("beat", id, i, e); beat.querySelector(".beat-viz").innerHTML = `<div class="sig-state bad">This demo hit an error: ${e.message}</div>`; }
    });
    // reveal on scroll
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    root().querySelectorAll(".reveal").forEach(r => io.observe(r));
    // mark done + nav
    const markDone = () => { if (!S.isDone(id)) { S.setDone(id, true); refreshDoneUI(true); } };
    function refreshDoneUI(on) { const t = document.getElementById("doneTog"); t.className = "done-tog" + (on ? " on" : ""); t.querySelector(".box").textContent = on ? "✓" : ""; t.childNodes[1].textContent = on ? " Marked as explored" : " Mark as explored"; document.querySelectorAll(".progmini").forEach(p => { p.outerHTML = progMini(); }); }
    document.getElementById("doneTog").onclick = () => { const nowOn = !S.isDone(id); S.setDone(id, nowOn); refreshDoneUI(nowOn); };
    document.getElementById("lPrev").onclick = () => prev && go("#/lesson/" + prev);
    document.getElementById("lNext").onclick = () => { markDone(); next ? go("#/lesson/" + next) : go("#/map"); };
  }

  return { home, map, lesson };
})();
