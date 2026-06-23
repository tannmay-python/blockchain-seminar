/* app.js — boots engine + visualization + narration, runs the hero, wires controls. */
(function () {
  "use strict";
  const C = window.CHAIN, V = window.VIZ, G = window.GUIDE;
  const $ = (s) => document.querySelector(s);

  /* ---- cinematic hero: a constellation drawing itself ---- */
  function hero() {
    const cv = $("#heroCanvas"); if (!cv) return;
    const ctx = cv.getContext("2d"); let W, H, dpr, raf, nodes = [], t0 = performance.now(), alive = true;
    function size() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); build(); }
    function build() {
      nodes = []; const N = 46;
      for (let i = 0; i < N; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.8 + .8 });
    }
    function frame(now) {
      if (!alive) return;
      ctx.clearRect(0, 0, W, H);
      nodes.forEach(n => { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1; });
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 170) { ctx.strokeStyle = `rgba(139,124,255,${(1 - d / 170) * 0.18})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      nodes.forEach(n => { ctx.fillStyle = "rgba(180,175,255,0.55)"; ctx.shadowBlur = 8; ctx.shadowColor = "rgba(139,124,255,0.6)"; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill(); ctx.shadowBlur = 0; });
      raf = requestAnimationFrame(frame);
    }
    size(); window.addEventListener("resize", size); frame();
    return () => { alive = false; cancelAnimationFrame(raf); };
  }

  function boot() {
    C.init(); V.init(); G.init();
    const stopHero = hero();

    const playBtn = $("#ctrlPlay");
    const sync = () => { playBtn.textContent = C.state.running ? "⏸" : "▶"; playBtn.classList.toggle("on", C.state.running); };
    playBtn.onclick = () => C.state.running ? C.pause() : C.play();
    C.on("running", sync); sync();
    $("#ctrlStep").onclick = () => { if (C.state.running) C.pause(); C.stepBlock(); };
    document.querySelectorAll("#speedSeg button").forEach(b => b.onclick = () => { document.querySelectorAll("#speedSeg button").forEach(x => x.classList.remove("on")); b.classList.add("on"); C.setSpeed(+b.dataset.s); });

    $("#heroStart").onclick = () => { $("#hero").classList.add("gone"); if (!C.state.running) C.play(); setTimeout(() => { $("#hero").style.display = "none"; if (stopHero) stopHero(); }, 850); };

    // presentation mode (larger text) + fullscreen — for projecting in a room
    const togglePresent = () => { const on = $("#app").classList.toggle("present"); $("#ctrlPresent").classList.toggle("on", on); };
    $("#ctrlPresent").onclick = togglePresent;
    const toggleFull = () => { if (!document.fullscreenElement) (document.documentElement.requestFullscreen && document.documentElement.requestFullscreen()); else document.exitFullscreen && document.exitFullscreen(); };
    $("#ctrlFull").onclick = toggleFull;

    // keyboard: drive the talk like slides
    window.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
      if (e.key === " ") { e.preventDefault(); C.state.running ? C.pause() : C.play(); }
      else if (e.key === "Escape") V.closeInspector();
      else if (e.key === "ArrowRight" || e.key === "PageDown") { $("#gNext").click(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { $("#gPrev").click(); }
      else if (e.key >= "1" && e.key <= "8") { G.go(+e.key - 1); }
      else if (e.key.toLowerCase() === "p") { togglePresent(); }
      else if (e.key.toLowerCase() === "f") { toggleFull(); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
