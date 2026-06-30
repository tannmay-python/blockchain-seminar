/* ============================================================
   lessons.js — each lesson is a vertical "explorable": short
   captions + multiple interactive beats. Learn by playing.
   ============================================================ */
window.LESSONS = (function () {
  "use strict";
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const fmt = (n) => Math.round(n).toLocaleString();
  const short = (s, a = 8, b = 6) => s && s.length > a + b + 1 ? s.slice(0, a) + "…" + s.slice(-b) : s;
  const splitZ = (h, col = "go") => { let z = 0; while (h[z] === "0") z++; return `<span class="${col}">${h.slice(0, z)}</span>${h.slice(z)}`; };
  const bitsOf = (hex) => { let b = ""; for (const c of hex) b += parseInt(c, 16).toString(2).padStart(4, "0"); return b; };
  const subtle = window.crypto && window.crypto.subtle, hasSubtle = !!(subtle && subtle.generateKey);
  const hexOf = (buf) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  const card = (inner) => `<div class="fcard">${inner}</div>`;
  const P = (t) => `<p>${t}</p>`;

  /* shared rich block/chain renderer — beautiful, detailed, interactive */
  function richChain(host, opt) {
    const diff = opt.diff || 2, GEN = "0".repeat(12);
    const bodyOf = (b) => b.txs ? b.txs.join("|") : b.data;
    const hh = (b, prev) => sha256(bodyOf(b) + prev + b.nonce);
    let blocks = opt.blocks.map(b => ({ data: b.data, txs: b.txs ? b.txs.slice() : null }));
    let prev = GEN; blocks.forEach(b => { b.nonce = 0; while (!hh(b, prev).startsWith("0".repeat(diff))) b.nonce++; b.prev = prev; b.hash = hh(b, prev); prev = b.hash; });
    const wrap = el("div", ""); wrap.innerHTML = `<div class="xchain" id="xc"></div>${opt.trace ? `<div class="linkmsg" id="lm">👆 Click any block to see how it locks onto the one before it.</div>` : ""}`; host.appendChild(wrap);
    const valid = (i) => { const b = blocks[i], rp = i === 0 ? GEN : blocks[i - 1].hash; return b.prev === rp && hh(b, b.prev).startsWith("0".repeat(diff)) && b.hash === hh(b, b.prev); };
    function render(freshIdx) {
      const c = wrap.querySelector("#xc"); c.innerHTML = "";
      blocks.forEach((b, i) => { const ok = valid(i), cur = hh(b, b.prev);
        const node = el("div", "xblock" + (ok ? "" : " bad") + (i === freshIdx ? " fresh" : "")); node.dataset.i = i;
        const txsHtml = b.txs ? `<div class="xtxs">${b.txs.map(t => `<div class="xtx">${t}</div>`).join("")}</div>` : (opt.editable ? `<textarea class="xdata" data-i="${i}" rows="2">${(b.data || "").replace(/</g, "&lt;")}</textarea>` : `<div class="xv">${b.data || ""}</div>`);
        node.innerHTML = `<div class="xtop"></div><div class="xpad">
          <div class="xh"><span class="xn">#${i}</span><span class="xs">${ok ? "sealed" : "broken"}</span></div>
          <div class="xseg xprev"><div class="xlbl">prev block ↩</div><div class="xv">${short(b.prev, 9, 5)}</div></div>
          <div class="xseg"><div class="xlbl">${b.txs ? "transactions" : "data"}</div>${txsHtml}</div>
          <div class="xseg xnonce"><span class="xlbl" style="margin:0">nonce</span><span class="v">${fmt(b.nonce)}</span></div>
          <div class="xseal"><span class="lk">${ok ? "🔒" : "⚠️"}</span><span class="sv">${short(cur, 9, 5)}</span></div>
          ${opt.editable ? `<button class="btn" data-mine="${i}" style="margin-top:10px;font-size:11px;padding:6px 10px;width:100%">Re-mine from here</button>` : ""}</div>`;
        c.appendChild(node);
        if (i < blocks.length - 1) { const conn = el("div", "xconn" + (ok ? "" : " bad")); conn.innerHTML = `<div class="hashtag">${short(b.hash, 5, 3)}</div><div class="ln"></div>`; c.appendChild(conn); }
      });
      if (opt.editable) {
        c.querySelectorAll("textarea[data-i]").forEach(t => t.oninput = () => { const i = +t.dataset.i; blocks[i].data = t.value; blocks[i].hash = hh(blocks[i], blocks[i].prev); render(); const tt = wrap.querySelector(`textarea[data-i="${i}"]`); if (tt) tt.focus(); });
        c.querySelectorAll("button[data-mine]").forEach(btn => btn.onclick = () => { let i = +btn.dataset.mine, p = i === 0 ? GEN : blocks[i - 1].hash; for (let j = i; j < blocks.length; j++) { blocks[j].prev = p; blocks[j].nonce = 0; while (!hh(blocks[j], p).startsWith("0".repeat(diff))) blocks[j].nonce++; blocks[j].hash = hh(blocks[j], p); p = blocks[j].hash; } render(); });
      }
      if (opt.trace) {
        c.querySelectorAll(".xblock").forEach(node => node.onclick = () => {
          c.querySelectorAll(".lit").forEach(e => e.classList.remove("lit")); c.querySelectorAll(".traced").forEach(e => e.classList.remove("traced"));
          const i = +node.dataset.i, lm = wrap.querySelector("#lm");
          if (i === 0) { node.classList.add("traced"); lm.innerHTML = "This is the <b>genesis</b> block — the very first one. It has no previous block, so the chain starts here."; return; }
          const prevNode = c.querySelector(`.xblock[data-i="${i - 1}"]`);
          node.querySelector(".xprev").classList.add("lit"); node.classList.add("traced");
          prevNode.querySelector(".xseal").classList.add("lit"); prevNode.classList.add("traced");
          lm.innerHTML = `Block <b>#${i}</b>'s “prev” field is <b>exactly</b> Block <b>#${i - 1}</b>'s fingerprint (both highlighted). Copy any of those digits in your head — they match. <i>That shared value is the link.</i>`;
        });
      }
      if (freshIdx != null) c.scrollLeft = c.scrollWidth;
    }
    render();
    return {
      addBlock(data) { const p = blocks.length ? blocks[blocks.length - 1].hash : GEN; const nb = { data, nonce: 0 }; while (!hh(nb, p).startsWith("0".repeat(diff))) nb.nonce++; nb.prev = p; nb.hash = hh(nb, p); blocks.push(nb); render(blocks.length - 1); },
      mineNext(data, onDone) { // animated: scramble the seal while searching, then snap
        const p = blocks.length ? blocks[blocks.length - 1].hash : GEN; const tmp = { data, nonce: 0 };
        const c = wrap.querySelector("#xc");
        if (blocks.length) { const conn = el("div", "xconn"); conn.innerHTML = `<div class="ln"></div>`; c.appendChild(conn); }
        const ph = el("div", "xblock mining"); ph.innerHTML = `<div class="xtop"></div><div class="xpad"><div class="xh"><span class="xn">#${blocks.length}</span><span class="xs">mining…</span></div><div class="xseg"><div class="xlbl">data</div><div class="xv">${data}</div></div><div class="xseg xnonce"><span class="xlbl" style="margin:0">nonce</span><span class="v" id="phn">0</span></div><div class="xseal"><span class="lk">🔓</span><span class="sv" id="phh"></span></div></div>`;
        c.appendChild(ph); c.scrollLeft = c.scrollWidth;
        const tick = () => { if (!document.contains(wrap)) return; for (let i = 0; i < 130; i++) { if (hh(tmp, p).startsWith("0".repeat(diff))) { tmp.prev = p; tmp.hash = hh(tmp, p); blocks.push(tmp); render(blocks.length - 1); if (onDone) onDone(); return; } tmp.nonce++; } ph.querySelector("#phn").textContent = fmt(tmp.nonce); ph.querySelector("#phh").textContent = short(hh(tmp, p), 10, 6); setTimeout(tick, 16); };
        setTimeout(tick, 16);
      },
      count() { return blocks.length; }
    };
  }

  /* merkle tree builder — shows each pair of hashes combining up to the root */
  function merkleViz(host, txs, opts) {
    opts = opts || {}; const compact = !!opts.compact;
    let levels = [], cur = txs.map(t => ({ hash: sha256(t), label: t, kids: null }));
    levels.push(cur);
    while (cur.length > 1) { const nx = []; for (let i = 0; i < cur.length; i += 2) { const a = cur[i], b = cur[i + 1] || cur[i]; nx.push({ hash: sha256(a.hash + b.hash), kids: [a, b] }); } levels.push(nx); cur = nx; }
    const parents = levels.slice(1).reduce((a, lv) => a.concat(lv), []);
    let built = compact ? parents.length : 0;
    const wrap = el("div", compact ? "" : "fcard");
    wrap.innerHTML = (compact ? "" : `<div class="flabel"><span class="pin"></span>how the merkle root is built</div>`) +
      `<div class="mvz${compact ? " compact" : ""}"><svg></svg><div class="mvz-rows"></div></div>` +
      (compact ? "" : `<div class="mvz-formula">Each pair of fingerprints gets hashed into one parent. Build it one step at a time.</div><div class="btn-row" style="justify-content:center;margin-top:12px"><button class="btn primary" id="mvs">Combine next pair ▶</button><button class="btn" id="mva">Build it all</button><button class="btn" id="mvr">Reset</button></div>`);
    host.appendChild(wrap);
    const rowsEl = wrap.querySelector(".mvz-rows"), svg = wrap.querySelector("svg"), mvz = wrap.querySelector(".mvz");
    const isBuilt = (n) => { const i = parents.indexOf(n); return i < 0 || i < built; };
    function render() {
      rowsEl.innerHTML = "";
      levels.forEach((lv, li) => { const row = el("div", "mvz-row"); lv.forEach(node => { const isLeaf = li === 0, isRoot = li === levels.length - 1, shown = isLeaf || isBuilt(node), active = !compact && built > 0 && node === parents[built - 1];
        const n = el("div", "mvz-node" + (isLeaf ? " leaf" : "") + (isRoot && shown ? " root" : "") + (shown ? "" : " ghost") + (active ? " active" : ""));
        n.innerHTML = (isLeaf ? `<div class="lbl">${node.label}</div>` : isRoot ? `<div class="lbl">${shown ? "MERKLE ROOT" : "root"}</div>` : "") + (shown ? short(node.hash, 5, 3) : "?"); node._el = n; row.appendChild(n); }); rowsEl.appendChild(row); });
      requestAnimationFrame(drawLines); setTimeout(drawLines, 180);
    }
    function drawLines() { const box = mvz.getBoundingClientRect(); svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`); svg.innerHTML = "";
      levels.forEach((lv, li) => { if (!li) return; lv.forEach(node => { if (!isBuilt(node) || !node.kids) return; const pr = node._el.getBoundingClientRect(), px = pr.left + pr.width / 2 - box.left, py = pr.top - box.top, active = !compact && node === parents[built - 1];
        node.kids.forEach(kid => { if (!kid._el) return; const kr = kid._el.getBoundingClientRect(), kx = kr.left + kr.width / 2 - box.left, ky = kr.bottom - box.top; const ln = document.createElementNS("http://www.w3.org/2000/svg", "line"); ln.setAttribute("x1", kx); ln.setAttribute("y1", ky); ln.setAttribute("x2", px); ln.setAttribute("y2", py); ln.setAttribute("stroke", active ? "#f1a222" : "rgba(98,13,60,.22)"); ln.setAttribute("stroke-width", active ? "2.5" : "1.5"); svg.appendChild(ln); }); }); });
    }
    if (!compact) {
      wrap.querySelector("#mvs").onclick = () => { if (built >= parents.length) return; built++; render(); const node = parents[built - 1]; wrap.querySelector(".mvz-formula").innerHTML = `SHA-256( <b>${short(node.kids[0].hash, 4, 0)}</b> + <b>${short(node.kids[1].hash, 4, 0)}</b> ) = <span class="hl">${short(node.hash, 5, 3)}</span>` + (built >= parents.length ? `<br>That last hash is the <b>Merkle root</b> — one fingerprint for all ${txs.length} transactions.` : ""); if (built >= parents.length) wrap.querySelector("#mvs").disabled = true; };
      wrap.querySelector("#mva").onclick = () => { built = parents.length; render(); wrap.querySelector(".mvz-formula").innerHTML = `Every pair hashed up to one <b>Merkle root</b>: <span class="hl">${short(levels[levels.length - 1][0].hash, 7, 4)}</span>`; wrap.querySelector("#mvs").disabled = true; };
      wrap.querySelector("#mvr").onclick = () => { built = 0; wrap.querySelector("#mvs").disabled = false; wrap.querySelector(".mvz-formula").innerHTML = "Each pair of fingerprints gets hashed into one parent. Build it one step at a time."; render(); };
    }
    render();
    return { root: levels[levels.length - 1][0].hash };
  }

  /* drag-to-build + live-mine a single block */
  function blockLab(host) {
    const pool = ["Alice → Bob: 5", "Carol → Dan: 2", "Eve → Finn: 8", "Gail → Hank: 1", "Ivy → Jo: 4", "Ken → Lee: 6"];
    let inB = [], mining = false, sealed = false, curHash = "";
    const merk = (a) => { if (!a.length) return ""; let lvl = a.map(x => sha256(x)); while (lvl.length > 1) { const n = []; for (let i = 0; i < lvl.length; i += 2) n.push(sha256(lvl[i] + (lvl[i + 1] || lvl[i]))); lvl = n; } return lvl[0]; };
    const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>build &amp; seal your own block</div>
      <div class="lab-grid"><div><div class="note" style="margin-bottom:8px">drag these in — or tap them →</div><div class="txpool" id="pool"></div></div>
      <div><div id="slot"></div><button class="btn gold block" id="mine" style="margin-top:12px" disabled>⛏ Mine to seal it</button></div></div>
      <div id="mwrap" style="margin-top:20px;display:none"><div class="note" style="text-align:center;margin-bottom:6px">the one merkle root above is built by hashing your transactions together, in pairs:</div><div id="mslot"></div></div>`;
    host.appendChild(wrap);
    const poolEl = wrap.querySelector("#pool"), slot = wrap.querySelector("#slot"), mineBtn = wrap.querySelector("#mine");
    function drawMerkle() { const mw = wrap.querySelector("#mwrap"), ms = wrap.querySelector("#mslot"); if (inB.length >= 2) { mw.style.display = "block"; ms.innerHTML = ""; merkleViz(ms, inB, { compact: true }); } else { mw.style.display = "none"; ms.innerHTML = ""; } }
    function drawPool() { poolEl.innerHTML = ""; pool.forEach(t => { const used = inB.includes(t); const chip = el("div", "txchip" + (used ? " used" : ""), `<span class="grip">⠿</span>${t}`); if (!used && !sealed) { chip.draggable = true; chip.ondragstart = e => { e.dataTransfer.setData("text/plain", t); chip.classList.add("dragging"); }; chip.ondragend = () => chip.classList.remove("dragging"); chip.onclick = () => add(t); } poolEl.appendChild(chip); }); }
    function drawBlock() { const root = inB.length ? merk(inB) : null;
      slot.innerHTML = `<div class="xblock${sealed ? " justsealed" : mining ? " mining" : ""}"><div class="xtop"></div><div class="xpad">
        <div class="xh"><span class="xn">#1</span><span class="xs">${sealed ? "sealed" : mining ? "mining…" : inB.length + " tx"}</span></div>
        <div class="xseg"><div class="xlbl">transactions${sealed ? " (locked)" : " — drop here"}</div><div class="dropzone${inB.length ? "" : " empty"}" id="dz">${inB.length ? inB.map(t => `<div class="xtx">${t}</div>`).join("") : "drag a transaction here"}</div></div>
        <div class="xseg"><div class="xlbl">merkle root</div><div class="xv" style="color:var(--gold-2)">${root ? short(root, 11, 7) : "—"}</div></div>
        <div class="xseal"><span class="lk">${sealed ? "🔒" : "🔓"}</span><span class="sv">${sealed || mining ? short(curHash || "0".repeat(64), 10, 6) : "not sealed yet"}</span></div>
        ${mining ? `<div class="minebar"><i id="mb"></i></div>` : ""}</div></div>`;
      const dz = slot.querySelector("#dz"); if (!sealed && !mining) { dz.ondragover = e => { e.preventDefault(); dz.classList.add("over"); }; dz.ondragleave = () => dz.classList.remove("over"); dz.ondrop = e => { e.preventDefault(); dz.classList.remove("over"); add(e.dataTransfer.getData("text/plain")); }; }
      mineBtn.disabled = !inB.length || sealed || mining;
    }
    function add(t) { if (sealed || mining || inB.includes(t) || !pool.includes(t)) return; inB.push(t); drawPool(); drawBlock(); drawMerkle(); }
    mineBtn.onclick = () => { if (!inB.length || sealed || mining) return; mining = true; drawBlock();
      let n = 0; const b = merk(inB) + "prev0";
      const tick = () => { if ((!mining && !sealed) || !document.contains(wrap)) return; for (let i = 0; i < 130; i++) { const h = sha256(b + n); if (h.startsWith("000")) { curHash = h; mining = false; sealed = true; drawPool(); drawBlock(); mineBtn.textContent = "✓ Sealed — it is now locked by its fingerprint"; return; } n++; } curHash = sha256(b + n); const mb = slot.querySelector("#mb"); if (mb) mb.style.width = Math.min(96, n / 4096 * 100) + "%"; const sv = slot.querySelector(".sv"); if (sv) sv.textContent = short(curHash, 10, 6); setTimeout(tick, 16); };
      setTimeout(tick, 16); };
    drawPool(); drawBlock(); drawMerkle();
  }

  const L = {};

  /* ===================== FOUNDATIONS ===================== */
  L.ledger = { world: "foundations", title: "The ledger", oneliner: "What money really is", icon: "₿",
    hero: "Money isn't gold or paper. It's a list of who owns what. Everything starts here.",
    beats: [
      { n: "01", h: "Money is just a list", cap: "Press send and watch the entries change. The coins never move — only the <b>record</b> of who owns them.",
        build(s) { let bal = { Alice: 12, Bob: 7, You: 5 }; const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>the ledger</div><div class="kvs" id="lgT"></div><div class="btn-row" style="margin-top:14px;justify-content:center"><button class="btn primary" id="lgS">Alice pays Bob 3</button><button class="btn" id="lgR">Reset</button></div>`;
          s.appendChild(wrap);
          const draw = (flash) => wrap.querySelector("#lgT").innerHTML = Object.entries(bal).map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v ${flash && (k === 'Alice' || k === 'Bob') ? 'gr' : ''}">${v} coins</span></div>`).join("");
          draw();
          wrap.querySelector("#lgS").onclick = () => { if (bal.Alice < 3) return; bal.Alice -= 3; bal.Bob += 3; draw(true); setTimeout(() => draw(false), 600); };
          wrap.querySelector("#lgR").onclick = () => { bal = { Alice: 12, Bob: 7, You: 5 }; draw(); };
        } },
      { n: "02", h: "So who keeps the list?", cap: "A bank keeps one master copy. A blockchain gives <b>everyone</b> a copy. Try cheating both — only one shrugs it off.",
        build(s) { let mode = "d"; const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="btn-row" style="margin-bottom:16px"><button class="btn" data-m="c">One bank</button><button class="btn primary" data-m="d">A network</button></div><div id="lgB"></div>`;
          s.appendChild(wrap); const body = wrap.querySelector("#lgB");
          const setB = () => wrap.querySelectorAll("[data-m]").forEach(b => b.className = "btn" + (b.dataset.m === mode ? " primary" : ""));
          function render() { setB();
            if (mode === "c") { body.innerHTML = `<p class="note" style="margin-bottom:10px">One server holds the only copy.</p><div class="kvs" id="t"></div><div class="btn-row" style="margin-top:12px"><button class="btn danger" id="h">Hack the bank</button><button class="btn" id="r">Reset</button></div><div id="m" style="margin-top:12px"></div>`;
              let bal = { Alice: 50, Bob: 30, You: 20 }; const d = () => body.querySelector("#t").innerHTML = Object.entries(bal).map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v" style="${k === 'You' && v > 999 ? 'color:var(--red)' : ''}">${v}</span></div>`).join(""); d();
              body.querySelector("#h").onclick = () => { bal.You = 9999; d(); body.querySelector("#m").innerHTML = `<div class="sig-state bad">The single ledger was rewritten. No second copy to disagree — everyone must accept it.</div>`; };
              body.querySelector("#r").onclick = () => { bal = { Alice: 50, Bob: 30, You: 20 }; d(); body.querySelector("#m").innerHTML = ""; };
            } else { body.innerHTML = `<p class="note" style="margin-bottom:10px">Every node keeps its own copy.</p><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px" id="n"></div><div class="btn-row" style="margin-top:12px"><button class="btn danger" id="h">Hack node 3</button><button class="btn" id="r">Reset</button></div><div id="m" style="margin-top:12px"></div>`;
              const nodes = [20, 20, 20, 20, 20]; const d = () => body.querySelector("#n").innerHTML = nodes.map((v, i) => `<div class="bfield" style="text-align:center;padding:10px"><div class="k">node ${i + 1}</div><div class="v ${v > 999 ? '' : 'gr'}" style="${v > 999 ? 'color:var(--red)' : ''}">${v}</div></div>`).join(""); d();
              body.querySelector("#h").onclick = () => { nodes[2] = 9999; d(); body.querySelector("#m").innerHTML = `<div class="sig-state ok">Node 3 lies, but the other four still say 20. The majority rejects it. No single node can rewrite history.</div>`; };
              body.querySelector("#r").onclick = () => { nodes.fill(20); d(); body.querySelector("#m").innerHTML = ""; };
            }
          }
          wrap.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { mode = b.dataset.m; render(); }); render();
        } },
    ],
    deeper: P("Removing the trusted keeper is the whole point of a blockchain — but it creates a hard new problem. With no boss, how does everyone agree on the one true ledger, and in what order? That question — <b>consensus</b> — drives the rest of this course. The bank's strength (one authority) is also its weakness (one point of control and failure).") },

  L.doublespend = { world: "foundations", title: "Double-spend", oneliner: "The problem digital money must solve", icon: "⊘",
    hero: "Cash can't be in two places at once. A digital file can. That's the problem.",
    beats: [
      { n: "01", h: "A coin is a file, and files copy", cap: "Click to copy the same coin to two people. Nothing physical stops you — so what does?",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;gap:26px;padding:10px 0">
            <div style="text-align:center"><div id="dCoin" style="width:64px;height:64px;border-radius:50%;background:var(--gold);display:grid;place-items:center;font-weight:700;color:#4a2c00;font-size:24px;box-shadow:var(--sh-gold);transition:transform .3s">◉</div><div class="note" style="margin-top:6px">your coin</div></div>
            <div style="font-size:24px;color:var(--ink-3)" id="dArrow">→</div>
            <div style="display:flex;flex-direction:column;gap:10px"><div class="bfield" id="dB" style="min-width:120px">Bob <span class="note" style="float:right" id="dBs">—</span></div><div class="bfield" id="dC" style="min-width:120px">Carol <span class="note" style="float:right" id="dCs">—</span></div></div></div>
            <div class="btn-row" style="justify-content:center;margin-top:8px"><button class="btn primary" id="dClone">Copy coin to both</button><button class="btn" id="dRst">Reset</button></div>
            <div class="note" id="dMsg" style="text-align:center;margin-top:12px">Both copies look identical. Which is the ‘real’ one?</div>`;
          s.appendChild(wrap);
          wrap.querySelector("#dClone").onclick = () => { wrap.querySelector("#dBs").textContent = "got ◉"; wrap.querySelector("#dCs").textContent = "got ◉"; wrap.querySelector("#dB").style.borderColor = "var(--green)"; wrap.querySelector("#dC").style.borderColor = "var(--red)"; wrap.querySelector("#dMsg").innerHTML = `<span style="color:var(--red)">You just spent one coin twice. With no rule for order, both think they got paid.</span>`; };
          wrap.querySelector("#dRst").onclick = () => { wrap.querySelector("#dBs").textContent = "—"; wrap.querySelector("#dCs").textContent = "—"; wrap.querySelector("#dB").style.borderColor = ""; wrap.querySelector("#dC").style.borderColor = ""; wrap.querySelector("#dMsg").innerHTML = "Both copies look identical. Which is the ‘real’ one?"; };
        } },
      { n: "02", h: "The fix needs agreement on order", cap: "Pay Bob, then pay Carol the same coin. Both signatures are valid — only an agreed <b>order</b> can break the tie.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="btn-row" style="justify-content:center;margin-bottom:12px"><button class="btn primary" id="d1">Pay Bob</button><button class="btn danger" id="d2" disabled>Pay Carol — same coin</button></div><div class="log" id="dL"><div class="info">network sees:</div></div>`;
          s.appendChild(wrap); const log = (h, c) => wrap.querySelector("#dL").appendChild(el("div", c, h));
          wrap.querySelector("#d1").onclick = (e) => { e.target.disabled = true; wrap.querySelector("#d2").disabled = false; log("tx1 · You → Bob · <span style='color:var(--green)'>signature valid</span>"); };
          wrap.querySelector("#d2").onclick = (e) => { e.target.disabled = true; log("tx2 · You → Carol · <span style='color:var(--green)'>also valid</span>"); log("both signatures check out — crypto proves WHO, not WHEN", "warn"); log("only an agreed order of transactions resolves this → consensus", "info"); };
        } },
    ],
    deeper: P("The problem splits in two. <b>Authorisation</b> — proving you own the coin — is solved by a signature. <b>Ordering</b> — agreeing which payment came first — needs everyone to settle on one shared order of transactions. And you can't just vote on it, because identity online is free: one person can spin up a million fake nodes (a <b>Sybil attack</b>). So a vote must cost something real — electricity (Proof of Work) or staked capital (Proof of Stake). The network is secure because lying is expensive.") };

  /* ===================== CRYPTOGRAPHY ===================== */
  L.hashing = { world: "crypto", title: "Hashing", oneliner: "The digital fingerprint", icon: "#",
    hero: "Feed in anything, get back a short fingerprint. This one tool seals records, links blocks, and powers mining.",
    beats: [
      { n: "01", h: "The hashing machine", cap: "Type anything. SHA-256 turns it into exactly <b>64 characters</b> — the same length whether you type a word or a novel.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>SHA-256</div><input class="in big-in" id="hxIn" value="blockchain"><div style="text-align:center;color:var(--ink-4);font-size:20px;margin:10px 0">↓</div><div class="hashout" id="hxOut"></div><div class="note" style="text-align:center;margin-top:10px" id="hxLen"></div>`;
          s.appendChild(wrap); const inp = wrap.querySelector("#hxIn"), out = wrap.querySelector("#hxOut");
          let raf; function render() { const real = sha256(inp.value); let t = 0; cancelAnimationFrame(raf);
            const scramble = () => { if (t < 6) { out.textContent = Array.from({ length: 64 }, () => "0123456789abcdef"[(Math.random() * 16) | 0]).join(""); t++; raf = requestAnimationFrame(scramble); } else { out.textContent = real; } };
            scramble(); wrap.querySelector("#hxLen").textContent = `${inp.value.length} characters in · always 64 hex characters out`; }
          inp.oninput = render; render();
        } },
      { n: "02", h: "Change one letter — half the bits flip", cap: "Edit input B by one character. The two fingerprints don't drift apart gradually — they <b>scatter completely</b>. That's the avalanche effect.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="bfields"><div><div class="bfield" style="border:none;padding:0;margin-bottom:6px"><div class="k">input A</div></div><textarea class="in" id="hA" rows="2">hello</textarea></div><div><div class="bfield" style="border:none;padding:0;margin-bottom:6px"><div class="k">input B</div></div><textarea class="in" id="hB" rows="2">Hello</textarea></div></div><div class="metric" style="margin-top:14px"><span class="n" id="hD">0</span> <span class="u">/ 256 bits differ</span></div><div class="avalanche" id="hG"></div>`;
          s.appendChild(wrap); const A = wrap.querySelector("#hA"), B = wrap.querySelector("#hB"), grid = wrap.querySelector("#hG");
          for (let i = 0; i < 256; i++) grid.appendChild(el("div", "b")); const cells = grid.children;
          function render() { const ba = bitsOf(sha256(A.value)), bb = bitsOf(sha256(B.value)); let d = 0; for (let i = 0; i < 256; i++) { const on = ba[i] !== bb[i]; cells[i].classList.toggle("on", on); if (on) d++; } wrap.querySelector("#hD").textContent = d; }
          A.oninput = render; B.oninput = render; render();
        } },
      { n: "03", h: "And there's no way back", cap: "Here's a hash of a secret word. Guess inputs all you like — you'll never recover it. Hashing throws information away.",
        build(s) { const SECRET = "marigold"; const target = sha256(SECRET); const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="bfield full"><div class="k">a hash of some secret word</div><div class="v go">${short(target, 20, 10)}</div></div><div style="margin-top:12px"><input class="in" id="gIn" placeholder="try to guess the word…"></div><div class="sig-state" id="gOut" style="margin-top:10px">Type a guess.</div><div class="note" style="margin-top:8px">There's no formula. Even a supercomputer would just be guessing.</div>`;
          s.appendChild(wrap); const inp = wrap.querySelector("#gIn"), out = wrap.querySelector("#gOut"); let tries = 0;
          inp.oninput = () => { if (!inp.value) { out.textContent = "Type a guess."; out.className = "sig-state"; return; } tries++; const h = sha256(inp.value); if (h === target) { out.innerHTML = "You found it. (You'd never guess this for a real 256-bit secret.)"; out.className = "sig-state ok"; } else { out.innerHTML = `<span class="mono" style="font-size:11px">${short(h, 14, 8)}</span> — no match (${tries} tries)`; out.className = "sig-state bad"; } };
        } },
    ],
    deeper: P("SHA-256 returns <b>256 bits</b> — 64 hex characters. Infinitely many inputs map to only 2²⁵⁶ outputs, so it <b>destroys information</b>: you can't run it backwards. Reversing a specific output would take longer than the age of the universe. Security rests on three guarantees: <b>preimage</b> resistance (can't find an input for an output), <b>second-preimage</b> (can't find another input matching one), and <b>collision</b> resistance (can't find any two that match). The birthday paradox means collisions take ~2¹²⁸ work, not 2²⁵⁶ — still astronomical, which is why SHA-256 holds while SHA-1 (2⁸⁰) is broken. Hashing is not encryption: encryption is two-way and keeps the data; hashing is one-way and throws it away.") };

  L.keys = { world: "crypto", title: "Keys & signatures", oneliner: "Ownership without trust", icon: "⚿",
    hero: "No usernames, no passwords. A secret number is the only thing that proves something is yours.",
    beats: [
      { n: "01", h: "One secret, flowing one way", cap: "A private key gives a public key gives an address. You can walk this chain forwards — <b>never backwards</b>.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>key derivation</div><div id="kd"></div><button class="btn primary block" id="kdGo" style="margin-top:14px">Roll a new private key</button>`;
          s.appendChild(wrap);
          function show() { const priv = sha256("k" + Math.random() + Date.now()); const pub = sha256(priv); const addr = "0x" + sha256(pub).slice(-16);
            wrap.querySelector("#kd").innerHTML = `<div class="bfield" style="border-color:var(--red)"><div class="k" style="color:var(--red)">private key · keep secret</div><div class="v" style="color:var(--red)">${short(priv, 16, 8)}</div></div><div style="text-align:center;color:var(--gold-2);font-size:13px;margin:8px 0">↓ hash ↓</div><div class="bfield"><div class="k">public key · share freely</div><div class="v vi">${short(pub, 16, 8)}</div></div><div style="text-align:center;color:var(--gold-2);font-size:13px;margin:8px 0">↓ hash ↓</div><div class="bfield" style="border-color:var(--green)"><div class="k" style="color:var(--green)">your address · how people pay you</div><div class="v gr">${addr}</div></div>`; }
          wrap.querySelector("#kdGo").onclick = show; show();
        } },
      { n: "02", h: "Sign it — then try to forge it", cap: "Sign a payment, then tamper with the amount. The signature instantly stops matching. That's how the network spots fakes.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div id="kE"><button class="btn primary lg block" id="kG">Make a key pair${hasSubtle ? ' &nbsp;<span class="mono" style="font-size:11px;opacity:.7">real ECDSA</span>' : ''}</button></div><div id="kS" style="display:none"><div class="k" style="font-size:10px;text-transform:uppercase;color:var(--ink-3);margin-bottom:6px">transaction</div><input class="in mono" id="kM" value="Pay Bob 5 coins"><div class="btn-row" style="margin-top:12px"><button class="btn primary" id="kSg">Sign</button><button class="btn" id="kT" disabled>Tamper</button><button class="btn" id="kV" disabled>Verify</button></div><div class="bfield" style="margin-top:12px"><div class="k">signature</div><div class="v" id="kSig">— not signed —</div></div><div class="sig-state" id="kSt" style="margin-top:10px">Sign, then tamper, then verify.</div></div>`;
          s.appendChild(wrap); let keys = null, sig = null; const setS = (t, c) => { const e = wrap.querySelector("#kSt"); e.textContent = t; e.className = "sig-state" + (c ? " " + c : ""); };
          wrap.querySelector("#kG").onclick = async () => { if (hasSubtle) { keys = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]); } else { keys = { _p: sha256("p" + Math.random()) }; } wrap.querySelector("#kE").style.display = "none"; wrap.querySelector("#kS").style.display = "block"; };
          wrap.querySelector("#kSg").onclick = async () => { const m = wrap.querySelector("#kM").value; sig = hasSubtle ? hexOf(await subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keys.privateKey, new TextEncoder().encode(m))) : sha256(keys._p + m); wrap.querySelector("#kSig").textContent = short(sig, 18, 8); wrap.querySelector("#kT").disabled = false; wrap.querySelector("#kV").disabled = false; setS("Signed. Now tamper, then verify.", "ok"); };
          wrap.querySelector("#kT").onclick = () => { wrap.querySelector("#kM").value = "Pay Bob 5000 coins"; setS("Attacker changed 5 → 5000 but kept the signature.", ""); };
          wrap.querySelector("#kV").onclick = async () => { const m = wrap.querySelector("#kM").value; const ok = hasSubtle ? await subtle.verify({ name: "ECDSA", hash: "SHA-256" }, keys.publicKey, new Uint8Array(sig.match(/../g).map(h => parseInt(h, 16))), new TextEncoder().encode(m)) : sig === sha256(keys._p + m); ok ? setS("VALID — matches the message and the key.", "ok") : setS("REJECTED — the message was altered after signing.", "bad"); };
        } },
    ],
    deeper: P("This is <b>ECDSA</b>, the same elliptic-curve signatures Bitcoin and Ethereum use. The trapdoor: your public key is a fixed point added to itself a secret number of times; going forward is fast, going back (the discrete-log problem) is hopeless. Signing covers the <b>hash</b> of the transaction, so it proves authenticity and integrity at once — and the verifier learns only ‘this key signed this’, never your secret. Lose the key and the coins freeze forever; copy it and the thief simply is you.") };

  /* ===================== BUILDING THE CHAIN ===================== */
  L.block = { world: "chain", title: "A block", oneliner: "Build one, then seal it", icon: "▦",
    hero: "A block is a box. Drag some transactions in, then mine it — and watch the fingerprint churn through thousands of guesses before it locks shut.",
    beats: [
      { n: "01", h: "Drag transactions in, then seal it", cap: "Grab the waiting transactions and drop them into the block (or tap them). When you are ready, hit <b>Mine</b> — the seal scrambles through guess after guess until it finally locks.",
        build(s) { blockLab(s); } },
      { n: "02", h: "What's actually inside", cap: "Every block carries a tiny header: a link back to the previous block, the merkle root, and the nonce you just found. Edit a transaction below and the seal changes on the spot.",
        build(s) { richChain(s, { blocks: [{ data: "Alice → Bob: 5\nCarol → Dan: 2" }], editable: true, diff: 3 }); } },
    ],
    deeper: P("Each transaction is hashed; pairs of hashes are combined and hashed again, up a tree, until one <b>Merkle root</b> remains in the header. Hashing the whole header gives the block its ID — its seal. A block on its own isn't special; anyone can build one. What makes <i>adding</i> it costly, and the past unchangeable, is the next two lessons: the nonce, and the chain.") };

  L.nonce = { world: "chain", title: "The nonce", oneliner: "The one dial in a frozen block", icon: "⛏",
    hero: "A finished block is frozen — the transactions, the link, the time. A miner can change exactly one thing: a throwaway number called the nonce. Mining is just turning that one dial.",
    beats: [
      { n: "01", h: "Everything is locked but one number", cap: "Look at the block below. The data, the link to the last block, the merkle root, the time — all <b>fixed</b>. The miner is only allowed to change the <span class='k'>nonce</span>. Turn the dial and watch: only it and the hash move. Nothing else can.",
        build(s) { let nonce = 0, auto = false; const F = { data: "Alice → Bob: 5 ; Carol → Dan: 2", prev: "0000a3f2c1b8…d41f", merkle: "9c1f7e44a2…b023", time: "14:02:51" };
          const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>one block · one moving part</div>
            <div class="nfields">
              <div class="nfield locked"><span class="ico">🔒</span><span class="nf-k">data</span><span class="nf-v">${F.data}</span><span class="tag">frozen</span></div>
              <div class="nfield locked"><span class="ico">🔒</span><span class="nf-k">prev hash</span><span class="nf-v">${F.prev}</span><span class="tag">frozen</span></div>
              <div class="nfield locked"><span class="ico">🔒</span><span class="nf-k">merkle root</span><span class="nf-v">${F.merkle}</span><span class="tag">frozen</span></div>
              <div class="nfield locked"><span class="ico">🔒</span><span class="nf-k">timestamp</span><span class="nf-v">${F.time}</span><span class="tag">frozen</span></div>
              <div class="nfield dial" id="dial"><span class="ico">🎲</span><span class="nf-k">nonce</span><span class="nf-v" id="nv">0</span><span class="tag">the only dial</span></div>
            </div>
            <div class="arrowdown">↓ hash all of it together ↓</div>
            <div class="nfield hashout-row"><span class="ico">#</span><span class="nf-k">block hash</span><span class="nf-v" id="nh"></span></div>
            <div class="btn-row" style="justify-content:center;margin-top:16px"><button class="btn gold" id="spin">Turn the dial · +1</button><button class="btn primary" id="fast">Spin fast</button><button class="btn" id="rst">Reset</button></div>
            <div class="note" style="text-align:center;margin-top:10px">Four fields frozen, one dial turning. That single number is the miner's only freedom.</div>`;
          s.appendChild(wrap); const body = F.data + F.prev + F.merkle + F.time;
          const draw = () => { wrap.querySelector("#nv").textContent = fmt(nonce); wrap.querySelector("#nh").innerHTML = splitZ(sha256(body + nonce)); };
          const dial = wrap.querySelector("#dial");
          wrap.querySelector("#spin").onclick = () => { nonce++; dial.classList.add("spin"); draw(); setTimeout(() => dial.classList.remove("spin"), 150); };
          wrap.querySelector("#rst").onclick = () => { auto = false; nonce = 0; dial.classList.remove("spin"); wrap.querySelector("#fast").textContent = "Spin fast"; draw(); };
          wrap.querySelector("#fast").onclick = () => { if (auto) { auto = false; dial.classList.remove("spin"); wrap.querySelector("#fast").textContent = "Spin fast"; return; } auto = true; dial.classList.add("spin"); wrap.querySelector("#fast").textContent = "Stop"; const step = () => { if (!auto || !document.contains(wrap)) return; for (let i = 0; i < 35; i++) nonce++; draw(); setTimeout(step, 40); }; step(); };
          draw();
        } },
      { n: "02", h: "Why turn it at all?", cap: "A hash is a random number in a huge range. A valid block needs one that lands in a tiny <b>target zone</b> near zero. You can't aim the hash — so you re-roll the dial until it happens to land there.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>below the target?</div><div style="position:relative;height:30px;border-radius:99px;background:var(--surface-3);border:1px solid var(--line);overflow:hidden;margin:10px 0"><div style="position:absolute;left:0;top:0;bottom:0;width:14%;background:var(--green-soft)"></div><div id="dieMark" style="position:absolute;top:50%;width:16px;height:16px;border-radius:50%;background:var(--plum);transform:translate(-50%,-50%);left:60%;transition:left .25s"></div></div><div style="display:flex;justify-content:space-between"><span class="note" style="color:var(--green)">◀ target zone (valid)</span><span class="note">too big ▶</span></div><div class="verdict no" id="dieV" style="margin-top:14px">roll to try</div><button class="btn gold block" id="dieGo" style="margin-top:12px">Roll</button>`;
          s.appendChild(wrap); let n = 0;
          wrap.querySelector("#dieGo").onclick = () => { n++; const h = sha256("roll" + n + Math.random()); const pos = parseInt(h.slice(0, 4), 16) / 65535; wrap.querySelector("#dieMark").style.left = (4 + pos * 92) + "%"; const win = pos < 0.14; const v = wrap.querySelector("#dieV"); if (win) { v.className = "verdict yes"; v.textContent = `Landed in the target zone — valid block! (roll ${n})`; } else { v.className = "verdict no"; v.textContent = `too big — re-roll (${n} tries)`; } };
        } },
      { n: "03", h: "Crank the difficulty", cap: "The more leading zeros the network demands, the smaller the target, and the more times you have to spin the dial. Drag the difficulty up and watch the expected number of guesses explode.",
        build(s) { let diff = 4, nonce = 0, tries = 0, mining = false; const DATA = "block #42 · Alice→Bob 5", PREV = "0000a3f2c1";
          const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="nonce-display"><span class="lab">current nonce</span><span id="nN">0</span></div><div class="hashout" id="nH" style="margin:16px 0;text-align:center"></div><div class="verdict no" id="nV" style="margin-bottom:16px"></div><div class="target-line">hash must start with <span class="t" id="nT">0000</span></div><div class="srow" style="margin:14px 0"><span class="nm">difficulty</span><input type="range" id="nD" min="1" max="5" value="4"><span class="v" id="nDv">4</span></div><div class="statline"><div class="s"><span class="n" id="nE">65,536</span><span class="l">expected tries</span></div><div class="s"><span class="n" id="nTr">0</span><span class="l">your tries</span></div></div><div class="btn-row" style="margin-top:16px;justify-content:center"><button class="btn gold" id="nTy">Spin once</button><button class="btn primary" id="nAu">Auto-mine</button><button class="btn" id="nR">Reset</button></div>`;
          s.appendChild(wrap); const tgt = () => "0".repeat(diff);
          function render() { const h = sha256(DATA + PREV + nonce); wrap.querySelector("#nN").textContent = fmt(nonce); wrap.querySelector("#nTr").textContent = fmt(tries); wrap.querySelector("#nH").innerHTML = splitZ(h); const ok = h.startsWith(tgt()); const v = wrap.querySelector("#nV"); if (ok) { v.className = "verdict yes"; v.textContent = `Found it after ${fmt(tries)} tries`; } else { v.className = "verdict no"; v.textContent = `starts "${h.slice(0, diff)}" — need "${tgt()}"`; } return ok; }
          wrap.querySelector("#nD").oninput = (e) => { diff = +e.target.value; wrap.querySelector("#nDv").textContent = diff; wrap.querySelector("#nT").textContent = tgt(); wrap.querySelector("#nE").textContent = fmt(Math.pow(16, diff)); render(); };
          wrap.querySelector("#nTy").onclick = () => { if (mining) return; nonce++; tries++; render(); };
          wrap.querySelector("#nR").onclick = () => { mining = false; nonce = 0; tries = 0; wrap.querySelector("#nAu").textContent = "Auto-mine"; render(); };
          wrap.querySelector("#nAu").onclick = () => { if (mining) { mining = false; wrap.querySelector("#nAu").textContent = "Auto-mine"; return; } mining = true; wrap.querySelector("#nAu").textContent = "Stop"; const step = () => { if (!mining || !document.contains(wrap)) return; for (let i = 0; i < 1200; i++) { nonce++; tries++; if (sha256(DATA + PREV + nonce).startsWith(tgt())) { render(); mining = false; wrap.querySelector("#nAu").textContent = "Auto-mine"; return; } } render(); setTimeout(step, 0); }; setTimeout(step, 0); };
          render();
        } },
    ],
    deeper: P("If <code>p = target / 2²⁵⁶</code> is the chance one hash qualifies, expected tries is <code>1/p</code>, and each extra zero of difficulty makes it 16× rarer (a hex digit has 16 values). Bitcoin runs about 10²³ hashes per block every ten minutes, re-tuning the target every two weeks to hold that pace. The winner mints new coins plus fees. The recurring theme: producing a block is staggeringly expensive, but <b>checking</b> it is a single hash — that asymmetry is what makes the whole thing work.") };

  L.chainlink = { world: "chain", title: "The chain", oneliner: "Why the past locks", icon: "⛓",
    hero: "Line the blocks up. Each one writes down the fingerprint of the one before it — so the blocks are physically chained together by their own hashes.",
    beats: [
      { n: "01", h: "Follow the link between two blocks", cap: "Here is the single most important idea in this whole course: a block's <b>‘prev’</b> field holds the <b>exact fingerprint</b> of the block before it. Click any block to light up the link and see the two matching values for yourself.",
        build(s) { richChain(s, { blocks: [{ data: "Genesis block" }, { data: "Alice → Bob: 5" }, { data: "Carol → Dan: 2" }, { data: "Eve → Finn: 8" }], editable: false, diff: 3, trace: true }); } },
      { n: "02", h: "Watch new links form", cap: "Every new block grabs the current tip's fingerprint, writes it into its own ‘prev’ field, and then gets mined to seal it. Mine a few and watch each fresh link snap into place.",
        build(s) { const c = richChain(s, { blocks: [{ data: "Genesis block" }, { data: "Alice → Bob: 5" }, { data: "Carol → Dan: 2" }], editable: false, diff: 3 });
          const row = el("div", "btn-row"); row.style.justifyContent = "center"; row.style.marginTop = "8px";
          const tx = ["Dan → Eve: 3", "Eve → Finn: 8", "Finn → Gail: 2", "Gail → Hank: 6", "Hank → Ivy: 1"]; let i = 0, busy = false;
          const b = el("button", "btn primary", "⛏ Mine the next block"); b.onclick = () => { if (busy) return; busy = true; b.disabled = true; b.textContent = "mining…"; c.mineNext(tx[i++ % tx.length], () => { busy = false; b.disabled = false; b.textContent = "⛏ Mine the next block"; }); }; row.appendChild(b); s.appendChild(row);
        } },
      { n: "03", h: "Now try to rewrite the past", cap: "Edit a transaction in an old block. Its seal changes, so the next block's ‘prev’ no longer matches, and every link after it turns <b>red</b> — the tampering is visible to everyone, instantly.",
        build(s) { richChain(s, { blocks: [{ data: "Genesis" }, { data: "Alice → Bob: 5" }, { data: "Carol → Dan: 2" }, { data: "Eve → Finn: 8" }], editable: true, diff: 3 }); } },
    ],
    deeper: P("Changing the past doesn't just edit one block — it invalidates everything built on top, in plain view. To repair it you'd have to re-mine that block <i>and every block after it</i>, winning the whole Proof-of-Work race again, while the honest network keeps extending the real chain with all its power. Below 50% of the hashrate, you fall further behind every ten minutes. Fingerprints make tampering visible; work makes fixing it a race you lose. That combination is immutability.") };

  L.merkle = { world: "chain", title: "Merkle tree", oneliner: "Prove inclusion cheaply", icon: "⋔",
    hero: "A block can hold thousands of transactions, but its header has room for just one fingerprint. A Merkle tree squeezes them all into that single hash — and still lets you prove any one of them is inside.",
    beats: [
      { n: "01", h: "Watch the root get built", cap: "We hash the transactions together <b>two at a time</b>, climbing a tree, until a single hash is left: the <b>Merkle root</b> that goes into the block header. Build it one pair at a time and watch each combination happen.",
        build(s) { merkleViz(s, ["Alice→Bob", "Bob→Carol", "Carol→Dan", "Dan→Eve", "Eve→Finn", "Finn→Gail", "Gail→Hank", "Hank→Ivy"]); } },
      { n: "02", h: "Now prove one is inside — cheaply", cap: "To prove one transaction is in a block of thousands, you only need a <b>handful</b> of sibling hashes along the path to the root — not the whole block.",
        build(s) { const txs = ["Alice→Bob", "Bob→Carol", "Carol→Dan", "Dan→Eve", "Eve→Finn", "Finn→Gail", "Gail→Hank", "Hank→Ivy"];
          let levels = []; let lvl = txs.map(t => ({ hash: sha256(t), label: t })); levels.push(lvl); while (lvl.length > 1) { const n = []; for (let i = 0; i < lvl.length; i += 2) { const a = lvl[i], b = lvl[i + 1] || lvl[i]; n.push({ hash: sha256(a.hash + b.hash) }); } levels.push(n); lvl = n; }
          const wrap = el("div", ""); wrap.innerHTML = `<div class="mtree2" id="mt"></div><div class="sig-state" id="mM" style="max-width:560px;margin:18px auto 0;text-align:center">Click any transaction at the bottom.</div>`; s.appendChild(wrap);
          function proof(leaf) { const path = new Set(), prf = new Set(); let idx = leaf; for (let l = 0; l < levels.length - 1; l++) { path.add(levels[l][idx].hash); const sib = idx % 2 === 0 ? idx + 1 : idx - 1; prf.add((levels[l][sib] || levels[l][idx]).hash); idx = Math.floor(idx / 2); } path.add(levels[levels.length - 1][0].hash); return { path, prf }; }
          function render(sel) { const w = wrap.querySelector("#mt"); w.innerHTML = ""; const pr = sel >= 0 ? proof(sel) : null; for (let l = levels.length - 1; l >= 0; l--) { const row = el("div", "mrow"); levels[l].forEach((node, i) => { const isLeaf = l === 0, isRoot = l === levels.length - 1; let c = "mnode" + (isLeaf ? " leaf" : isRoot ? " root" : ""); if (pr) { if (pr.path.has(node.hash)) c += " path"; else if (pr.prf.has(node.hash)) c += " proof"; } const n = el("div", c, (isLeaf ? node.label + "<br>" : isRoot ? "ROOT<br>" : "") + short(node.hash, 5, 3)); if (isLeaf) n.onclick = () => { render(i); const sz = proof(i).prf.size; wrap.querySelector("#mM").innerHTML = `To prove <b>${txs[i]}</b> is in this block of ${txs.length}, supply just <b style="color:var(--gold-2)">${sz} gold hashes</b> and re-hash up the path to the root.`; }; row.appendChild(n); }); w.appendChild(row); } } render(-1);
        } },
    ],
    deeper: P("The tree's height is <code>log₂(n)</code>, so a million transactions need ~20 sibling hashes, a billion ~30 — doubling the block adds just one hash to the proof. A fake sibling produces the wrong root, so the proof fails safely even from an untrusted source. This is what lets a phone wallet confirm a payment in milliseconds without ever downloading the chain.") };

  /* ===================== CONSENSUS ===================== */
  L.forks = { world: "consensus", title: "Forks", oneliner: "How nodes agree", icon: "⑂",
    hero: "Two miners can win at the same instant. With no referee, which block is real?",
    beats: [
      { n: "01", h: "Longest chain wins", cap: "Trigger a fork, then pick which branch the next block builds on. The chain with more work wins; the loser is <b>orphaned</b>.",
        build(s) { let state = "base"; const wrap = el("div", ""); wrap.innerHTML = `<div id="fkS" style="display:flex;justify-content:center;padding:14px 0"></div><div class="btn-row" id="fkC" style="justify-content:center"></div><div class="log" id="fkL" style="margin-top:16px"><div class="info">network view</div></div>`; s.appendChild(wrap);
          const blk = (l, c) => `<div class="mblk" style="flex:0 0 auto;min-width:74px;text-align:center;${c === 'g' ? '' : c === 'p' ? 'border-color:var(--gold)' : c === 'o' ? 'border-color:var(--red);opacity:.4' : ''}"><div class="top" style="justify-content:center">${l}</div></div>`;
          const log = (h, c) => wrap.querySelector("#fkL").appendChild(el("div", c, h));
          function render() { const st = wrap.querySelector("#fkS"); if (state === "base") st.innerHTML = `<div style="display:flex;align-items:center">${blk("#2", "g")}<div class="mlink"></div>${blk("#3", "g")}<div class="mlink"></div>${blk("#4", "g")}</div>`; else if (state === "fork") st.innerHTML = `<div style="display:flex;align-items:center">${blk("#3", "g")}<div class="mlink"></div><div style="display:flex;flex-direction:column;gap:12px">${blk("#4a", "g")}${blk("#4b", "p")}</div></div>`; else st.innerHTML = `<div style="display:flex;align-items:center">${blk("#3", "g")}<div class="mlink"></div><div style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;align-items:center">${blk("#4a", "g")}<div class="mlink"></div>${blk("#5", "g")}</div>${blk("#4b", "o")}</div></div>`; ctl(); }
          function ctl() { const c = wrap.querySelector("#fkC"); c.innerHTML = ""; if (state === "base") { const b = el("button", "btn primary", "Two miners find #4 at once"); b.onclick = () => { state = "fork"; log("Pool A mines #4a; Pool B mines #4b — same height", ""); log("network split: both valid, briefly undecided", "warn"); render(); }; c.appendChild(b); } else if (state === "fork") { const a = el("button", "btn", "Extend #4a"); a.onclick = res; const b = el("button", "btn", "Extend #4b"); b.onclick = res; c.append(a, b); } else { const b = el("button", "btn", "Replay"); b.onclick = () => { state = "base"; wrap.querySelector("#fkL").innerHTML = '<div class="info">network view</div>'; render(); }; c.appendChild(b); } }
          function res() { state = "done"; log("next block extends one branch → more work → it wins", "info"); log("the losing block is orphaned; its transactions return to the pool", "bad"); log("consensus restored — the fork lasted one block", "ok"); render(); } render();
        } },
      { n: "02", h: "Why you wait for confirmations", cap: "Each new block stacked on top of yours makes it exponentially harder to undo. Stack a few and watch the chance of reversal fall off a cliff.",
        build(s) { let conf = 0; const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>burying a payment</div><div id="stack" style="display:flex;flex-direction:column-reverse;gap:5px;align-items:center;min-height:50px"></div><div style="text-align:center;margin:12px 0"><div class="note">rough chance it could still be reversed</div><div class="mono" id="risk" style="font-size:30px;font-weight:700"></div></div><div class="btn-row" style="justify-content:center"><button class="btn primary" id="add">+ One confirmation</button><button class="btn" id="reset">Reset</button></div>`;
          s.appendChild(wrap); function draw() { wrap.querySelector("#stack").innerHTML = `<div class="xtx" style="background:var(--gold-soft);color:var(--gold-2);font-weight:700">★ your payment</div>` + Array.from({ length: conf }, (_, i) => `<div class="xtx">confirmation ${i + 1}</div>`).join(""); const risk = conf === 0 ? 50 : Math.max(0.001, 50 * Math.pow(0.25, conf)); const r = wrap.querySelector("#risk"); r.textContent = risk >= 1 ? "~" + Math.round(risk) + "%" : risk < 0.01 ? "<0.01%" : risk.toFixed(2) + "%"; r.style.color = risk > 1 ? "var(--red)" : "var(--green)"; }
          wrap.querySelector("#add").onclick = () => { if (conf < 8) { conf++; draw(); } }; wrap.querySelector("#reset").onclick = () => { conf = 0; draw(); }; draw();
        } },
    ],
    deeper: P("A recent block is never fully final — a deeper competing branch could replace it (a <b>reorg</b>). You get <b>probabilistic finality</b>: every block stacked on top makes reversal exponentially harder. ‘Wait for six confirmations’ — about an hour — is exactly this idea with a number on it. There is no moment of certainty, only certainty that grows.") };

  L.attack = { world: "consensus", title: "The 51% attack", oneliner: "The security boundary", icon: "½",
    hero: "The whole system rests on one bet: that no one controls most of the mining.",
    beats: [
      { n: "01", h: "A race you usually lose", cap: "You're trying to reverse a payment by secretly out-mining the network. Set your share and the confirmations waited — the odds are Satoshi's, computed live.",
        build(s) { let q = 30, z = 6, run = false; const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="srow"><span class="nm">your hashrate</span><input type="range" id="aQ" min="5" max="90" value="30"><span class="v" id="aQv">30%</span></div><div class="srow" style="margin-top:10px"><span class="nm">confirmations</span><input type="range" id="aZ" min="0" max="12" value="6"><span class="v" id="aZv">6</span></div><div style="text-align:center;margin:18px 0"><div class="note">chance the attack eventually succeeds</div><div class="mono" id="aP" style="font-size:46px;font-weight:800"></div></div><div id="aRc"></div><div class="btn-row" style="margin-top:14px;justify-content:center"><button class="btn danger" id="aR">Run the attack</button></div><div class="note" id="aM" style="text-align:center;margin-top:10px"></div>`;
          s.appendChild(wrap);
          function prob(qf, zz) { const pp = 1 - qf; if (qf >= pp) return 1; const lam = zz * (qf / pp); let s2 = 0, po = Math.exp(-lam); for (let k = 0; k <= zz; k++) { if (k > 0) po *= lam / k; s2 += po * (1 - Math.pow(qf / pp, zz - k)); } return 1 - s2; }
          function upd() { wrap.querySelector("#aQv").textContent = q + "%"; wrap.querySelector("#aZv").textContent = z; const Pv = prob(q / 100, z); const e = wrap.querySelector("#aP"); e.textContent = Pv >= .5 ? Math.round(Pv * 100) + "%" : Pv < 1e-4 ? "<0.01%" : (Pv * 100).toPrecision(2) + "%"; e.style.color = Pv > .01 ? "var(--red)" : "var(--green)"; }
          wrap.querySelector("#aRc").innerHTML = `<div class="srow" style="gap:8px"><span class="nm" style="width:56px;color:var(--green)">honest</span><div style="flex:1;height:16px;background:var(--surface-3);border-radius:7px;overflow:hidden;border:1px solid var(--line)"><i id="aH" style="display:block;height:100%;width:0;background:var(--green)"></i></div><span class="v" style="width:22px;color:var(--green)" id="aHn">0</span></div><div class="srow" style="gap:8px;margin-top:6px"><span class="nm" style="width:56px;color:var(--red)">you</span><div style="flex:1;height:16px;background:var(--surface-3);border-radius:7px;overflow:hidden;border:1px solid var(--line)"><i id="aE" style="display:block;height:100%;width:0;background:var(--red)"></i></div><span class="v" style="width:22px;color:var(--red)" id="aEn">0</span></div>`;
          wrap.querySelector("#aQ").oninput = e => { q = +e.target.value; upd(); }; wrap.querySelector("#aZ").oninput = e => { z = +e.target.value; upd(); }; upd();
          wrap.querySelector("#aR").onclick = () => { if (run) return; run = true; const qf = q / 100; let h = z, ev = 0, t = 0; const hf = wrap.querySelector("#aH"), ef = wrap.querySelector("#aE"); const step = () => { t++; Math.random() < qf ? ev++ : h++; const sc = Math.max(h, ev, z + 3); hf.style.width = h / sc * 100 + "%"; ef.style.width = ev / sc * 100 + "%"; wrap.querySelector("#aHn").textContent = h; wrap.querySelector("#aEn").textContent = ev; if (ev > h) { wrap.querySelector("#aM").innerHTML = `<span style="color:var(--red)">You overtook the honest chain. Payment reversed.</span>`; run = false; return; } if (t > 220 || (qf < .5 && h - ev > 22)) { wrap.querySelector("#aM").innerHTML = `<span style="color:var(--green)">The honest chain pulled away. Attack failed.</span> Re-run — the odds above are the truth.`; run = false; return; } setTimeout(step, 42); }; step(); };
        } },
      { n: "02", h: "Even a majority has limits", cap: "Controlling most of the mining is powerful — but the cryptography still holds. Here is exactly where the line sits.",
        build(s) { const can = ["Reverse its own recent payments", "Block (censor) transactions", "Out-race the honest chain"]; const cant = ["Forge anyone else's signature", "Steal coins it has no key for", "Mint coins out of nothing", "Rewrite deep, buried history"];
          const wrap = el("div", "fcard"); wrap.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><div><div class="flabel" style="color:var(--red)"><span class="pin" style="background:var(--red)"></span>a 51% attacker can</div>${can.map(x => `<div class="sig-state bad" style="margin-bottom:6px">${x}</div>`).join("")}</div><div><div class="flabel" style="color:var(--green)"><span class="pin" style="background:var(--green)"></span>even then, cannot</div>${cant.map(x => `<div class="sig-state ok" style="margin-bottom:6px">${x}</div>`).join("")}</div></div>`; s.appendChild(wrap);
        } },
    ],
    deeper: P("With a majority you <b>can</b> double-spend your own recent payments and censor transactions; you <b>cannot</b> forge signatures, steal coins you have no key for, or change the rules. Below 50%, catch-up probability decays exponentially with each confirmation (Satoshi's gambler's-ruin result). At 50% it becomes certain — a cliff, not a slope. Subtler threats: <b>selfish mining</b> pays off above ~⅓ of hashrate, and <b>pools</b> can quietly drift toward majority. Security is economic, not absolute — attacks are deterred by costing more than they're worth.") };

  L.pos = { world: "consensus", title: "Proof of Stake", oneliner: "Capital, not electricity", icon: "◈",
    hero: "Same defence, different cost. Instead of burning power, validators put money on the line.",
    beats: [
      { n: "01", h: "Stake, propose, or get slashed", cap: "Validators win blocks in proportion to their stake. Make one cheat and the protocol <b>destroys its bond</b> — slashing.",
        build(s) { let vals = [{ n: "A", stake: 32, c: "#620d3c", w: 0, x: false }, { n: "B", stake: 96, c: "#f1a222", w: 0, x: false }, { n: "C", stake: 64, c: "#8a2057", w: 0, x: false }, { n: "D", stake: 32, c: "#2e9e6b", w: 0, x: false }];
          const wrap = el("div", "fcard"); wrap.innerHTML = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px" id="pG"></div><div class="btn-row" style="margin-top:16px;justify-content:center"><button class="btn primary" id="pR">Propose 50 blocks</button><button class="btn danger" id="pC">Make B double-sign</button><button class="btn" id="pRs">Reset</button></div><div class="log" id="pL" style="margin-top:14px"><div class="info">beacon chain</div></div>`;
          s.appendChild(wrap); const log = (h, c) => wrap.querySelector("#pL").appendChild(el("div", c, h)); const active = () => vals.filter(v => !v.x), tot = () => active().reduce((a, b) => a + b.stake, 0);
          function grid() { const g = wrap.querySelector("#pG"); g.innerHTML = ""; vals.forEach(v => { const pct = v.x ? 0 : Math.round(v.stake / tot() * 100); g.appendChild(el("div", "pos-card" + (v.x ? " slashed" : ""), `<b>Val ${v.n}</b><div class="stk">${v.stake}Ξ</div><div class="note" style="font-size:11px">${v.x ? "SLASHED" : pct + "% odds"}</div><div class="note" style="font-size:11px;color:${v.c}">won ${v.w}</div>`)); }); }
          function pick() { const a = active(); let r = Math.random() * tot(); for (const v of a) { if (r < v.stake) return v; r -= v.stake; } return a[a.length - 1]; }
          wrap.querySelector("#pR").onclick = () => { for (let i = 0; i < 50; i++) pick().w++; grid(); log("ran 50 blocks — reward share tracks stake share", "info"); };
          wrap.querySelector("#pC").onclick = () => { const b = vals[1]; if (b.x) return; log("Val B signs two conflicting blocks at one height", "warn"); const lost = b.stake; b.x = true; b.stake = 0; grid(); log(`Val B slashed — ${lost}Ξ destroyed and ejected.`, "bad"); };
          wrap.querySelector("#pRs").onclick = () => { vals.forEach(v => { v.w = 0; v.x = false; }); vals[1].stake = 96; wrap.querySelector("#pL").innerHTML = '<div class="info">beacon chain</div>'; grid(); }; grid();
        } },
      { n: "02", h: "And it sips energy", cap: "Same security, almost none of the power. Switching from mining to staking cut Ethereum's energy use by about 99.9%.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>energy use, compared</div><div style="margin:12px 0"><div style="display:flex;justify-content:space-between;font-size:13.5px"><b>Proof of Work</b><span class="mono">100%</span></div><div style="height:20px;background:var(--surface-3);border-radius:99px;overflow:hidden;margin-top:5px"><div style="height:100%;width:100%;background:var(--gold)"></div></div></div><div style="margin:12px 0"><div style="display:flex;justify-content:space-between;font-size:13.5px"><b>Proof of Stake</b><span class="mono">~0.05%</span></div><div style="height:20px;background:var(--surface-3);border-radius:99px;overflow:hidden;margin-top:5px"><div style="height:100%;width:0.6%;background:var(--green)"></div></div></div><div class="note" style="margin-top:6px">That sliver at the bottom is proof of stake. The trade-off critics raise: wealth and staking pools can concentrate control.</div>`; s.appendChild(wrap);
        } },
    ],
    deeper: P("Faking a thousand validators means risking a thousand times the money — the same Sybil defence as mining, but the scarce resource is capital, not energy. Ethereum's 2022 switch cut its energy use ~99.9%. The debate is genuinely open: PoW's cost is external and physical (you can't fake electricity); PoS's attacker has their own stake slashed (the attack destroys their capital). The shared worry: wealth and staking pools concentrate control.") };

  /* ===================== THE ECOSYSTEM ===================== */
  L.contracts = { world: "frontier", title: "Smart contracts", oneliner: "Code as the middleman", icon: "ƒ",
    hero: "Once a chain can store data and agree, it can run programs — with no off switch.",
    beats: [
      { n: "01", h: "A vending machine, on-chain", cap: "Call buy() with too little, then with enough. A failed <code>require</code> <b>reverts</b> the whole transaction, as if it never happened.",
        build(s) { let stock = 3; const wrap = el("div", "fcard"); wrap.innerHTML = `<pre class="sc-screen" style="white-space:pre-wrap"><span style="color:#f1a222">contract</span> Vending {
  uint price = 3;  uint stock = 3;
  <span style="color:#79e0c0">function</span> buy() payable {
    <span style="color:#ffd479">require</span>(msg.value >= price, "underpaid");
    <span style="color:#ffd479">require</span>(stock > 0, "sold out");
    stock--; emit Dispensed(msg.sender);
  }
}</pre><div class="btn-row" style="margin-top:14px;align-items:center"><span class="note">send</span><input class="in mono" id="cAmt" value="2" style="width:64px"><span class="note">coins</span><button class="btn primary" id="cCall">call buy()</button><span class="note" id="cStock">stock: 3</span></div><div class="log" id="cL" style="margin-top:12px"><div class="info">EVM execution</div></div>`;
          s.appendChild(wrap); const log = (h, c) => wrap.querySelector("#cL").appendChild(el("div", c, h));
          wrap.querySelector("#cCall").onclick = () => { const a = parseFloat(wrap.querySelector("#cAmt").value) || 0; log(`> buy() · msg.value = ${a}`); if (a < 3) { log(`require(value >= price) failed → REVERT "underpaid". State unchanged.`, "bad"); return; } if (stock <= 0) { log(`REVERT "sold out".`, "bad"); return; } stock--; wrap.querySelector("#cStock").textContent = "stock: " + stock; log(`guards passed · stock → ${stock} · emit Dispensed()`, "ok"); };
        } },
      { n: "02", h: "Immutable code, immutable bugs", cap: "Because a deployed contract cannot be patched, a single flaw is a vault with a hole. Trigger the bug and watch the funds drain — with no admin to stop it.",
        build(s) { let bal = 1000, t = null; const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>a buggy vault contract</div><div style="text-align:center"><div class="metric"><span class="n" id="v" style="color:var(--green)">1,000</span> <span class="u">coins locked in the contract</span></div></div><div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn danger" id="hack">Exploit the bug</button><button class="btn" id="reset">Reset</button></div><div class="sig-state" id="msg" style="margin-top:12px">The code runs exactly as written — flaws included.</div>`;
          s.appendChild(wrap); wrap.querySelector("#hack").onclick = () => { if (t) return; t = setInterval(() => { bal = Math.max(0, bal - Math.ceil(bal * 0.25)); wrap.querySelector("#v").textContent = bal.toLocaleString(); wrap.querySelector("#v").style.color = "var(--red)"; if (bal === 0) { clearInterval(t); t = null; wrap.querySelector("#msg").className = "sig-state bad"; wrap.querySelector("#msg").textContent = "Drained. No admin to pause it, no undo — billions have been lost exactly like this."; } }, 200); };
          wrap.querySelector("#reset").onclick = () => { if (t) { clearInterval(t); t = null; } bal = 1000; wrap.querySelector("#v").textContent = "1,000"; wrap.querySelector("#v").style.color = "var(--green)"; wrap.querySelector("#msg").className = "sig-state"; wrap.querySelector("#msg").textContent = "The code runs exactly as written — flaws included."; };
        } },
    ],
    deeper: P("It isn't ‘smart’ and isn't a ‘contract’: it's a deterministic program every node runs in lockstep, agreeing on the result. <b>Gas</b> charges for each operation, rationing the shared computer and stopping infinite loops. This powers <b>DeFi</b>, <b>NFTs</b>, and <b>DAOs</b> — all just contracts moving tokens by rules. The catch: immutable code means immutable <b>bugs</b>, and the funds sit inside the contract. ‘Code is law’ collides with the law's need to reverse fraud — billions have been lost to contract exploits.") };

  L.zk = { world: "frontier", title: "Zero-knowledge", oneliner: "Prove without revealing", icon: "◇",
    hero: "Prove you know a secret — without revealing the secret. The frontier of privacy and scaling.",
    beats: [
      { n: "01", h: "The cave game", cap: "Peggy claims she knows a secret word. Run rounds as an honest prover, then as a cheater — watch a bluffer's luck run out, while the word is never spoken.",
        build(s) { let honest = true, rounds = 0, fooled = 1; const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="btn-row"><button class="btn primary" id="zR">Run a round</button><button class="btn" id="zM">Prover: <b id="zMl">HONEST</b></button><button class="btn" id="zRs">Reset</button></div><div style="margin-top:14px"><div class="note" style="margin-bottom:6px">Victor's confidence (a cheater would be caught by now)</div><div style="height:14px;background:var(--surface-3);border-radius:99px;overflow:hidden;border:1px solid var(--line)"><div id="zB" style="height:100%;width:0;background:linear-gradient(90deg,var(--plum),var(--gold));transition:width .4s"></div></div></div><div class="log" id="zL" style="margin-top:12px"></div>`;
          s.appendChild(wrap); const log = (h, c) => { const d = el("div", c); d.innerHTML = h; wrap.querySelector("#zL").prepend(d); };
          wrap.querySelector("#zM").onclick = () => { honest = !honest; wrap.querySelector("#zMl").textContent = honest ? "HONEST" : "CHEATER"; wrap.querySelector("#zM").style.borderColor = honest ? "" : "var(--red)"; };
          wrap.querySelector("#zRs").onclick = () => { rounds = 0; fooled = 1; wrap.querySelector("#zB").style.width = "0"; wrap.querySelector("#zL").innerHTML = ""; };
          wrap.querySelector("#zR").onclick = () => { rounds++; const enter = Math.random() < .5 ? "A" : "B", ask = Math.random() < .5 ? "A" : "B"; if (honest) { log(`R${rounds}: enters ${enter}, exit ${ask} → opens the door, complies ✓`, "ok"); fooled *= .5; } else { (ask === enter) ? (log(`R${rounds}: enters ${enter}, exit ${ask} → lucky guess ✓ (50%)`, "ok"), fooled *= .5) : (log(`R${rounds}: enters ${enter}, exit ${ask} → wrong side, EXPOSED ✕`, "bad"), fooled = 0); } wrap.querySelector("#zB").style.width = ((1 - fooled) * 100).toFixed(1) + "%"; };
        } },
      { n: "02", h: "Why it matters", cap: "That one trick — prove something is true while revealing nothing else — quietly unlocks three big things.",
        build(s) { const items = [["🔒 Private payments", "Send money on a public chain while hiding the amount and the parties (Zcash)."], ["📦 zk-rollups", "Bundle thousands of transactions into one tiny proof, scaling the chain cheaply."], ["✅ Quiet compliance", "Prove you are not on a sanctions list without revealing who you are."]];
          const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>zero-knowledge in the wild</div>` + items.map(([h, d]) => `<div class="bfield" style="margin-bottom:8px"><b>${h}</b><div class="note" style="margin-top:4px;color:var(--ink-2)">${d}</div></div>`).join(""); s.appendChild(wrap);
        } },
    ],
    deeper: P("Real <b>zk-SNARKs / zk-STARKs</b> compress this into a tiny proof that ‘I ran this computation correctly’, cheap to check even when the computation was huge. That powers private payments and <b>zk-rollups</b> — bundling thousands of transactions off-chain and posting one proof to settle them, scaling the chain without trusting anyone. Privacy-preserving compliance is the policy frontier: prove you're not on a sanctions list without revealing your identity.") };

  L.money = { world: "frontier", title: "Money & the state", oneliner: "Stablecoins, CBDCs", icon: "$",
    hero: "The same technology can free money from the state — or hand the state perfect control. It's a spectrum.",
    beats: [
      { n: "01", h: "Slide from freedom to control", cap: "Drag from permissionless crypto to a state-issued CBDC. Same digital money, opposite valence.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<input type="range" id="spR" min="0" max="100" value="20" style="width:100%"><div style="display:flex;justify-content:space-between;margin-top:8px"><span class="note" style="color:var(--green)">permissionless</span><span class="note" style="color:var(--red)">state-controlled</span></div><div class="fcard" id="spCard" style="margin-top:16px;background:var(--surface-2)"></div>`;
          s.appendChild(wrap); const ex = [{ at: 0, t: "Bitcoin", d: "No issuer, no off switch, censorship-resistant. The hardest money for any state to touch." }, { at: 30, t: "Stablecoin (USDC)", d: "A private issuer holds dollar reserves and can freeze addresses. Centralised, but on a public chain." }, { at: 70, t: "e-CNY / e-Rupee", d: "Issued by the central bank: centralised, permissioned, visible to the state. The opposite end from Bitcoin." }, { at: 100, t: "Programmable CBDC", d: "Money with rules baked in — expiry dates, spending limits, conditional transfers. Powerful, and a civil-liberties flashpoint." }];
          const cardEl = wrap.querySelector("#spCard"), R = wrap.querySelector("#spR");
          function render(v) { let pick = ex[0]; for (const e of ex) if (v >= e.at - 15) pick = e; cardEl.innerHTML = `<h3 style="font-family:var(--disp);font-weight:500;font-size:22px;margin-bottom:6px;color:var(--plum)">${pick.t}</h3><p class="note" style="font-size:13.5px;color:var(--ink-2);line-height:1.5">${pick.d}</p><div class="note" style="margin-top:10px;font-family:var(--mono)">decentralisation ${100 - v}% · state control ${v}%</div>`; }
          R.oninput = e => render(+e.target.value); render(20);
        } },
      { n: "02", h: "How a stablecoin holds its peg", cap: "A stablecoin is built to stay worth one dollar. There are three ways to try — and they are not equally safe.",
        build(s) { const items = [["Fiat-backed", "One real dollar in a reserve per token (USDC, Tether).", "safest — if the reserve is truly there", "var(--green)"], ["Crypto-backed", "Over-collateralised with volatile crypto (DAI).", "needs a buffer against price swings", "var(--gold-2)"], ["Algorithmic", "Held up only by code and incentives, no full backing.", "fragile — Terra collapsed to zero", "var(--red)"]];
          const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>three ways to hold a peg</div>` + items.map(([h, d, n, c]) => `<div class="bfield" style="margin-bottom:8px;border-color:${c}"><b>${h}</b><div class="note" style="margin-top:4px;color:var(--ink-2)">${d}</div><div class="note" style="margin-top:4px;color:${c}">${n}</div></div>`).join(""); s.appendChild(wrap);
        } },
    ],
    deeper: P("<b>Stablecoins</b> hold a peg — fiat-backed (a dollar in reserve), crypto-backed (over-collateralised), or algorithmic (held by code, and fragile — Terra collapsed). A <b>CBDC</b> is a central bank's own digital currency, and technically the opposite of crypto: centralised, permissioned, fully controlled. The through-line of the whole course: take the referee out and you get money no state can freeze; hand the state the keys and you get the most controllable money in history. The policy question is never the tech — it's who holds the keys.") };

  L.tokens = { world: "frontier", title: "Tokens & NFTs", oneliner: "Anything you can count or own", icon: "◎",
    hero: "Once a chain can run code, it can track more than coins. A token is just an entry in a contract's ledger — and an NFT is a token that is one of a kind.",
    beats: [
      { n: "01", h: "Mint and move tokens", cap: "A token is just a row in a contract saying how many you hold. Mint some and send them around — the contract keeps the count.",
        build(s) { let bal = { You: 0, Bob: 0, Carol: 0 }; const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>a token contract</div><div class="kvs" id="t"></div><div class="btn-row" style="margin-top:14px"><button class="btn primary" id="mint">Mint 10 to you</button><button class="btn" id="send">Send 5 to Bob</button><button class="btn" id="reset">Reset</button></div>`;
          s.appendChild(wrap); function draw() { wrap.querySelector("#t").innerHTML = Object.entries(bal).map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v ${v > 0 ? "gr" : ""}">${v} TOKEN</span></div>`).join(""); wrap.querySelector("#send").disabled = bal.You < 5; }
          wrap.querySelector("#mint").onclick = () => { bal.You += 10; draw(); }; wrap.querySelector("#send").onclick = () => { if (bal.You >= 5) { bal.You -= 5; bal.Bob += 5; draw(); } }; wrap.querySelector("#reset").onclick = () => { bal = { You: 0, Bob: 0, Carol: 0 }; draw(); }; draw();
        } },
      { n: "02", h: "Make each one unique", cap: "Give every token its own id and it becomes <b>non-fungible</b> — an NFT. The chain proves who owns that exact one. Tap to claim them.",
        build(s) { const items = [["🎨", "#1"], ["🎟️", "#2"], ["🪙", "#3"], ["🖼️", "#4"], ["🎮", "#5"], ["🎵", "#6"]]; const owner = {}; const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>unique tokens (NFTs)</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px" id="g"></div>`;
          s.appendChild(wrap); function draw() { wrap.querySelector("#g").innerHTML = ""; items.forEach((it, i) => { const mine = owner[i]; const c = el("div", "bfield", `<div style="font-size:26px;text-align:center">${it[0]}</div><div class="note" style="text-align:center;margin-top:4px">${it[1]}</div><div class="note" style="text-align:center;color:${mine ? "var(--green)" : "var(--ink-4)"}">${mine ? "owned by you" : "unclaimed"}</div>`); c.style.cssText = "cursor:pointer" + (mine ? ";border-color:var(--green)" : ""); c.onclick = () => { owner[i] = !owner[i]; draw(); }; wrap.querySelector("#g").appendChild(c); }); } draw();
        } },
    ],
    deeper: P("Most tokens follow standards (ERC-20 for fungible, ERC-721 for NFTs) so any wallet or exchange can handle them the same way. The token itself is just bookkeeping inside a contract; an NFT usually <i>points</i> to an image or asset stored elsewhere — which is why ‘what exactly do you own’ is a real and often misunderstood question.") };

  L.wallets = { world: "frontier", title: "Wallets & custody", oneliner: "Who holds the keys", icon: "❖",
    hero: "A wallet does not hold coins. It holds keys. The coins are entries on the chain — your key is just what proves they are yours.",
    beats: [
      { n: "01", h: "A wallet is a key, not a vault", cap: "From one secret phrase, a wallet derives all your keys and addresses. The balance lives on the chain; the wallet just unlocks it.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>from seed phrase to addresses</div><div class="bfield" style="border-color:var(--red)"><div class="k" style="color:var(--red)">seed phrase · the master secret</div><div class="v" id="seed" style="color:var(--red)">·············</div></div><div style="text-align:center;color:var(--gold-2);margin:8px 0">↓ derives ↓</div><div id="addrs"></div><button class="btn primary block" id="gen" style="margin-top:12px">Generate a wallet</button>`;
          s.appendChild(wrap); const words = ["ocean", "maple", "silver", "tiger", "amber", "ginger", "violet", "harbor", "cedar", "ribbon"];
          wrap.querySelector("#gen").onclick = () => { const seed = Array.from({ length: 4 }, () => words[Math.floor(Math.random() * words.length)]).join(" "); wrap.querySelector("#seed").textContent = seed; const base = sha256(seed); wrap.querySelector("#addrs").innerHTML = [0, 1, 2].map(i => `<div class="bfield" style="margin-bottom:6px"><div class="k">address ${i + 1}</div><div class="v gr">0x${sha256(base + i).slice(-16)}</div></div>`).join(""); };
        } },
      { n: "02", h: "Not your keys, not your coins", cap: "Hold the keys yourself and no one can freeze you — but lose them and they are gone. Let an exchange hold them and it is easy — until it freezes or fails. Flip between the two.",
        build(s) { let self = true; const wrap = el("div", "fcard"); s.appendChild(wrap);
          function draw() { wrap.innerHTML = `<div class="btn-row" style="margin-bottom:14px"><button class="btn${self ? " primary" : ""}" id="a">You hold the keys</button><button class="btn${self ? "" : " primary"}" id="b">An exchange holds them</button></div><div class="sig-state ${self ? "ok" : "bad"}">${self ? "Self-custody: you control the keys. No one can freeze or seize your coins — but there is no reset if you lose the phrase." : "Custodial: the exchange controls the keys. Easy to use and recover — but it can freeze you, and if it collapses (as FTX did), your coins can vanish with it."}</div>`;
            wrap.querySelector("#a").onclick = () => { self = true; draw(); }; wrap.querySelector("#b").onclick = () => { self = false; draw(); }; } draw();
        } },
    ],
    deeper: P("This is the trade-off behind ‘not your keys, not your coins’. Self-custody gives you sovereignty and full responsibility; custodial services give you convenience and a recovery path, at the cost of trusting them — the very intermediary blockchains were built to remove. Most regulation targets these custodians, because they are the one place a government can actually apply pressure.") };

  L.layer2 = { world: "frontier", title: "Layer 2 & scaling", oneliner: "Doing more without breaking it", icon: "⏫",
    hero: "A secure, decentralised chain is slow on purpose — every computer re-checks every transaction. Layer 2 buys back the speed without giving that up.",
    beats: [
      { n: "01", h: "The base chain is slow on purpose", cap: "Because thousands of computers each verify every transaction, throughput stays low. Here is the gap Layer 2 has to close.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>transactions per second</div><div id="bars"></div>`;
          s.appendChild(wrap); const rows = [["Bitcoin", 7, "var(--gold-2)"], ["Ethereum", 15, "var(--plum)"], ["Visa", 1700, "var(--green)"]];
          wrap.querySelector("#bars").innerHTML = rows.map(([n, v, c]) => `<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:13.5px"><b>${n}</b><span class="mono">${v.toLocaleString()}/s</span></div><div style="height:14px;background:var(--surface-3);border-radius:99px;overflow:hidden;margin-top:4px"><div style="height:100%;width:${Math.max(3, Math.log10(v + 1) / Math.log10(1701) * 100)}%;background:${c};border-radius:99px"></div></div></div>`).join("") + `<div class="note" style="margin-top:8px">Log scale — Visa dwarfs base-layer chains. That gap is the whole job of Layer 2.</div>`;
        } },
      { n: "02", h: "Roll thousands into one", cap: "A rollup runs the transactions off to the side, then posts a single summary back to the secure main chain. Pile some up and roll them.",
        build(s) { let pending = 0, posted = 0; const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>rollup batcher</div><div style="text-align:center"><div class="metric"><span class="n" id="p">0</span> <span class="u">waiting off-chain</span></div></div><div class="btn-row" style="justify-content:center;margin:14px 0"><button class="btn" id="add">+ 100 transactions</button><button class="btn primary" id="batch">Roll up &amp; post one proof →</button></div><div id="ch"></div><div class="note" id="msg" style="text-align:center;margin-top:8px"></div>`;
          s.appendChild(wrap); wrap.querySelector("#add").onclick = () => { pending += 100; wrap.querySelector("#p").textContent = pending; };
          wrap.querySelector("#batch").onclick = () => { if (!pending) return; const did = pending; posted += pending; wrap.querySelector("#ch").innerHTML = `<div class="xblock" style="max-width:240px;margin:8px auto 0"><div class="xtop"></div><div class="xpad"><div class="xh"><span class="xn">L1</span><span class="xs">1 proof</span></div><div class="xseg"><div class="xlbl">settles in one block</div><div class="xv gr">${posted.toLocaleString()} transactions</div></div><div class="xseal"><span class="lk">🔒</span><span class="sv">${short(sha256("batch" + posted), 9, 5)}</span></div></div></div>`; wrap.querySelector("#msg").innerHTML = `<span style="color:var(--green)">${did} transactions settled on the main chain with a single proof.</span>`; pending = 0; wrap.querySelector("#p").textContent = 0; };
        } },
    ],
    deeper: P("Two main flavours. <b>Optimistic rollups</b> assume each batch is valid and allow a challenge window to prove fraud. <b>zk-rollups</b> attach a cryptographic proof that the batch is valid (the zero-knowledge maths from the next lesson), so there is nothing to dispute. Either way the heavy work happens off-chain and only a tiny summary touches the expensive, secure base layer — buying scale without selling decentralisation or security.") };

  /* ===================== PRIMER (start here) ===================== */
  L.whatis = { world: "primer", title: "What is a blockchain?", oneliner: "The whole idea, in one screen", icon: "◧",
    hero: "Forget the buzzwords. A blockchain is a list of blocks, copied across many computers, that nobody can quietly rewrite. Let us build that picture.",
    beats: [
      { n: "01", h: "A block holds records", cap: "Start with one <b>block</b> — just a box that holds a list of records, like a page in a notebook. Add a few and watch its fingerprint at the bottom change.",
        build(s) { const recs = ["Alice → Bob: 5 coins", "Carol → Dan: 2 coins", "Eve → Finn: 8 coins", "Gail → Hank: 1 coin"];
          const wrap = el("div", ""); wrap.innerHTML = `<div class="bigblock"><div class="bt"></div><div class="bp"><div class="bn">Block #1</div><div class="brow"><div class="k">records inside</div><div class="v" id="recs"></div></div><div class="brow"><div class="k">fingerprint that seals it</div><div class="v" style="color:var(--gold-2)" id="seal"></div></div></div></div><div class="btn-row" style="justify-content:center;margin-top:16px"><button class="btn" id="add">+ Add a record</button></div>`;
          s.appendChild(wrap); let list = recs.slice(0, 2), i = 2;
          function draw() { wrap.querySelector("#recs").innerHTML = list.map(r => `<div style="padding:3px 0">${r}</div>`).join(""); wrap.querySelector("#seal").textContent = short(sha256(list.join("|")), 18, 10); }
          wrap.querySelector("#add").onclick = () => { list.push(i < recs.length ? recs[i++] : "Someone → Someone: " + (1 + Math.floor(Math.random() * 9)) + " coins"); draw(); }; draw();
        } },
      { n: "02", h: "Chain the blocks together", cap: "Each block writes down the <b>fingerprint of the block before it</b> (follow the arrows). That backward link is the whole reason it is called a <i>chain</i>. Add a few.",
        build(s) { const c = richChain(s, { blocks: [{ data: "Genesis block" }, { data: "Alice → Bob: 5" }, { data: "Carol → Dan: 2" }], editable: false, diff: 2 });
          const row = el("div", "btn-row"); row.style.cssText = "justify-content:center;margin-top:8px"; const b = el("button", "btn primary", "+ Add a block"); let i = 0; const tx = ["Dan → Eve: 3", "Eve → Finn: 8", "Finn → Gail: 2", "Gail → Hank: 6"]; b.onclick = () => c.addBlock(tx[i++ % tx.length]); row.appendChild(b); s.appendChild(row); } },
      { n: "03", h: "And everyone keeps a copy", cap: "There is no master copy. The exact same chain lives on thousands of computers. Try to tamper with one — the others simply <b>out-vote</b> it.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>the same chain, everywhere</div><div class="copies" id="cps"></div><div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn danger" id="tamper">Tamper with one copy</button><button class="btn" id="reset">Reset</button></div><div class="note" id="msg" style="text-align:center;margin-top:12px">All copies agree on the same history.</div>`;
          s.appendChild(wrap); const N = 6; let bad = -1;
          function draw() { const g = wrap.querySelector("#cps"); g.innerHTML = ""; for (let i = 0; i < N; i++) { const t = i === bad; const node = el("div", "cnode" + (t ? " bad" : "")); node.innerHTML = `<div class="nlabel">computer ${i + 1}</div><div class="minichain">${[0, 1, 2, 3].map(k => `<div class="mb${t && k === 2 ? " tampered" : ""}"></div>`).join("")}</div>`; g.appendChild(node); } }
          wrap.querySelector("#tamper").onclick = () => { bad = Math.floor(Math.random() * N); draw(); wrap.querySelector("#msg").innerHTML = `<span style="color:var(--red)">Computer ${bad + 1} now disagrees with the other ${N - 1}. The majority wins, so the lie is ignored.</span>`; };
          wrap.querySelector("#reset").onclick = () => { bad = -1; draw(); wrap.querySelector("#msg").textContent = "All copies agree on the same history."; }; draw();
        } },
    ],
    deeper: P("That is the entire mental model: <b>blocks</b> of records, <b>chained</b> by fingerprints, <b>copied</b> across a whole network. The clever part is not any single piece — it is that together they let strangers keep one shared, tamper-proof record without trusting anyone in charge. Everything else in this course is just <i>how</i> each of those three words actually works.") };

  L.why = { world: "primer", title: "Why do we need it?", oneliner: "The problem it solves", icon: "?",
    hero: "Why go to all this trouble? Because handing your records to a single keeper has real costs — and sometimes you cannot.",
    beats: [
      { n: "01", h: "Today, a middleman holds the record", cap: "To send money, it runs through a bank. You trust them to keep the ledger honest, available, and yours.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;gap:20px;padding:22px 0"><div style="text-align:center"><div style="font-size:38px">🧑</div><div class="note">you</div></div><div style="color:var(--ink-3);font-size:22px">→</div><div style="text-align:center"><div style="font-size:38px">🏦</div><div class="note">bank<br>holds the only ledger</div></div><div style="color:var(--ink-3);font-size:22px">→</div><div style="text-align:center"><div style="font-size:38px">🧑</div><div class="note">friend</div></div></div><div class="note" style="text-align:center;font-size:14px">Every payment passes through a keeper you have to trust.</div>`; s.appendChild(wrap); } },
      { n: "02", h: "But one keeper is one weak point", cap: "Everything sits with a single party. Press the buttons — a frozen account or a failed server, and your money is suddenly out of reach.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>the bank's ledger</div><div class="kvs"><div class="kv"><span class="k">your balance</span><span class="v gr" id="bal">20 coins</span></div></div><div class="btn-row" style="margin-top:14px"><button class="btn danger" id="freeze">Freeze the account</button><button class="btn danger" id="fail">Server fails</button><button class="btn" id="reset">Reset</button></div><div class="sig-state" id="msg" style="margin-top:12px">Your money sits with one keeper.</div>`;
          s.appendChild(wrap); const setM = (t) => { wrap.querySelector("#msg").className = "sig-state bad"; wrap.querySelector("#msg").textContent = t; };
          wrap.querySelector("#freeze").onclick = () => { wrap.querySelector("#bal").innerHTML = `<span style="color:var(--red)">frozen 🔒</span>`; setM("One decision, and you cannot touch your own money. There is no one to appeal to."); };
          wrap.querySelector("#fail").onclick = () => { wrap.querySelector("#bal").innerHTML = `<span style="color:var(--red)">— gone —</span>`; setM("The only copy is gone. A single point of failure took everything with it."); };
          wrap.querySelector("#reset").onclick = () => { wrap.querySelector("#bal").textContent = "20 coins"; wrap.querySelector("#bal").className = "v gr"; wrap.querySelector("#msg").className = "sig-state"; wrap.querySelector("#msg").textContent = "Your money sits with one keeper."; };
        } },
      { n: "03", h: "Blockchain removes the keeper", cap: "Spread the same record across everyone. Now no single party can freeze you, and no single failure can erase it. Try to freeze it — nothing happens.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>the same balance, on every computer</div><div class="copies" id="cps"></div><div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn danger" id="freeze">Try to freeze it</button></div><div class="note" id="msg" style="text-align:center;margin-top:12px">Your balance lives on all of them at once.</div>`;
          s.appendChild(wrap); const N = 6; function draw() { wrap.querySelector("#cps").innerHTML = Array.from({ length: N }, (_, i) => `<div class="cnode"><div class="nlabel">computer ${i + 1}</div><div class="minichain">${[0, 1, 2].map(() => `<div class="mb"></div>`).join("")}</div></div>`).join(""); }
          wrap.querySelector("#freeze").onclick = () => { wrap.querySelector("#msg").innerHTML = `<span style="color:var(--green)">There is no single keeper to lean on. To freeze you, someone would have to seize a majority of the world's computers at once — practically impossible.</span>`; }; draw();
        } },
    ],
    deeper: P("This is the real pitch, stripped of hype: blockchain trades a <i>trusted</i> keeper for a <i>trustless</i> system. You give up the convenience of someone to call when things go wrong, and in return you get money — or records — that no single party can censor, freeze, or quietly alter. Whether that trade is worth it depends entirely on the use case, which is the honest question to ask of any blockchain pitch.") };

  L.tour = { world: "primer", title: "The life of a payment", oneliner: "How it all fits together", icon: "↗",
    hero: "Before the details, watch the whole machine work. Follow one payment from your fingertips to the permanent record, in five steps.",
    beats: [
      { n: "01", h: "Step through it", cap: "Click through the journey of a single payment. Each step is its own lesson later — this is just the map.",
        build(s) { const steps = [
            { ic: "✍️", t: "You sign a payment", d: "You use your secret key to authorise ‘send 5 coins to Bob’. Only you can sign it, but anyone can check that you did." },
            { ic: "📥", t: "It joins the waiting pool", d: "Your signed payment is broadcast to the network and waits in a shared pool with everyone else's pending payments." },
            { ic: "⛏️", t: "A miner seals it into a block", d: "A miner scoops up a batch of waiting payments, packs them into a block, and burns real effort to seal it shut." },
            { ic: "⛓️", t: "The block joins the chain", d: "The new block points back to the previous one and locks onto the end of the chain. Your payment is now on the record." },
            { ic: "🌍", t: "Every copy updates", d: "Every computer adds the same block. With a few more stacked on top, your payment is final — there are no take-backs." },
          ];
          let i = 0; const wrap = el("div", "fcard"); s.appendChild(wrap);
          function draw() { const st = steps[i]; wrap.innerHTML = `<div style="text-align:center;padding:16px 0"><div style="font-size:50px">${st.ic}</div><div style="font-family:var(--disp);font-weight:500;font-size:25px;color:var(--plum);margin-top:12px">${st.t}</div><p class="note" style="font-size:15px;color:var(--ink-2);max-width:450px;margin:12px auto 0;line-height:1.55">${st.d}</p></div><div style="display:flex;gap:6px;justify-content:center;margin:14px 0">${steps.map((_, k) => `<div style="width:34px;height:5px;border-radius:99px;background:${k <= i ? "var(--plum)" : "var(--surface-3)"};transition:background .3s"></div>`).join("")}</div><div class="btn-row" style="justify-content:center"><button class="btn" id="prev" ${i === 0 ? "disabled" : ""}>← Back</button><button class="btn primary" id="next">${i < steps.length - 1 ? "Next step →" : "Start over"}</button></div>`;
            wrap.querySelector("#prev").onclick = () => { if (i > 0) { i--; draw(); } }; wrap.querySelector("#next").onclick = () => { i = i < steps.length - 1 ? i + 1 : 0; draw(); }; }
          draw();
        } },
    ],
    deeper: P("Those five steps map onto the rest of this course: <b>signing</b> is the Cryptography world, <b>packing a block</b> and <b>sealing it with work</b> are Building the Chain, and <b>every copy agreeing</b> is the Consensus world. If you remember nothing else, remember this loop — sign, pool, seal, link, agree — repeating roughly every ten minutes, forever.") };

  /* ===================== CAPSTONE ===================== */
  L.recap = { world: "capstone", title: "The whole machine", oneliner: "Everything, running together", icon: "★",
    hero: "You have built every part by hand. Here is the finished machine — keep mining blocks and watch the chain you understand grow.",
    beats: [
      { n: "01", h: "Run the chain", cap: "Mine block after block. You now know exactly what each one means: bundled records, sealed by work, linked to the past, copied to all.",
        build(s) { const c = richChain(s, { blocks: [{ data: "Genesis" }, { data: "Alice → Bob: 5" }], editable: false, diff: 2 });
          const row = el("div", "btn-row"); row.style.cssText = "justify-content:center;margin-top:8px"; const b = el("button", "btn primary", "+ Mine the next block"); let i = 0; const tx = ["Bob → Carol: 3", "Carol → Dan: 7", "Dan → Eve: 2", "Eve → Finn: 9", "Finn → Gail: 4", "Gail → Hank: 6"]; b.onclick = () => c.addBlock(tx[i++ % tx.length]); row.appendChild(b); s.appendChild(row); } },
      { n: "02", h: "Everything you built", cap: "Seven ideas, one machine. Each was a lesson; together they let strangers agree on one history with no one in charge.",
        build(s) { const items = [["A hash", "a fingerprint you cannot reverse"], ["Keys", "a secret that proves what is yours"], ["A block", "records bundled and sealed shut"], ["Mining", "work that makes sealing expensive"], ["The chain", "links that lock the past in place"], ["Consensus", "the chain with the most work wins"], ["Stake or work", "lying always costs more than it pays"]];
          const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>the journey, in one line each</div>` + items.map(([h, d]) => `<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)"><span style="color:var(--gold-2);font-weight:700;font-family:var(--mono)">→</span><div><b style="color:var(--ink)">${h}</b> <span class="note">— ${d}</span></div></div>`).join(""); s.appendChild(wrap); } },
    ],
    deeper: P("The point was never the coin. It was a way for people who do not trust each other to agree on one shared record without a referee. Take the referee out and you get money no state can freeze; hand a state the keys and you get the most controllable money in history. Same machine, opposite valence — which is exactly why the policy questions are so hard.") };

  return L;
})();
