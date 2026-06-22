/* main.js — scroll progress, dot nav, reveal animations, keyboard nav, counters */
(function () {
  "use strict";
  const sections = [...document.querySelectorAll("[data-dot]")];
  const dots = document.getElementById("dots");
  const progress = document.getElementById("progress");

  // Build dot nav
  sections.forEach((s, i) => {
    if (!s.id) s.id = "sec-" + i;
    const a = document.createElement("a");
    a.href = "#" + s.id;
    a.dataset.label = s.dataset.dot;
    dots.appendChild(a);
  });
  const dotLinks = [...dots.children];

  // Scroll progress + active dot
  function onScroll() {
    const h = document.documentElement;
    const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
    progress.style.width = (scrolled * 100) + "%";
    let active = 0;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < window.innerHeight * 0.4) active = i; });
    dotLinks.forEach((d, i) => d.classList.toggle("active", i === active));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((r) => io.observe(r));

  // Trigger one-shot demos when they scroll into view
  const lazy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      if (id === "tpsDemo" && window.__initTPS) window.__initTPS();
      if (id === "rwaCounter") countUp(e.target, 2.5, "$", "B", 1600);
      if (id === "rwa2030") countUp(e.target, 16, "$", "T", 1600);
      lazy.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  ["tpsDemo", "rwaCounter", "rwa2030"].forEach((id) => { const elx = document.getElementById(id); if (elx) lazy.observe(elx); });

  function countUp(node, target, prefix, suffix, dur) {
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = (target * eased);
      node.textContent = prefix + (target % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Keyboard navigation between sections
  let curIdx = 0;
  window.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      curIdx = Math.min(sections.length - 1, getActive() + 1); sections[curIdx].scrollIntoView({ behavior: "smooth" }); e.preventDefault();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      curIdx = Math.max(0, getActive() - 1); sections[curIdx].scrollIntoView({ behavior: "smooth" }); e.preventDefault();
    }
  });
  function getActive() {
    let active = 0;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < window.innerHeight * 0.4) active = i; });
    return active;
  }
})();
