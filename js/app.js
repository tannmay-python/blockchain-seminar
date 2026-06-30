/* ============================================================
   app.js — router + ambient canvas backdrops (light theme).
   ============================================================ */
window.APP = (function () {
  "use strict";
  const V = window.VIEWS;

  const RM = matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function route() {
    const h = location.hash || "#/";
    const m = h.match(/^#\/lesson\/(.+)$/);
    window.scrollTo(0, 0);
    if (m) { V.lesson(m[1]); const L = window.LESSONS[m[1]]; document.title = (L ? L.title : "Lesson") + " · ChainWorld"; }
    else if (h === "#/map") { V.map(); document.title = "The Journey · ChainWorld"; }
    else { V.home(); document.title = "ChainWorld — learn blockchain by doing"; }
  }

  /* ambient drifting dots — subtle on a light page */
  function starfield() {
    const cv = document.getElementById("starfield"); if (!cv) return;
    const ctx = cv.getContext("2d"); let W, H, dpr, dots = [];
    const cols = ["98,13,60", "241,162,34"];
    function size() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); dots = []; const n = Math.min(90, Math.round(W * H / 18000)); for (let i = 0; i < n; i++) dots.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .4, a: Math.random(), tw: Math.random() * .015 + .003, vy: Math.random() * .1 + .02, c: cols[(Math.random() * cols.length) | 0] }); }
    function frame() { ctx.clearRect(0, 0, W, H); dots.forEach(s => { s.a += s.tw; const al = .08 + Math.abs(Math.sin(s.a)) * .22; s.y += s.vy; if (s.y > H) s.y = 0; ctx.fillStyle = `rgba(${s.c},${al})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill(); }); if (!RM) requestAnimationFrame(frame); }
    size(); addEventListener("resize", size); frame();
  }

  /* hero constellation (plum + marigold on light) */
  function heroCanvas() {
    const cv = document.getElementById("heroCanvas"); if (!cv) return;
    const ctx = cv.getContext("2d"); let W, H, dpr, nodes = [];
    function dims() { const h = cv.closest(".hero"); return h ? [h.clientWidth || innerWidth, h.clientHeight || innerHeight] : [innerWidth, innerHeight]; }
    function size(reseed) {
      [W, H] = dims(); dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reseed || !nodes.length) { const n = Math.round(W * H / 26000); nodes = []; for (let i = 0; i < n; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, r: Math.random() * 2 + 1 }); }
    }
    function frame() { if (!document.getElementById("heroCanvas")) return; ctx.clearRect(0, 0, W, H); nodes.forEach(n => { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1; });
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 160) { ctx.strokeStyle = `rgba(98,13,60,${(1 - d / 160) * 0.13})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
      nodes.forEach((n, i) => { ctx.fillStyle = i % 3 === 0 ? "rgba(241,162,34,0.5)" : "rgba(98,13,60,0.32)"; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill(); });
      if (!RM) requestAnimationFrame(frame); }
    size(true); requestAnimationFrame(() => size(true)); setTimeout(() => size(true), 120);
    addEventListener("resize", () => { if (document.getElementById("heroCanvas")) size(true); }); frame();
  }

  function boot() {
    starfield(); addEventListener("hashchange", route); route();
    // keyboard: ← / → move between lessons
    addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
      if (!location.hash.startsWith("#/lesson/")) return;
      if (e.key === "ArrowRight") { const b = document.getElementById("lNext"); if (b) b.click(); }
      else if (e.key === "ArrowLeft") { const b = document.getElementById("lPrev"); if (b && !b.disabled) b.click(); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  return { heroCanvas };
})();
