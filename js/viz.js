/* ============================================================
   viz.js — renders the living blockchain.
   • A canvas "constellation" of network nodes: ambient transaction
     light, and a propagation wave each time a block is mined.
   • The chain ribbon (premium DOM blocks), mempool, mining spotlight.
   • The block inspector.
   ============================================================ */
window.VIZ = (function () {
  "use strict";
  const C = window.CHAIN;
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const $ = (s) => document.querySelector(s);
  const short = (s, a = 7, b = 5) => s && s.length > a + b + 1 ? s.slice(0, a) + "…" + s.slice(-b) : s;
  const fmt = (n) => Math.round(n).toLocaleString();
  const splitZ = (h) => { let z = 0; while (h[z] === "0") z++; return `<span class="z">${h.slice(0, z)}</span>${h.slice(z)}`; };
  const lbl = (a) => { const x = C.state.accounts[a]; return x ? x.label : C.addrShort(a); };

  let chainScroll, selHash = null, onOpenCb = null;
  const onInspect = (fn) => onOpenCb = fn;

  /* ---------------- network constellation (canvas) ---------------- */
  const NET = (function () {
    let cv, ctx, W, H, dpr, nodes = [], edges = [], parts = [], waves = [], raf = 0, minerNode = {};
    const COLS = { relay: "rgba(150,160,200,", miner: null };
    function size() {
      const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout();
    }
    function layout() {
      const N = 20; nodes = [];
      // pleasant pseudo-random spread, seeded for stability
      let s = 1234567;
      const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
      for (let i = 0; i < N; i++) {
        const x = 70 + rnd() * (W - 140), y = 70 + rnd() * (H - 200);
        nodes.push({ x, y, bx: x, by: y, ph: rnd() * 6.28, r: 2.6 + rnd() * 2.2, col: null, miner: -1, glow: 0 });
      }
      // assign miners to spread-out nodes
      minerNode = {};
      C.state.miners.forEach((m, i) => { const idx = (i * 4 + 2) % N; nodes[idx].miner = m.id; nodes[idx].col = m.color; nodes[idx].r = 4.4; minerNode[m.id] = idx; });
      // edges: connect each node to its 2 nearest
      edges = [];
      for (let i = 0; i < N; i++) {
        const d = nodes.map((n, j) => ({ j, dd: (n.x - nodes[i].x) ** 2 + (n.y - nodes[i].y) ** 2 })).filter(o => o.j !== i).sort((a, b) => a.dd - b.dd);
        for (let k = 0; k < 2; k++) { const j = d[k].j; if (!edges.find(e => (e.a === j && e.b === i))) edges.push({ a: i, b: j }); }
      }
      adj = nodes.map(() => []); edges.forEach((e, ei) => { adj[e.a].push({ n: e.b, e: ei }); adj[e.b].push({ n: e.a, e: ei }); });
    }
    let adj = [];
    function spawnTx() { if (!edges.length) return; const e = edges[(Math.random() * edges.length) | 0]; parts.push({ e, t: 0, sp: 0.012 + Math.random() * 0.02, col: "63,224,207" }); }
    function propagate(minerId) {
      const origin = minerNode[minerId] != null ? minerNode[minerId] : 0;
      waves.push({ x: nodes[origin].x, y: nodes[origin].y, r: 0, col: nodes[origin].col || "139,124,255", a: 1 });
      nodes[origin].glow = 1;
      // BFS light edges outward
      const seen = new Set([origin]); let frontier = [origin]; let delay = 0;
      while (frontier.length) {
        const next = [];
        frontier.forEach(u => adj[u].forEach(({ n, e }) => { if (!seen.has(n)) { seen.add(n); next.push(n); setTimeout(() => { parts.push({ e, t: edges[e].a === u ? 0 : 1, sp: (edges[e].a === u ? 0.05 : -0.05), col: "139,124,255", bright: 1 }); nodes[n].glow = 0.8; }, delay); } }));
        frontier = next; delay += 120;
      }
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      const tNow = performance.now() / 1000;
      // edges
      edges.forEach(e => { const a = nodes[e.a], b = nodes[e.b]; ctx.strokeStyle = "rgba(150,160,210,0.07)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); });
      // waves
      waves = waves.filter(w => w.a > 0.02);
      waves.forEach(w => { w.r += 3.4; w.a *= 0.965; ctx.strokeStyle = `rgba(${w.col},${w.a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, 6.2832); ctx.stroke(); });
      // particles
      parts = parts.filter(p => p.t >= 0 && p.t <= 1);
      parts.forEach(p => { p.t += p.sp; const a = nodes[edges[p.e].a], b = nodes[edges[p.e].b]; const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t; const col = p.col || "63,224,207"; ctx.fillStyle = `rgba(${col},${p.bright ? 0.95 : 0.8})`; ctx.shadowBlur = p.bright ? 14 : 8; ctx.shadowColor = `rgb(${col})`; ctx.beginPath(); ctx.arc(x, y, p.bright ? 2.6 : 1.8, 0, 6.2832); ctx.fill(); ctx.shadowBlur = 0; });
      // nodes
      nodes.forEach(n => {
        n.x = n.bx + Math.sin(tNow * 0.5 + n.ph) * 5; n.y = n.by + Math.cos(tNow * 0.4 + n.ph) * 5;
        n.glow *= 0.95;
        const col = n.col || "150,160,210";
        if (n.miner >= 0 || n.glow > 0.05) { ctx.shadowBlur = 10 + n.glow * 22; ctx.shadowColor = `rgba(${hex2rgb(n.col) || "150,160,210"},${0.5 + n.glow * 0.5})`; }
        ctx.fillStyle = n.col ? `rgba(${hex2rgb(n.col)},${0.85})` : "rgba(150,160,210,0.5)";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + n.glow * 3, 0, 6.2832); ctx.fill(); ctx.shadowBlur = 0;
      });
      raf = requestAnimationFrame(frame);
    }
    function hex2rgb(hex) { if (!hex) return null; const c = hex.replace("#", ""); return `${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)}`; }
    let txTimer = 0;
    function init(canvas) {
      cv = canvas; ctx = cv.getContext("2d"); size(); window.addEventListener("resize", size);
      frame();
      txTimer = setInterval(spawnTx, 700);
      C.on("block", (b) => { const m = C.state.miners.find(x => x.addr === b.minerAddr) || C.state.miners.find(x => x.name === b.minerName); propagate(m ? m.id : 0); });
      C.on("miners", layout);
    }
    return { init, propagate };
  })();

  /* ---------------- toast ---------------- */
  function toast(msg) { let t = $("#toast"); if (!t) { t = el("div"); t.id = "toast"; document.body.appendChild(t); } t.innerHTML = `<span class="dot"></span> ${msg}`; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2800); }
  function highlight(sel) { const e = $(sel); if (!e) return; const old = e.style.boxShadow; e.style.transition = "box-shadow .3s"; e.style.boxShadow = "0 0 0 2px var(--violet), 0 0 30px rgba(139,124,255,.5)"; clearTimeout(highlight._t); highlight._t = setTimeout(() => { e.style.boxShadow = old; }, 2600); }
  function clearHighlight() {}

  /* ---------------- stats ---------------- */
  function renderStats() {
    const s = C.state, h = s.chain[s.chain.length - 1];
    $("#stHeight").textContent = "#" + fmt(h.height);
    $("#stHps").textContent = s.mode === "pos" ? "—" : fmt(s.stats.hps) + "/s";
    $("#stDiff").textContent = s.difficulty;
    $("#stTime").textContent = s.stats.avgBlockTime ? s.stats.avgBlockTime.toFixed(1) + "s" : "—";
    $("#stMem").textContent = s.mempool.length;
  }

  /* ---------------- spotlight ---------------- */
  function renderSpot(d) {
    const h = $("#spotHash"); if (!h) return;
    if (C.state.mode === "pos") { h.innerHTML = `proposer selected by stake — no hashing`; $("#spotMeta").textContent = ""; return; }
    h.innerHTML = splitZ(d.preview || "0".repeat(64)); $("#spotMeta").textContent = "nonce " + fmt(d.nonce || 0);
  }

  /* ---------------- chain ---------------- */
  function blockEl(b, isNew) {
    const w = el("div", "blk" + (isNew ? " new" : "") + (selHash === b.hash ? " sel" : ""));
    w.dataset.hash = b.hash;
    const tag = b.height === 0 ? "genesis" : (b.minerIsYou ? "you mined" : ((b._txObjs ? b._txObjs.length : 0) + " tx"));
    w.innerHTML = `
      <div class="stripe" style="background:${b.minerColor || "#3a3f55"};color:${b.minerColor || "#3a3f55"}"></div>
      <div class="bd">
        <div class="h-row"><span class="height">${b.height}</span><span class="tag ${b.minerIsYou ? "you" : ""}">${tag}</span></div>
        <div class="field"><div class="k">hash</div><div class="v hash">${short(b.hash, 11, 6)}</div></div>
        <div class="field"><div class="k">prev</div><div class="v">${short(b.prevHash, 11, 6)}</div></div>
        <div class="field"><div class="k">nonce</div><div class="v">${fmt(b.nonce)}</div></div>
        <div class="by"><span class="dot" style="background:${b.minerColor || "#3a3f55"};color:${b.minerColor || "#3a3f55"}"></span>${b.minerName || "—"}</div>
      </div>`;
    w.onclick = () => openInspector(b);
    return w;
  }
  function renderChain() { chainScroll.innerHTML = ""; C.state.chain.forEach((b, i) => { if (i) chainScroll.appendChild(el("div", "chain-link")); chainScroll.appendChild(blockEl(b, false)); }); scrollEnd(); }
  function appendBlock(b) { if (C.state.chain.length > 1) chainScroll.appendChild(el("div", "chain-link")); chainScroll.appendChild(blockEl(b, true)); while (chainScroll.children.length > 56) chainScroll.removeChild(chainScroll.firstChild); scrollEnd(); }
  function scrollEnd() { chainScroll.scrollTo({ left: chainScroll.scrollWidth, behavior: "smooth" }); }

  /* ---------------- mempool ---------------- */
  function renderMem() {
    const w = $("#mpChips"); w.innerHTML = ""; $("#mpCount").textContent = C.state.mempool.length;
    if (!C.state.mempool.length) { w.appendChild(el("div", "muted", "")).textContent = "empty — waiting for transactions"; return; }
    C.state.mempool.slice().sort((a, b) => b.fee - a.fee).forEach(tx => {
      const yours = tx.from === (C.state.you && C.state.you.address);
      w.appendChild(el("div", "txc" + (yours ? " yours" : ""), `<span class="a">${lbl(tx.from)}</span><span class="muted">→</span><span class="a">${tx.toLabel || lbl(tx.to)}</span><span class="amt">${(+tx.amount).toFixed(1)}</span><span class="fee">fee ${(+tx.fee).toFixed(1)}</span>`));
    });
  }

  /* ---------------- inspector ---------------- */
  function openInspector(b) {
    selHash = b.hash; document.querySelectorAll(".blk.sel").forEach(e => e.classList.remove("sel"));
    const node = document.querySelector(`.blk[data-hash="${b.hash}"]`); if (node) node.classList.add("sel");
    const recomputed = C.hashBlock(b);
    const txs = (b._txObjs && b._txObjs.length) ? b._txObjs : (b.txs || []).map(t => ({ raw: t }));
    $("#ibTitle").textContent = "Block " + b.height;
    $("#ib").innerHTML = `
      <div class="is"><div class="sl">Header — the fields that get hashed</div>
        <div class="kvs">
          <div class="kv"><span class="k">height</span><span class="v">${b.height}</span></div>
          <div class="kv"><span class="k">time</span><span class="v">${new Date(b.timestamp).toLocaleTimeString()}</span></div>
          <div class="kv"><span class="k">difficulty</span><span class="v">${b.difficulty} zeros</span></div>
          <div class="kv"><span class="k">nonce</span><span class="v vi">${fmt(b.nonce)}</span></div>
          <div class="kv"><span class="k">miner</span><span class="v">${b.minerName || "—"}</span></div>
        </div></div>
      <div class="is"><div class="sl">Previous block hash — the chain link</div><div class="fbox">${b.prevHash}</div></div>
      <div class="is"><div class="sl">Merkle root — one hash over all ${txs.length} transaction(s)</div>
        <div class="fbox" id="ibMerkle">${b.merkleRoot}</div>
        <button class="btn" id="ibVM" style="margin-top:9px;font-size:12.5px">Recompute from transactions</button>
        <div class="note" id="ibVMm" style="margin-top:7px"></div></div>
      <div class="is"><div class="sl">This block's hash — must begin with ${b.difficulty} zeros</div>
        <div class="fbox hash">${splitZ(b.hash)}</div>
        <button class="btn" id="ibRH" style="margin-top:9px;font-size:12.5px">Re-hash the header and verify</button>
        <div class="note" id="ibRHm" style="margin-top:7px"></div></div>
      <div class="is"><div class="sl">Transactions (${txs.length})</div>${txs.length ? txs.map(inspTx).join("") : '<div class="muted" style="font-size:13px">No transactions.</div>'}</div>`;
    $("#inspector").classList.add("open");
    if (onOpenCb) onOpenCb(b);
    $("#ibVM") && ($("#ibVM").onclick = () => { const r = C.merkleRoot((b.txs && b.txs.length) ? b.txs : ["empty"]); $("#ibVMm").innerHTML = r === b.merkleRoot ? `<span class="note ok">Matches. The transactions are intact.</span>` : `<span class="note bad">Mismatch — the transaction set was altered.</span>`; });
    $("#ibRH") && ($("#ibRH").onclick = () => { const ok = recomputed === b.hash && recomputed.startsWith("0".repeat(b.difficulty)); $("#ibRHm").innerHTML = ok ? `<span class="note ok">Verified. Hash matches and meets difficulty — a valid block.</span>` : `<span class="note bad">Invalid.</span>`; });
  }
  function inspTx(tx) {
    if (tx.raw) return `<div class="itx"><span class="m">${tx.raw}</span></div>`;
    const yours = tx.from === (C.state.you && C.state.you.address);
    return `<div class="itx" style="${yours ? "border-color:var(--violet)" : ""}"><div class="r1"><b>${lbl(tx.from)} → ${tx.toLabel || lbl(tx.to)}</b><span>${(+tx.amount).toFixed(2)} <span class="muted">+${(+tx.fee).toFixed(2)} fee</span></span></div><div class="m">tx ${short(tx.hash, 10, 6)} · nonce ${tx.nonce} ${tx.sig ? "· sig " + short(tx.sig, 8, 4) : "· simulated"}${yours ? " · YOURS" : ""}</div></div>`;
  }
  function closeInspector() { $("#inspector").classList.remove("open"); selHash = null; document.querySelectorAll(".blk.sel").forEach(e => e.classList.remove("sel")); }

  /* ---------------- wire ---------------- */
  function init() {
    chainScroll = $("#chainScroll");
    NET.init($("#netCanvas"));
    renderChain(); renderMem(); renderStats(); renderSpot({ preview: "0".repeat(64), nonce: 0 });
    C.on("block", (b) => { appendBlock(b); renderStats(); renderMem(); });
    C.on("mempool", () => { renderMem(); renderStats(); });
    C.on("difficulty", renderStats);
    C.on("mode", () => { renderStats(); renderSpot({}); });
    let tk = 0; C.on("tick", (d) => { renderSpot(d); if (++tk % 5 === 0) renderStats(); });
    C.on("reorg", renderChain);
    $("#ibClose").onclick = closeInspector;
  }
  return { init, openInspector, closeInspector, onInspect, highlight, clearHighlight, toast, renderMem, scrollEnd, NET };
})();
