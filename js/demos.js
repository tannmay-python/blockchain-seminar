/* ============================================================
   demos.js — every interactive component for the seminar.
   Each init function renders into its container element.
   Depends on window.sha256 (pure-JS) and optionally crypto.subtle.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const short = (h, n = 10) => h.slice(0, n) + "…" + h.slice(-4);

  /* ---------------------------------------------------------
     HERO CHAIN
  --------------------------------------------------------- */
  (function heroChain() {
    const c = $("heroChain"); if (!c) return;
    for (let i = 0; i < 5; i++) {
      const b = el("div", "blk", "#" + i);
      b.style.animationDelay = (i * 0.3) + "s";
      c.appendChild(b);
      if (i < 4) { const l = el("div", "lnk"); l.style.animationDelay = (i * 0.3) + "s"; c.appendChild(l); }
    }
  })();

  /* ---------------------------------------------------------
     NETWORK / DISTRIBUTED LEDGER
  --------------------------------------------------------- */
  (function network() {
    const host = $("networkDemo"); if (!host) return;
    const W = 760, H = 300;
    const nodes = [
      { x: 130, y: 80 }, { x: 380, y: 50 }, { x: 630, y: 90 },
      { x: 90, y: 220 }, { x: 320, y: 250 }, { x: 560, y: 235 }, { x: 690, y: 200 }
    ];
    const edges = [[0,1],[1,2],[0,3],[1,4],[2,6],[3,4],[4,5],[5,6],[2,5],[0,4]];
    let ledger = 3; // blocks confirmed on every node

    host.innerHTML = `
      <svg class="viz-svg" viewBox="0 0 ${W} ${H}" id="netSvg"></svg>
      <div class="flex gap wrap mt" style="align-items:center">
        <button class="btn" id="netBroadcast">📡 Broadcast a transaction</button>
        <span class="note" id="netStatus">Network synced · all nodes at block #${ledger}</span>
      </div>`;
    const svg = $("netSvg");
    const NS = "http://www.w3.org/2000/svg";
    edges.forEach(([a, b]) => {
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", nodes[a].x); l.setAttribute("y1", nodes[a].y);
      l.setAttribute("x2", nodes[b].x); l.setAttribute("y2", nodes[b].y);
      l.setAttribute("stroke", "#1f2a45"); l.setAttribute("stroke-width", "1.5");
      l.dataset.edge = a + "-" + b; svg.appendChild(l);
    });
    nodes.forEach((n, i) => {
      const g = document.createElementNS(NS, "g");
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", n.x); c.setAttribute("cy", n.y); c.setAttribute("r", 20);
      c.setAttribute("fill", "#0e1424"); c.setAttribute("stroke", "#34e1d4"); c.setAttribute("stroke-width", "2");
      c.dataset.node = i;
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", n.x); t.setAttribute("y", n.y + 4); t.setAttribute("text-anchor", "middle");
      t.setAttribute("fill", "#93a1bf"); t.setAttribute("font-size", "11"); t.setAttribute("font-family", "monospace");
      t.textContent = "#" + ledger; t.dataset.label = i;
      g.appendChild(c); g.appendChild(t); svg.appendChild(g);
    });

    function flash(nodeEl, delay) {
      setTimeout(() => {
        nodeEl.setAttribute("stroke", "#ffcf6b");
        nodeEl.setAttribute("r", 24);
        setTimeout(() => { nodeEl.setAttribute("stroke", "#34e1d4"); nodeEl.setAttribute("r", 20); }, 350);
      }, delay);
    }
    $("netBroadcast").onclick = () => {
      ledger++;
      $("netStatus").textContent = "Propagating new block…";
      const order = [4, 1, 3, 0, 5, 2, 6]; // BFS-ish from a random origin
      order.forEach((idx, step) => {
        const circle = svg.querySelector(`circle[data-node="${idx}"]`);
        const label = svg.querySelector(`text[data-label="${idx}"]`);
        flash(circle, step * 160);
        setTimeout(() => { label.textContent = "#" + ledger; }, step * 160 + 180);
      });
      setTimeout(() => { $("netStatus").textContent = `Network synced · all nodes at block #${ledger}`; }, order.length * 160 + 400);
    };
  })();

  /* ---------------------------------------------------------
     HASH PLAYGROUND  (live SHA-256 + avalanche)
  --------------------------------------------------------- */
  (function hashPlayground() {
    const host = $("hashPlayground"); if (!host) return;
    host.innerHTML = `
      <div class="grid-2" style="gap:18px">
        <div>
          <label class="fld">Input A</label>
          <textarea id="hpA" rows="3">The quick brown fox</textarea>
          <div class="hash mt-s" id="hpHashA"></div>
        </div>
        <div>
          <label class="fld">Input B (try changing one letter)</label>
          <textarea id="hpB" rows="3">The quick brown fix</textarea>
          <div class="hash mt-s" id="hpHashB"></div>
        </div>
      </div>
      <div class="flex gap wrap mt" style="align-items:center">
        <span class="pill cy">avalanche effect</span>
        <span class="note" id="hpDiff"></span>
      </div>
      <div class="bitgrid" id="hpBits" title="Each square is one of 256 output bits. Red = differs between A and B."></div>`;
    const A = $("hpA"), B = $("hpB"), ha = $("hpHashA"), hb = $("hpHashB"), diff = $("hpDiff"), grid = $("hpBits");
    for (let i = 0; i < 256; i++) grid.appendChild(el("div", "b"));
    const cells = grid.children;
    function render() {
      const da = sha256(A.value), db = sha256(B.value);
      ha.textContent = da; hb.textContent = db;
      const ba = sha256.toBits(da), bb = sha256.toBits(db);
      let d = 0;
      for (let i = 0; i < 256; i++) {
        const diffBit = ba[i] !== bb[i];
        cells[i].classList.toggle("diff", diffBit);
        if (diffBit) d++;
      }
      diff.innerHTML = `<strong style="color:var(--cyan)">${d} / 256</strong> output bits differ (${(d/256*100).toFixed(0)}%). The inputs differ by as little as one character.`;
    }
    A.oninput = render; B.oninput = render; render();
  })();

  /* ---------------------------------------------------------
     INTERACTIVE BLOCKCHAIN
  --------------------------------------------------------- */
  (function blockchain() {
    const host = $("chainDemo"); if (!host) return;
    let difficulty = 3;
    const GENESIS_PREV = "0".repeat(64);
    let blocks = [
      { data: "Genesis block", nonce: 0 },
      { data: "Alice → Bob: 5 BTC", nonce: 0 },
      { data: "Bob → Carol: 2 BTC", nonce: 0 }
    ];

    function target() { return "0".repeat(difficulty); }
    function blockHash(b, prevHash) { return sha256(b.data + prevHash + b.nonce); }

    function mine(b, prevHash) {
      b.nonce = 0;
      let h = blockHash(b, prevHash);
      const t = target();
      while (!h.startsWith(t)) { b.nonce++; h = blockHash(b, prevHash); }
      return h;
    }

    function recomputeAll(remine) {
      let prev = GENESIS_PREV;
      blocks.forEach((b) => {
        if (remine) mine(b, prev);
        b.prevHash = prev;
        b.hash = blockHash(b, prev);
        prev = b.hash;
      });
    }

    function render() {
      let prev = GENESIS_PREV;
      host.innerHTML = "";
      blocks.forEach((b, i) => {
        const curHash = blockHash(b, prev);
        const linkOk = b.prevHash === (i === 0 ? GENESIS_PREV : blocks[i - 1].hash);
        const meetsDiff = curHash.startsWith(target());
        // a block is "valid" if its stored prevHash matches the actual previous hash AND it meets difficulty
        const prevActual = i === 0 ? GENESIS_PREV : blocks[i - 1].hash;
        const valid = (b.prevHash === prevActual) && meetsDiff && (b.hash === curHash);
        prev = b.hash;

        const wrap = el("div", "chain-block-wrap");
        const card = el("div", "block" + (valid ? "" : " invalid"));
        card.innerHTML = `
          <div class="bhdr"><span class="idx">Block #${i}</span><span>${valid ? "✅ valid" : "⛔ broken"}</span></div>
          <label class="fld">Data</label>
          <textarea data-i="${i}" rows="2">${b.data.replace(/</g, "&lt;")}</textarea>
          <div class="row"><div class="k">Nonce</div><div class="v nonce">${b.nonce}</div></div>
          <div class="row"><div class="k">Prev hash</div><div class="v">${short(b.prevHash)}</div></div>
          <div class="row"><div class="k">Hash</div><div class="v hash-out">${short(curHash)}</div></div>
          <div class="mt-s"><button class="btn ghost" data-mine="${i}" style="font-size:12px;padding:7px 12px">⛏ Re-mine</button></div>`;
        if (i < blocks.length - 1) card.appendChild(el("div", "connector"));
        wrap.appendChild(card);
        host.appendChild(wrap);
      });

      host.querySelectorAll("textarea[data-i]").forEach((ta) => {
        ta.oninput = () => {
          const i = +ta.dataset.i;
          blocks[i].data = ta.value;
          // recompute stored hashes WITHOUT re-mining (so the break is visible)
          let p = GENESIS_PREV;
          blocks.forEach((b, j) => { b.prevHash = b.prevHash; b.hash = blockHash(b, b.prevHash); });
          renderPreserveFocus(i, ta.selectionStart);
        };
      });
      host.querySelectorAll("button[data-mine]").forEach((btn) => {
        btn.onclick = () => {
          const i = +btn.dataset.mine;
          // re-mine this and everything after it (cascade), re-linking prev hashes
          let p = i === 0 ? GENESIS_PREV : blocks[i - 1].hash;
          for (let j = i; j < blocks.length; j++) {
            mine(blocks[j], p);
            blocks[j].prevHash = p;
            blocks[j].hash = blockHash(blocks[j], p);
            p = blocks[j].hash;
          }
          render();
        };
      });
    }

    function renderPreserveFocus(focusIdx, caret) {
      render();
      const ta = host.querySelector(`textarea[data-i="${focusIdx}"]`);
      if (ta) { ta.focus(); try { ta.setSelectionRange(caret, caret); } catch (e) {} }
    }

    // init: mine everything once so the chain starts valid
    recomputeAll(true);
    render();

    $("diffSlider").oninput = (e) => {
      difficulty = +e.target.value;
      $("diffLabel").textContent = difficulty;
    };
    $("mineAll").onclick = () => { recomputeAll(true); render(); };
    $("addBlock").onclick = () => {
      const p = blocks.length ? blocks[blocks.length - 1].hash : GENESIS_PREV;
      const nb = { data: "New transaction #" + blocks.length, nonce: 0 };
      mine(nb, p); nb.prevHash = p; nb.hash = blockHash(nb, p);
      blocks.push(nb); render();
      host.scrollLeft = host.scrollWidth;
    };
  })();

  /* ---------------------------------------------------------
     DIGITAL SIGNATURES  (real ECDSA via Web Crypto when available)
  --------------------------------------------------------- */
  (function signatures() {
    const host = $("sigDemo"); if (!host) return;
    const hasSubtle = !!(window.crypto && window.crypto.subtle && window.crypto.subtle.generateKey);
    host.innerHTML = `
      <div class="grid-2" style="gap:18px">
        <div>
          <label class="fld">Message to sign</label>
          <input type="text" id="sigMsg" value="Pay Bob 5 BTC" />
          <div class="flex gap mt-s wrap">
            <button class="btn" id="sigKeygen">🔑 Generate keypair</button>
            <button class="btn ghost" id="sigSign" disabled>✍️ Sign</button>
            <button class="btn ghost" id="sigVerify" disabled>✔ Verify</button>
          </div>
          <p class="note mt-s">${hasSubtle ? "Using real <code>ECDSA&nbsp;P-256</code> via the Web Crypto API." : "Concept mode (no secure context): signature = hash(privkey ‖ message)."}</p>
        </div>
        <div>
          <label class="fld">Public key</label><div class="hash" id="sigPub" style="font-size:11px">—</div>
          <label class="fld mt-s">Signature</label><div class="hash" id="sigSigOut" style="font-size:11px">—</div>
          <div class="sig-state" id="sigState">Generate a keypair to begin.</div>
        </div>
      </div>`;
    const msg = $("sigMsg"), pubEl = $("sigPub"), sigEl = $("sigSigOut"), state = $("sigState");
    let keys = null, pubHex = "", signature = null, signedMessage = "";

    function buf2hex(buf) { return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join(""); }
    function setState(txt, cls) { state.textContent = txt; state.className = "sig-state" + (cls ? " " + cls : ""); }

    $("sigKeygen").onclick = async () => {
      signature = null; sigEl.textContent = "—";
      if (hasSubtle) {
        keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
        const raw = await crypto.subtle.exportKey("raw", keys.publicKey);
        pubHex = buf2hex(raw);
      } else {
        keys = { priv: sha256("priv" + Math.random()) };
        pubHex = sha256(keys.priv); // "public" = hash of private (one-way), concept only
      }
      pubEl.textContent = short(pubHex, 24);
      $("sigSign").disabled = false; $("sigVerify").disabled = true;
      setState("Keypair ready. Now sign the message.", "");
    };
    $("sigSign").onclick = async () => {
      signedMessage = msg.value;
      if (hasSubtle) {
        const data = new TextEncoder().encode(signedMessage);
        const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keys.privateKey, data);
        signature = sig; sigEl.textContent = short(buf2hex(sig), 24);
      } else {
        signature = sha256(keys.priv + signedMessage); sigEl.textContent = short(signature, 24);
      }
      $("sigVerify").disabled = false;
      setState("Signed. Now change the message and verify — the signature won't match.", "");
    };
    $("sigVerify").onclick = async () => {
      if (!signature) return;
      let ok;
      if (hasSubtle) {
        const data = new TextEncoder().encode(msg.value);
        ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, keys.publicKey, signature, data);
      } else {
        ok = signature === sha256(keys.priv + msg.value);
      }
      if (ok) setState("✔ VALID — the signature matches this message and public key.", "valid");
      else setState("✘ INVALID — message was altered after signing. Tamper detected.", "invalid");
    };
  })();

  /* ---------------------------------------------------------
     MERKLE TREE + PROOF
  --------------------------------------------------------- */
  (function merkle() {
    const host = $("merkleDemo"); if (!host) return;
    const txs = ["Alice→Bob", "Bob→Carol", "Carol→Dan", "Dan→Eve", "Eve→Finn", "Finn→Gail", "Gail→Hank", "Hank→Ivy"];

    function build() {
      const levels = [];
      let level = txs.map(t => ({ hash: sha256(t), label: t }));
      levels.push(level);
      while (level.length > 1) {
        const next = [];
        for (let i = 0; i < level.length; i += 2) {
          const a = level[i], b = level[i + 1] || level[i];
          next.push({ hash: sha256(a.hash + b.hash), left: a, right: b });
        }
        levels.push(next); level = next;
      }
      return levels;
    }
    const levels = build();

    function proofPath(leafIndex) {
      // returns set of node-hashes on the path + sibling hashes (proof)
      const path = new Set(), proof = new Set();
      let idx = leafIndex;
      for (let lv = 0; lv < levels.length - 1; lv++) {
        const node = levels[lv][idx];
        path.add(node.hash);
        const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
        const sibling = levels[lv][siblingIdx] || levels[lv][idx];
        proof.add(sibling.hash);
        idx = Math.floor(idx / 2);
      }
      path.add(levels[levels.length - 1][0].hash); // root
      return { path, proof };
    }

    let selected = -1;
    function render() {
      host.innerHTML = "";
      const tree = el("div", "merkle");
      const sel = selected >= 0 ? proofPath(selected) : null;
      // render top-down (root first)
      for (let lv = levels.length - 1; lv >= 0; lv--) {
        const row = el("div", "level");
        levels[lv].forEach((node) => {
          const isRoot = lv === levels.length - 1;
          const isLeaf = lv === 0;
          let cls = "mnode" + (isRoot ? " root" : isLeaf ? " leaf" : "");
          if (sel) {
            if (sel.path.has(node.hash)) cls += " path";
            else if (sel.proof.has(node.hash)) cls += " proof";
          }
          const n = el("div", cls, (isLeaf ? node.label + "<br>" : (isRoot ? "ROOT<br>" : "")) + short(node.hash, 6));
          if (isLeaf) { const myIdx = levels[0].indexOf(node); n.onclick = () => { selected = myIdx; render(); }; n.style.cursor = "pointer"; }
          row.appendChild(n);
        });
        tree.appendChild(row);
      }
      host.appendChild(tree);
      const legend = el("div", "flex gap wrap mt", `
        <span class="pill cy">leaf = tx hash</span>
        <span class="pill vi">■ path to root</span>
        <span class="pill go">■ proof (siblings you provide)</span>`);
      host.appendChild(legend);
      const info = el("p", "note mt-s",
        selected >= 0
          ? `To prove <strong style="color:var(--cyan)">${txs[selected]}</strong> is in this block of ${txs.length} transactions, you supply only <strong style="color:var(--gold)">${sel.proof.size} sibling hashes</strong> (gold) — not all ${txs.length}. The verifier re-hashes up the violet path and checks it equals the known root. That's <strong>O(log n)</strong> verification.`
          : "Click any transaction (bottom row) to see its Merkle proof.");
      host.appendChild(info);
    }
    render();
  })();

  /* ---------------------------------------------------------
     PROOF OF WORK — mining race
  --------------------------------------------------------- */
  (function pow() {
    const host = $("powDemo"); if (!host) return;
    const miners = [
      { name: "Miner A", power: 1 }, { name: "Miner B", power: 2 },
      { name: "Miner C", power: 3 }, { name: "Miner D", power: 5 }
    ];
    const DIFF = "00"; // 2 hex zeros — quick for a live demo
    host.innerHTML = `
      <div class="miners" id="powMiners"></div>
      <div class="flex gap mt wrap" style="align-items:center">
        <button class="btn" id="powStart">⛏ Start race</button>
        <span class="note" id="powStatus">Target: hash starts with <span class="mono" style="color:var(--gold)">${DIFF}</span></span>
      </div>`;
    const grid = $("powMiners");
    miners.forEach((m, i) => {
      grid.appendChild(el("div", "miner", `
        <div class="name">${m.name}</div>
        <div class="hr">${m.power}× hash power</div>
        <div class="count" data-c="${i}">0</div>
        <div class="hr">attempts</div>
        <div class="attempt" data-a="${i}"></div>`));
    });
    let running = false;
    $("powStart").onclick = () => {
      if (running) return;
      running = true;
      $("powStatus").textContent = "Mining…";
      grid.querySelectorAll(".miner").forEach(m => m.classList.remove("win"));
      const counts = miners.map(() => 0);
      const nonces = miners.map(() => Math.floor(Math.random() * 1e6));
      let winner = -1;
      const tick = () => {
        if (winner >= 0) return;
        miners.forEach((m, i) => {
          if (winner >= 0) return;
          for (let k = 0; k < m.power; k++) { // more power = more guesses per tick
            nonces[i]++; counts[i]++;
            const h = sha256(m.name + nonces[i]);
            if (h.startsWith(DIFF)) {
              winner = i;
              grid.querySelector(`[data-a="${i}"]`).textContent = h.slice(0, 18) + "…";
              grid.querySelector(`[data-a="${i}"]`).style.color = "#57e08a";
              grid.querySelectorAll(".miner")[i].classList.add("win");
              break;
            }
            if (k === m.power - 1) {
              grid.querySelector(`[data-a="${i}"]`).textContent = h.slice(0, 18) + "…";
              grid.querySelector(`[data-a="${i}"]`).style.color = "";
            }
          }
          grid.querySelector(`[data-c="${i}"]`).textContent = counts[i];
        });
        if (winner >= 0) {
          running = false;
          $("powStatus").innerHTML = `🏆 <strong style="color:var(--gold)">${miners[winner].name}</strong> found a valid block first and earns the reward. Higher hash power → better odds, but it's still probabilistic.`;
        } else setTimeout(tick, 16);
      };
      setTimeout(tick, 16);
    };
  })();

  /* ---------------------------------------------------------
     PROOF OF STAKE — weighted lottery
  --------------------------------------------------------- */
  (function pos() {
    const host = $("posDemo"); if (!host) return;
    let stakes = [{ n: "Val A", s: 10 }, { n: "Val B", s: 30 }, { n: "Val C", s: 45 }, { n: "Val D", s: 15 }];
    host.innerHTML = `
      <div id="posBars"></div>
      <div class="validators" id="posChips"></div>
      <div class="flex gap wrap mt" style="align-items:center">
        <button class="btn violet" id="posRun">🎲 Run validator lottery</button>
        <span class="note" id="posStatus">Chance of selection ∝ stake. No electricity burned.</span>
      </div>`;
    function render() {
      const total = stakes.reduce((a, b) => a + b.s, 0);
      const chips = $("posChips"); chips.innerHTML = "";
      stakes.forEach((v, i) => {
        const chip = el("div", "vchip", `${v.n} · ${(v.s / total * 100).toFixed(0)}%`);
        chip.dataset.i = i; chips.appendChild(chip);
      });
      const bars = $("posBars"); bars.innerHTML = "";
      stakes.forEach((v, i) => {
        const row = el("div", "flex gap", "");
        row.style.alignItems = "center"; row.style.margin = "6px 0";
        row.innerHTML = `<span class="note" style="width:54px">${v.n}</span>`;
        const track = el("div", "", ""); track.style.flex = "1"; track.style.height = "10px"; track.style.background = "var(--bg)"; track.style.borderRadius = "6px"; track.style.overflow = "hidden";
        const fill = el("div", ""); fill.style.height = "100%"; fill.style.width = (v.s / total * 100) + "%"; fill.style.background = "var(--violet)";
        track.appendChild(fill); row.appendChild(track);
        const inp = el("input"); inp.type = "range"; inp.min = "5"; inp.max = "60"; inp.value = v.s; inp.style.width = "90px";
        inp.oninput = () => { stakes[i].s = +inp.value; render(); };
        row.appendChild(inp); bars.appendChild(row);
      });
    }
    render();
    $("posRun").onclick = () => {
      const total = stakes.reduce((a, b) => a + b.s, 0);
      let r = Math.random() * total, chosen = 0;
      for (let i = 0; i < stakes.length; i++) { if (r < stakes[i].s) { chosen = i; break; } r -= stakes[i].s; }
      $("posChips").querySelectorAll(".vchip").forEach((c, i) => c.classList.toggle("chosen", i === chosen));
      $("posStatus").innerHTML = `Block proposer: <strong style="color:var(--violet)">${stakes[chosen].n}</strong>. Over many rounds, rewards track stake share.`;
    };
  })();

  /* ---------------------------------------------------------
     SMART CONTRACT — vending machine
  --------------------------------------------------------- */
  (function contract() {
    const host = $("contractDemo"); if (!host) return;
    const PRICE = 3;
    let stock = 5;
    host.innerHTML = `
      <pre class="sc-screen" id="scCode" style="white-space:pre-wrap"><span style="color:#8b7bff">contract</span> VendingMachine {
  uint price = ${PRICE} tokens;
  uint stock = 5;

  <span style="color:#34e1d4">function</span> buy() <span style="color:#34e1d4">payable</span> {
    <span style="color:#ffcf6b">require</span>(msg.value >= price, "Pay more");
    <span style="color:#ffcf6b">require</span>(stock > 0, "Sold out");
    stock -= 1;
    emit Dispensed(msg.sender);
  }
}</pre>
      <div class="flex gap wrap mt" style="align-items:center">
        <label class="fld" style="margin:0">Send:</label>
        <input type="text" id="scAmt" value="3" style="width:80px" />
        <span class="note">tokens</span>
        <button class="btn" id="scBuy">▶ Call buy()</button>
        <span class="note">Stock: <strong id="scStock" style="color:var(--cyan)">${stock}</strong></span>
      </div>
      <div class="sc-screen mt-s" id="scOut"><div class="line">// transaction log</div></div>`;
    const out = $("scOut");
    function log(html, cls) { const d = el("div", "line " + (cls || ""), html); out.appendChild(d); out.scrollTop = out.scrollHeight; }
    $("scBuy").onclick = () => {
      const amt = parseFloat($("scAmt").value) || 0;
      log(`> buy() · msg.value = ${amt}`);
      if (amt < PRICE) { log(`✘ REVERTED: "Pay more" — funds returned, no state change.`, "er"); return; }
      if (stock <= 0) { log(`✘ REVERTED: "Sold out"`, "er"); return; }
      stock--; $("scStock").textContent = stock;
      log(`✓ require(msg.value >= price) passed`, "ok");
      log(`emit Dispensed(0x${sha256("buyer" + stock).slice(0, 8)}) · stock → ${stock}`, "ev");
    };
  })();

  /* ---------------------------------------------------------
     TRILEMMA — draggable point
  --------------------------------------------------------- */
  (function trilemma() {
    const host = $("trilemmaSvg"); if (!host) return;
    const W = 380, H = 340;
    const corners = {
      D: { x: W / 2, y: 30, label: "Decentralization", color: "#34e1d4" },
      S: { x: 40, y: H - 30, label: "Security", color: "#8b7bff" },
      C: { x: W - 40, y: H - 30, label: "Scalability", color: "#ffcf6b" }
    };
    host.innerHTML = `<svg class="viz-svg" viewBox="0 0 ${W} ${H}" id="triSvg"></svg>`;
    const svg = $("triSvg"), NS = "http://www.w3.org/2000/svg";
    const poly = document.createElementNS(NS, "polygon");
    poly.setAttribute("points", `${corners.D.x},${corners.D.y} ${corners.S.x},${corners.S.y} ${corners.C.x},${corners.C.y}`);
    poly.setAttribute("fill", "rgba(52,225,212,0.05)"); poly.setAttribute("stroke", "#1f2a45"); poly.setAttribute("stroke-width", "2");
    svg.appendChild(poly);
    Object.values(corners).forEach((c) => {
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", c.x); dot.setAttribute("cy", c.y); dot.setAttribute("r", 7); dot.setAttribute("fill", c.color);
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", c.x); t.setAttribute("y", c.y === 30 ? c.y - 14 : c.y + 24);
      t.setAttribute("text-anchor", "middle"); t.setAttribute("fill", c.color); t.setAttribute("font-size", "13"); t.setAttribute("font-weight", "700");
      t.textContent = c.label; svg.appendChild(dot); svg.appendChild(t);
    });
    const handle = document.createElementNS(NS, "circle");
    handle.setAttribute("r", 11); handle.setAttribute("fill", "#fff"); handle.setAttribute("stroke", "#34e1d4"); handle.setAttribute("stroke-width", "3");
    handle.style.cursor = "grab"; svg.appendChild(handle);

    // barycentric weights from point position
    function weights(px, py) {
      const { D, S, C } = corners;
      const det = (S.y - C.y) * (D.x - C.x) + (C.x - S.x) * (D.y - C.y);
      let a = ((S.y - C.y) * (px - C.x) + (C.x - S.x) * (py - C.y)) / det;
      let b = ((C.y - D.y) * (px - C.x) + (D.x - C.x) * (py - C.y)) / det;
      let c = 1 - a - b;
      return [Math.max(0, a), Math.max(0, b), Math.max(0, c)];
    }
    const readout = $("trilemmaReadout");
    function update(px, py) {
      handle.setAttribute("cx", px); handle.setAttribute("cy", py);
      const [d, s, c] = weights(px, py);
      const tot = d + s + c || 1;
      const D = d / tot, S = s / tot, C = c / tot;
      const bar = (v, col) => `<div style="background:var(--bg);border-radius:6px;height:12px;margin:4px 0;overflow:hidden"><div style="width:${(v*100).toFixed(0)}%;height:100%;background:${col}"></div></div>`;
      let profile = "Balanced.";
      if (D > 0.5) profile = "Bitcoin-like: maximally decentralized & secure, but ~7 TPS.";
      else if (C > 0.5) profile = "High-throughput chain: fast, but fewer validators (more centralized).";
      else if (S > 0.5) profile = "Conservative: hard to attack, but conservative on throughput.";
      readout.innerHTML = `
        <div class="note">Decentralization ${bar(D, "#34e1d4")}
        Security ${bar(S, "#8b7bff")}
        Scalability ${bar(C, "#ffcf6b")}</div>
        <p class="note mt-s"><strong style="color:var(--text)">${profile}</strong> Pull toward one corner and the other two shrink — that's the trilemma.</p>`;
    }
    let cx = W / 2, cy = H / 2 + 20;
    update(cx, cy);
    let dragging = false;
    function pt(evt) {
      const rect = svg.getBoundingClientRect();
      const e = evt.touches ? evt.touches[0] : evt;
      let x = (e.clientX - rect.left) / rect.width * W;
      let y = (e.clientY - rect.top) / rect.height * H;
      // clamp inside triangle via barycentric
      const [a, b, c] = weights(x, y); const t = a + b + c;
      if (a < 0 || b < 0 || c < 0 || t > 1.02) {
        // project roughly toward centroid
        const gx = (corners.D.x + corners.S.x + corners.C.x) / 3, gy = (corners.D.y + corners.S.y + corners.C.y) / 3;
        x = gx + (x - gx) * 0.7; y = gy + (y - gy) * 0.7;
      }
      return [x, y];
    }
    const start = () => { dragging = true; handle.style.cursor = "grabbing"; };
    const move = (e) => { if (!dragging) return; const [x, y] = pt(e); update(x, y); e.preventDefault(); };
    const end = () => { dragging = false; handle.style.cursor = "grab"; };
    handle.addEventListener("mousedown", start); svg.addEventListener("mousedown", (e) => { start(); move(e); });
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", end);
    handle.addEventListener("touchstart", start); svg.addEventListener("touchmove", move); window.addEventListener("touchend", end);
  })();

  /* ---------------------------------------------------------
     TPS bars
  --------------------------------------------------------- */
  window.__initTPS = function () {
    const host = $("tpsDemo"); if (!host || host.dataset.done) return; host.dataset.done = "1";
    const data = [
      { n: "Bitcoin", v: 7, c: "#ffcf6b" },
      { n: "Ethereum", v: 25, c: "#8b7bff" },
      { n: "Visa", v: 24000, c: "#34e1d4" }
    ];
    const max = 24000;
    data.forEach((d) => {
      const row = el("div", "tps-row");
      row.innerHTML = `<div class="name">${d.n}</div><div class="tps-bar-track"><div class="tps-bar-fill" style="background:${d.c}"></div></div>`;
      host.appendChild(row);
      const fill = row.querySelector(".tps-bar-fill");
      const w = Math.max(2, (Math.log10(d.v + 1) / Math.log10(max + 1)) * 100);
      setTimeout(() => { fill.style.width = w + "%"; fill.textContent = d.v.toLocaleString() + " TPS"; }, 100);
    });
    const note = el("p", "note mt", "Note: log scale — Visa's ~24,000 TPS dwarfs base-layer chains. This gap is exactly what Layer-2s aim to close.");
    host.appendChild(note);
  };

  /* ---------------------------------------------------------
     POLICY comparator
  --------------------------------------------------------- */
  (function policy() {
    const host = $("policyDemo"); if (!host) return;
    const stories = {
      in: { name: "India", color: "#ffcf6b", body: `<strong>Among the most volatile trajectories of any major economy.</strong>
        <ul style="color:var(--muted);margin:10px 0">
          <li><strong>2018:</strong> RBI barred banks from servicing crypto firms. Supreme Court struck it down in 2020.</li>
          <li><strong>2022:</strong> 30% flat tax on gains (no loss offset) + 1% TDS. Widely seen as punitive; drove volume offshore.</li>
          <li><strong>2023:</strong> India took the FATF presidency, pushing global AML/CFT coordination.</li>
          <li><strong>Now:</strong> No comprehensive law. Exchanges register with FIU-IND under PMLA. RBI pursues the Digital Rupee (e₹) while skeptical of private crypto.</li>
        </ul>
        <span class="pill go">Risk: regulatory paralysis — restrictive tax, no enabling framework.</span>` },
      us: { name: "United States", color: "#4aa8ff", body: `<strong>No single federal crypto law. Authority is fragmented across agencies.</strong>
        <ul style="color:var(--muted);margin:10px 0">
          <li><strong>SEC:</strong> Argued most tokens are securities (Howey Test); aggressive enforcement (Coinbase, Binance).</li>
          <li><strong>CFTC:</strong> Treats BTC/ETH as commodities in many contexts.</li>
          <li><strong>FinCEN:</strong> Exchanges = Money Services Businesses under the Bank Secrecy Act.</li>
          <li><strong>IRS:</strong> Crypto is property; capital gains on every disposal.</li>
          <li><strong>FIT21</strong> (House 2024) tried to split SEC/CFTC jurisdiction; Senate pending. The 2025 administration signaled a more permissive stance.</li>
        </ul>
        <span class="pill" style="color:#4aa8ff;border-color:#4aa8ff">Fragmented — clarity still pending.</span>` },
      eu: { name: "European Union", color: "#8b7bff", body: `<strong>MiCA — the most comprehensive framework among major economies.</strong>
        <ul style="color:var(--muted);margin:10px 0">
          <li>Enacted 2023, full application from <strong>Dec 2024</strong>.</li>
          <li>Covers ART &amp; EMT issuers and crypto-asset service providers (CASPs).</li>
          <li>CASPs authorize in one member state and <strong>passport</strong> across the bloc.</li>
          <li>Strict reserve &amp; disclosure rules for stablecoins.</li>
          <li>NFTs &amp; DeFi largely out of scope (for now); reviews planned.</li>
        </ul>
        <span class="pill vi">Global benchmark — the "passport" model attracts institutions.</span>` }
    };
    const rows = [
      ["Legal status", { in: "Legal to hold; not legal tender", us: "Legal; commodity/security by token", eu: "Legal; licensed under MiCA" }],
      ["Primary regulator", { in: "FIU-IND, RBI, SEBI", us: "Fragmented SEC / CFTC / FinCEN", eu: "National authorities + ESMA" }],
      ["Stablecoins", { in: "No framework yet", us: "Legislation pending", eu: "Strict reserve requirements" }],
      ["DeFi", { in: "Largely unregulated", us: "Largely unregulated", eu: "Largely out of scope; review" }],
      ["CBDC", { in: "Digital Rupee (pilots live)", us: "Studied, not committed", eu: "Digital euro in preparation" }]
    ];
    host.innerHTML = `
      <div class="tabs" id="polTabs">
        <button class="tab active" data-c="in">🇮🇳 India</button>
        <button class="tab" data-c="us">🇺🇸 United States</button>
        <button class="tab" data-c="eu">🇪🇺 European Union</button>
      </div>
      <div class="grid-2" style="gap:24px;align-items:start">
        <div id="polStory" class="note" style="font-size:15px"></div>
        <div>
          <table class="comparison-table"><thead><tr><th></th><th class="in">India</th><th class="us">US</th><th class="eu">EU</th></tr></thead>
          <tbody id="polRows"></tbody></table>
        </div>
      </div>`;
    const tbody = $("polRows");
    rows.forEach(([label, vals]) => {
      tbody.appendChild(el("tr", "", `<td>${label}</td><td class="in">${vals.in}</td><td class="us">${vals.us}</td><td class="eu">${vals.eu}</td>`));
    });
    function select(c) {
      $("polTabs").querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.c === c));
      $("polStory").innerHTML = stories[c].body;
      // dim the non-selected columns
      const map = { in: 2, us: 3, eu: 4 };
      tbody.querySelectorAll("tr").forEach(tr => {
        [...tr.children].forEach((td, i) => {
          if (i === 0) return;
          td.style.opacity = (i === map[c]) ? "1" : "0.32";
          td.style.fontWeight = (i === map[c]) ? "700" : "400";
        });
      });
    }
    $("polTabs").querySelectorAll(".tab").forEach(t => t.onclick = () => select(t.dataset.c));
    select("in");
  })();

  /* ---------------------------------------------------------
     ZKP — Ali Baba cave
  --------------------------------------------------------- */
  (function zkp() {
    const host = $("zkpDemo"); if (!host) return;
    host.innerHTML = `
      <div class="grid-2" style="gap:20px;align-items:center">
        <div class="zk-stage"><svg class="viz-svg" viewBox="0 0 320 220" id="zkSvg"></svg></div>
        <div>
          <div class="flex gap wrap mb">
            <label class="fld" style="margin:0">Peggy actually knows the word?</label>
          </div>
          <div class="flex gap wrap">
            <button class="btn" id="zkRound">▶ Run one round</button>
            <button class="btn ghost" id="zkToggle">Peggy: <span id="zkKnows">HONEST</span></button>
            <button class="btn ghost" id="zkReset">Reset</button>
          </div>
          <div class="mt"><span class="note">Confidence Victor has gained:</span>
            <div style="background:var(--bg);border-radius:8px;height:16px;overflow:hidden;margin-top:6px;border:1px solid var(--line)">
              <div id="zkConf" style="height:100%;width:0;background:linear-gradient(90deg,var(--violet),var(--cyan));transition:width .4s"></div></div>
            <div class="note mt-s" id="zkConfTxt">0 rounds · a cheater would still have a 100% chance of having fooled him.</div>
          </div>
          <div class="zk-log" id="zkLog"></div>
        </div>
      </div>`;
    const NS = "http://www.w3.org/2000/svg", svg = $("zkSvg");
    // Draw a ring-shaped cave with a door at the bottom
    svg.innerHTML = `
      <path d="M160 30 A95 95 0 1 1 159 30" fill="none" stroke="#1f2a45" stroke-width="26"/>
      <rect x="150" y="150" width="20" height="46" fill="#0e1424" stroke="#ff5d6c" stroke-width="2"/>
      <text x="160" y="178" text-anchor="middle" fill="#ff5d6c" font-size="9" font-family="monospace">DOOR</text>
      <text x="70" y="120" text-anchor="middle" fill="#34e1d4" font-size="11" font-family="monospace">A</text>
      <text x="250" y="120" text-anchor="middle" fill="#ffcf6b" font-size="11" font-family="monospace">B</text>
      <circle id="zkPeggy" cx="160" cy="35" r="9" fill="#8b7bff"/>
      <text x="160" y="14" text-anchor="middle" fill="#8b7bff" font-size="10" font-family="monospace">Peggy</text>`;
    const peggy = $("zkPeggy");
    let knows = true, rounds = 0, fooledProb = 1;
    function log(html, cls) { const d = el("div", cls, html); $("zkLog").prepend(d); }
    $("zkToggle").onclick = () => { knows = !knows; $("zkKnows").textContent = knows ? "HONEST" : "CHEATER"; $("zkToggle").style.borderColor = knows ? "" : "var(--red)"; };
    $("zkReset").onclick = () => { rounds = 0; fooledProb = 1; $("zkConf").style.width = "0"; $("zkLog").innerHTML = ""; $("zkConfTxt").textContent = "0 rounds · a cheater would still have a 100% chance of having fooled him."; peggy.setAttribute("cx", 160); peggy.setAttribute("cy", 35); };

    $("zkRound").onclick = () => {
      rounds++;
      // Peggy enters a random tunnel (A=left, B=right) BEFORE Victor's challenge
      const entered = Math.random() < 0.5 ? "A" : "B";
      // Move avatar into that tunnel
      peggy.setAttribute("cx", entered === "A" ? 70 : 250);
      peggy.setAttribute("cy", 130);
      // Victor shouts a random side to come out of
      const challenge = Math.random() < 0.5 ? "A" : "B";
      log(`Round ${rounds}: Peggy enters tunnel <b style="color:${entered==='A'?'#34e1d4':'#ffcf6b'}">${entered}</b>. Victor demands she exit via <b class="req">${challenge}</b>.`, "");
      let success;
      if (knows) {
        success = true; // can always open the door and comply
        if (challenge !== entered) log(`→ She opens the secret door and walks through. Exits ${challenge}. ✔`, "ok");
        else log(`→ Already on side ${challenge}. Exits ${challenge}. ✔`, "ok");
      } else {
        success = challenge === entered; // only succeeds if guessed right
        if (success) log(`→ Lucky! She happened to be on side ${challenge}. ✔ (50% fluke)`, "ok");
        else { log(`→ Wrong side and can't open the door. EXPOSED. ✘`, ""); $("zkLog").firstChild.style.color = "#ff5d6c"; }
      }
      setTimeout(() => { peggy.setAttribute("cx", challenge === "A" ? 70 : 250); }, 250);
      setTimeout(() => { peggy.setAttribute("cx", 160); peggy.setAttribute("cy", 35); }, 700);

      if (!knows && !success) { fooledProb = 0; }
      else if (!knows) { fooledProb *= 0.5; }
      else fooledProb *= 0.5; // honest also reduces "could be luck" probability

      const conf = (1 - fooledProb) * 100;
      $("zkConf").style.width = conf.toFixed(1) + "%";
      if (fooledProb === 0) $("zkConfTxt").innerHTML = `<strong style="color:var(--red)">Cheater exposed in round ${rounds}.</strong> A liar can't survive a challenge they didn't pre-guess.`;
      else $("zkConfTxt").innerHTML = `${rounds} rounds passed · chance a <em>cheater</em> got this lucky every time: <strong style="color:var(--cyan)">${(fooledProb*100).toFixed(2)}%</strong>. Victor learns the word was never revealed.`;
    };
  })();

  /* ---------------------------------------------------------
     ACCOUNT ABSTRACTION — toggles
  --------------------------------------------------------- */
  (function aa() {
    const host = $("aaDemo"); if (!host) return;
    const feats = [
      { k: "recovery", t: "Social recovery", d: "Trusted contacts can restore access if you lose your key." },
      { k: "multisig", t: "Multi-sig by default", d: "Large transfers require multiple approvals." },
      { k: "gas", t: "Gas sponsorship", d: "A dApp pays fees so users never touch gas tokens." },
      { k: "session", t: "Session keys", d: "Grant a game limited permissions for a fixed window." }
    ];
    let st = { recovery: false, multisig: false, gas: false, session: false };
    host.innerHTML = `<div class="grid-2" id="aaList" style="gap:12px"></div>
      <div class="sig-state mt" id="aaState"></div>`;
    function render() {
      const list = $("aaList"); list.innerHTML = "";
      feats.forEach((f) => {
        const on = st[f.k];
        const card = el("div", "card", `
          <div class="flex" style="justify-content:space-between;align-items:center">
            <h3 style="margin:0">${f.t}</h3>
            <span class="pill ${on ? "vi" : ""}">${on ? "ON" : "OFF"}</span>
          </div>
          <p>${f.d}</p>`);
        card.style.cursor = "pointer";
        card.style.borderColor = on ? "var(--violet)" : "";
        card.onclick = () => { st[f.k] = !st[f.k]; render(); };
        list.appendChild(card);
      });
      const n = Object.values(st).filter(Boolean).length;
      const s = $("aaState");
      if (n === 0) { s.className = "sig-state mt"; s.innerHTML = "This is a plain EOA: one key, total responsibility. Lose it and funds are gone forever."; }
      else { s.className = "sig-state mt valid"; s.innerHTML = `Smart account with <strong>${n}</strong> feature${n>1?"s":""} enabled — Web2-grade UX, still self-custodial. This is why AA is called foundational for mainstream adoption.`; }
    }
    render();
  })();

  /* ---------------------------------------------------------
     CBDC — control spectrum slider
  --------------------------------------------------------- */
  (function cbdc() {
    const host = $("cbdcDemo"); if (!host) return;
    host.innerHTML = `
      <input type="range" id="cbdcSlider" min="0" max="100" value="50" style="width:100%" />
      <div class="flex" style="justify-content:space-between;margin-top:6px">
        <span class="pill cy">Permissionless crypto</span>
        <span class="pill" style="color:var(--red);border-color:var(--red)">State-controlled CBDC</span>
      </div>
      <div class="panel mt" id="cbdcCard" style="background:var(--bg)"></div>`;
    const examples = [
      { at: 0, t: "Bitcoin", d: "Permissionless, censorship-resistant, no issuer. Privacy via pseudonymity." },
      { at: 30, t: "Stablecoins (USDC)", d: "Private issuer, redeemable, can freeze addresses. Centralized but on a public chain." },
      { at: 70, t: "e-Rupee / e-CNY", d: "Issued by the central bank. China's e-CNY is the most advanced large-economy CBDC; India's e₹ retail pilot (2023) saw modest uptake." },
      { at: 100, t: "Programmable CBDC", d: "Money that can expire, be geofenced, or restricted by purpose. Powerful — and a civil-liberties flashpoint." }
    ];
    const card = $("cbdcCard");
    function render(v) {
      let pick = examples[0];
      for (const e of examples) if (v >= e.at - 15) pick = e;
      const decentral = Math.max(0, 100 - v), control = v;
      card.innerHTML = `
        <h3 style="margin:0 0 4px">${pick.t}</h3>
        <p class="note" style="margin:0">${pick.d}</p>
        <div class="note mt-s">Decentralization ${(decentral)}% · State control ${control}%</div>`;
    }
    $("cbdcSlider").oninput = (e) => render(+e.target.value);
    render(50);
  })();

  /* ---------------------------------------------------------
     BRIDGE — lock & mint, and the hack
  --------------------------------------------------------- */
  (function bridge() {
    const host = $("bridgeDemo"); if (!host) return;
    host.innerHTML = `
      <div class="grid-2" style="gap:18px;align-items:center">
        <div>
          <div class="flex gap wrap">
            <button class="btn" id="brSend">→ Bridge 10 ETH to Chain B</button>
            <button class="btn ghost" id="brHack" style="border-color:var(--red);color:var(--red)">☠ Simulate bridge exploit</button>
            <button class="btn ghost" id="brReset">Reset</button>
          </div>
          <div class="zk-log mt" id="brLog"></div>
        </div>
        <svg class="viz-svg" viewBox="0 0 360 200" id="brSvg"></svg>
      </div>`;
    const NS = "http://www.w3.org/2000/svg", svg = $("brSvg");
    function draw(lockA, mintB, hacked) {
      svg.innerHTML = `
        <rect x="20" y="50" width="120" height="100" rx="12" fill="#0e1424" stroke="#34e1d4" stroke-width="2"/>
        <text x="80" y="42" text-anchor="middle" fill="#34e1d4" font-size="12" font-family="monospace">Chain A</text>
        <text x="80" y="95" text-anchor="middle" fill="#e7ecf5" font-size="11" font-family="monospace">Locked:</text>
        <text x="80" y="118" text-anchor="middle" fill="#34e1d4" font-size="18" font-weight="700" font-family="monospace">${lockA} ETH</text>
        <rect x="220" y="50" width="120" height="100" rx="12" fill="#0e1424" stroke="${hacked ? '#ff5d6c' : '#8b7bff'}" stroke-width="2"/>
        <text x="280" y="42" text-anchor="middle" fill="#8b7bff" font-size="12" font-family="monospace">Chain B</text>
        <text x="280" y="95" text-anchor="middle" fill="#e7ecf5" font-size="11" font-family="monospace">Minted:</text>
        <text x="280" y="118" text-anchor="middle" fill="${hacked ? '#ff5d6c' : '#8b7bff'}" font-size="18" font-weight="700" font-family="monospace">${mintB} wETH</text>
        <rect x="150" y="88" width="60" height="24" rx="6" fill="${hacked ? '#2a0e14' : '#131b30'}" stroke="${hacked ? '#ff5d6c' : '#1f2a45'}"/>
        <text x="180" y="104" text-anchor="middle" fill="${hacked ? '#ff5d6c' : '#93a1bf'}" font-size="9" font-family="monospace">${hacked ? 'PWNED' : 'BRIDGE'}</text>`;
    }
    let lock = 0, mint = 0;
    function log(html, cls) { $("brLog").prepend(el("div", cls, html)); }
    draw(0, 0, false);
    $("brSend").onclick = () => {
      lock += 10; log(`🔒 10 ETH locked in Chain A bridge contract.`, "req");
      setTimeout(() => { mint += 10; draw(lock, mint, false); log(`✓ 10 wETH minted on Chain B. Backed 1:1 by locked ETH.`, "ok"); }, 500);
      draw(lock, mint, false);
    };
    $("brHack").onclick = () => {
      mint += 10000; draw(lock, mint, true);
      log(`☠ Exploit: attacker forges a "deposit" proof and mints ${(10000).toLocaleString()} wETH with NO backing. Drains the pool.`, "");
      $("brLog").firstChild.style.color = "#ff5d6c";
      log(`This pattern caused Ronin ($625M), Wormhole ($325M), Nomad ($190M). Bridges = crypto's largest attack surface.`, "");
    };
    $("brReset").onclick = () => { lock = 0; mint = 0; draw(0, 0, false); $("brLog").innerHTML = ""; };
  })();

})();
