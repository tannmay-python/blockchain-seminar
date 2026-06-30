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
    deeper: P("This is <b>ECDSA</b>, the same elliptic-curve signatures Bitcoin and Ethereum use. The trapdoor: your public key is a fixed point added to itself a secret number of times; going forward is fast, going back (the discrete-log problem) is hopeless. Signing covers the <b>hash</b> of the transaction, so it proves authenticity and integrity at once — and the verifier learns only ‘this key signed this’, never your secret. Lose the key and the coins freeze forever; copy it and the thief simply is you. <b>Policy hook:</b> there's no intermediary to pressure — so states regulate the exchanges, the one place an intermediary reappears.") };

  /* ===================== BUILDING THE CHAIN ===================== */
  L.block = { world: "chain", title: "A block", oneliner: "What gets bundled", icon: "▦",
    hero: "Transactions don't go on one at a time. They're bundled into a block, sealed with a single fingerprint.",
    beats: [
      { n: "01", h: "Pack a block", cap: "Tap transactions to add them to the block. Watch the <b>Merkle root</b> — one fingerprint for the whole batch — change with every one.",
        build(s) { const pool = ["Alice→Bob 5", "Carol→Dan 2", "Eve→Finn 8", "Gail→Hank 1", "Ivy→Jo 4"]; const inBlock = [];
          const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>build a block</div><div class="note" style="margin-bottom:8px">mempool — tap to include</div><div id="bkPool" style="display:flex;flex-wrap:wrap;gap:8px"></div><div class="bfield hl full" style="margin-top:16px"><div class="k">merkle root of included transactions</div><div class="v go" id="bkRoot"></div></div>`;
          s.appendChild(wrap);
          function merk(a) { if (!a.length) return sha256("∅"); let lvl = a.map(x => sha256(x)); while (lvl.length > 1) { const n = []; for (let i = 0; i < lvl.length; i += 2) n.push(sha256(lvl[i] + (lvl[i + 1] || lvl[i]))); lvl = n; } return lvl[0]; }
          function render() { const pe = wrap.querySelector("#bkPool"); pe.innerHTML = ""; pool.forEach(t => { const inc = inBlock.includes(t); const chip = el("button", "btn" + (inc ? " gold" : ""), (inc ? "✓ " : "+ ") + t); chip.style.fontSize = "12.5px"; chip.style.padding = "8px 12px"; chip.onclick = () => { inc ? inBlock.splice(inBlock.indexOf(t), 1) : inBlock.push(t); render(); }; pe.appendChild(chip); }); wrap.querySelector("#bkRoot").textContent = inBlock.length ? merk(inBlock) : "— empty block —"; }
          render();
        } },
      { n: "02", h: "Five fields, one seal", cap: "A block's <b>header</b> is tiny: a link to the previous block, the Merkle root, a time, and the mining fields. Edit a transaction and the whole seal shifts.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="k" style="font-size:10px;text-transform:uppercase;color:var(--ink-3);margin-bottom:7px">transactions</div><textarea class="in mono" id="bTx" rows="2">Alice → Bob: 5
Carol → Dan: 2</textarea><div class="bfields" style="margin-top:14px"><div class="bfield"><div class="k">previous hash · the chain link</div><div class="v" id="bP"></div></div><div class="bfield"><div class="k">nonce · mining (next)</div><div class="v vi">1 057 392</div></div><div class="bfield hl full"><div class="k">merkle root</div><div class="v go" id="bR"></div></div><div class="bfield hl full"><div class="k">block hash = SHA-256(header)</div><div class="v hash" id="bH"></div></div></div>`;
          s.appendChild(wrap); const prev = "0000a3f2" + sha256("prev").slice(8, 64); wrap.querySelector("#bP").textContent = short(prev, 14, 8);
          function merk(lines) { let lvl = lines.map(x => sha256(x)); if (!lvl.length) return sha256("∅"); while (lvl.length > 1) { const n = []; for (let i = 0; i < lvl.length; i += 2) n.push(sha256(lvl[i] + (lvl[i + 1] || lvl[i]))); lvl = n; } return lvl[0]; }
          const tx = wrap.querySelector("#bTx"); function render() { const lines = tx.value.split("\n").filter(x => x.trim()); const root = merk(lines); wrap.querySelector("#bR").textContent = root; wrap.querySelector("#bH").innerHTML = splitZ(sha256(prev + root + "1057392")); } tx.oninput = render; render();
        } },
    ],
    deeper: P("Each transaction is hashed; pairs of hashes are hashed together, up a tree, until one <b>Merkle root</b> remains in the header. Hashing the header gives the block its own ID. A block on its own isn't special — anyone can build one. What makes <i>adding</i> it costly, and the past unchangeable, is the next two lessons: the nonce, and the chain.") };

  L.nonce = { world: "chain", title: "The nonce", oneliner: "Proof of Work, by hand", icon: "⛏",
    hero: "Adding a block has to be expensive, or rewriting history would be free. The cost is a guessing game.",
    beats: [
      { n: "01", h: "Roll a giant die", cap: "A hash is a random number in a huge range. A valid block needs one that lands in the tiny <b>target zone</b>. You can't aim — only re-roll.",
        build(s) { const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="flabel"><span class="pin"></span>below the target?</div><div style="position:relative;height:30px;border-radius:99px;background:var(--surface-3);border:1px solid var(--line);overflow:hidden;margin:10px 0"><div style="position:absolute;left:0;top:0;bottom:0;width:14%;background:var(--green-soft)"></div><div id="dieMark" style="position:absolute;top:50%;width:16px;height:16px;border-radius:50%;background:var(--plum);transform:translate(-50%,-50%);left:60%;transition:left .25s"></div></div><div style="display:flex;justify-content:space-between"><span class="note" style="color:var(--green)">◀ target zone (valid)</span><span class="note">too big ▶</span></div><div class="verdict no" id="dieV" style="margin-top:14px">roll to try</div><button class="btn gold block" id="dieGo" style="margin-top:12px">Roll</button>`;
          s.appendChild(wrap); let n = 0;
          wrap.querySelector("#dieGo").onclick = () => { n++; const h = sha256("roll" + n + Math.random()); const pos = parseInt(h.slice(0, 4), 16) / 65535; wrap.querySelector("#dieMark").style.left = (4 + pos * 92) + "%"; const win = pos < 0.14; const v = wrap.querySelector("#dieV"); if (win) { v.className = "verdict yes"; v.textContent = `Landed in the target zone — valid block! (roll ${n})`; } else { v.className = "verdict no"; v.textContent = `too big — re-roll (${n} tries)`; } };
        } },
      { n: "02", h: "The nonce is the re-roll", cap: "You can't change the transactions, so you spin one throwaway number — the <span class='k'>nonce</span> — until the hash starts with enough zeros. Crank the difficulty and feel it get harder.",
        build(s) { let diff = 4, nonce = 0, tries = 0, mining = false; const DATA = "block #42 · Alice→Bob 5", PREV = "0000a3f2c1";
          const wrap = el("div", "fcard"); wrap.innerHTML = `<div class="nonce-display"><span class="lab">current nonce</span><span id="nN">0</span></div><div class="hashout" id="nH" style="margin:16px 0;text-align:center"></div><div class="verdict no" id="nV" style="margin-bottom:16px"></div><div class="target-line">hash must start with <span class="t" id="nT">0000</span></div><div class="srow" style="margin:14px 0"><span class="nm">difficulty</span><input type="range" id="nD" min="1" max="5" value="4"><span class="v" id="nDv">4</span></div><div class="statline"><div class="s"><span class="n" id="nE">65,536</span><span class="l">expected tries</span></div><div class="s"><span class="n" id="nTr">0</span><span class="l">your tries</span></div></div><div class="btn-row" style="margin-top:16px;justify-content:center"><button class="btn gold" id="nTy">Spin once</button><button class="btn primary" id="nAu">Auto-mine</button><button class="btn" id="nR">Reset</button></div>`;
          s.appendChild(wrap); const tgt = () => "0".repeat(diff);
          function render() { const h = sha256(DATA + PREV + nonce); wrap.querySelector("#nN").textContent = fmt(nonce); wrap.querySelector("#nTr").textContent = fmt(tries); wrap.querySelector("#nH").innerHTML = splitZ(h); const ok = h.startsWith(tgt()); const v = wrap.querySelector("#nV"); if (ok) { v.className = "verdict yes"; v.textContent = `Found it after ${fmt(tries)} tries`; } else { v.className = "verdict no"; v.textContent = `starts "${h.slice(0, diff)}" — need "${tgt()}"`; } return ok; }
          wrap.querySelector("#nD").oninput = (e) => { diff = +e.target.value; wrap.querySelector("#nDv").textContent = diff; wrap.querySelector("#nT").textContent = tgt(); wrap.querySelector("#nE").textContent = fmt(Math.pow(16, diff)); render(); };
          wrap.querySelector("#nTy").onclick = () => { if (mining) return; nonce++; tries++; render(); };
          wrap.querySelector("#nR").onclick = () => { mining = false; nonce = 0; tries = 0; wrap.querySelector("#nAu").textContent = "Auto-mine"; render(); };
          wrap.querySelector("#nAu").onclick = () => { if (mining) { mining = false; wrap.querySelector("#nAu").textContent = "Auto-mine"; return; } mining = true; wrap.querySelector("#nAu").textContent = "Stop"; const step = () => { if (!mining) return; for (let i = 0; i < 1200; i++) { nonce++; tries++; if (sha256(DATA + PREV + nonce).startsWith(tgt())) { render(); mining = false; wrap.querySelector("#nAu").textContent = "Auto-mine"; return; } } render(); setTimeout(step, 0); }; setTimeout(step, 0); };
          render();
        } },
    ],
    deeper: P("If <code>p = target / 2²⁵⁶</code> is the chance one hash qualifies, expected tries is <code>1/p</code>, and each extra zero of difficulty makes it 16× rarer (a hex digit has 16 values). Bitcoin runs about 10²³ hashes per block every ten minutes, re-tuning the target every two weeks to hold that pace. The winner mints new coins plus fees. The recurring theme: producing a block is staggeringly expensive, but <b>checking</b> it is a single hash. <b>Policy hook:</b> Proof of Work turns electricity into security, so mining migrates to the cheapest power — China's 2021 ban moved half the world's hashrate across borders in months.") };

  L.chainlink = { world: "chain", title: "The chain", oneliner: "Why the past locks", icon: "⛓",
    hero: "Each block carries the fingerprint of the one before it. That's the chain — and the lock.",
    beats: [
      { n: "01", h: "Welded by fingerprints", cap: "Edit any block's transaction. Its hash changes, the next block's ‘previous hash’ stops matching, and the break <b>cascades</b> all the way down.",
        build(s) { const GEN = "0".repeat(16), DIFF = 3; let blocks = [{ d: "Genesis" }, { d: "Alice → Bob: 5" }, { d: "Carol → Dan: 2" }, { d: "Eve → Finn: 8" }];
          const bh = (d, prev, nonce) => sha256(d + prev + nonce); function mine(b, prev) { b.nonce = 0; while (!bh(b.d, prev, b.nonce).startsWith("0".repeat(DIFF))) b.nonce++; }
          let prev = GEN; blocks.forEach(b => { mine(b, prev); b.prev = prev; b.hash = bh(b.d, prev, b.nonce); prev = b.hash; });
          const wrap = el("div", ""); wrap.innerHTML = `<div class="mchain" id="cR"></div>`; s.appendChild(wrap);
          function valid(i) { const b = blocks[i]; const realPrev = i === 0 ? GEN : blocks[i - 1].hash; return b.prev === realPrev && bh(b.d, b.prev, b.nonce).startsWith("0".repeat(DIFF)) && b.hash === bh(b.d, b.prev, b.nonce); }
          function render() { const row = wrap.querySelector("#cR"); row.innerHTML = ""; blocks.forEach((b, i) => { const ok = valid(i); const c = el("div", "mblk" + (ok ? "" : " bad"), `<div class="top">#${i}<span class="st">${ok ? "✓" : "✕"}</span></div><textarea data-i="${i}" rows="2">${b.d.replace(/</g, "&lt;")}</textarea><div class="r"><div class="k">prev</div><div class="v">${short(b.prev, 8, 4)}</div></div><div class="r"><div class="k">hash</div><div class="v hash">${short(bh(b.d, b.prev, b.nonce), 8, 4)}</div></div><button class="btn" data-mine="${i}" style="margin-top:9px;font-size:11px;padding:6px 10px">Re-mine from here</button>`); row.appendChild(c); if (i < blocks.length - 1) row.appendChild(el("div", "mlink" + (ok ? "" : " bad"))); });
            row.querySelectorAll("textarea[data-i]").forEach(t => t.oninput = () => { const i = +t.dataset.i; blocks[i].d = t.value; blocks[i].hash = bh(blocks[i].d, blocks[i].prev, blocks[i].nonce); render(); const tt = wrap.querySelector(`textarea[data-i="${i}"]`); if (tt) tt.focus(); });
            row.querySelectorAll("button[data-mine]").forEach(btn => btn.onclick = () => { let i = +btn.dataset.mine, pr = i === 0 ? GEN : blocks[i - 1].hash; for (let j = i; j < blocks.length; j++) { blocks[j].prev = pr; mine(blocks[j], pr); blocks[j].hash = bh(blocks[j].d, pr, blocks[j].nonce); pr = blocks[j].hash; } render(); });
          } render();
        } },
    ],
    deeper: P("Changing the past doesn't just edit a block — it invalidates everything built on top, in plain view. To repair it you'd have to re-mine that block <i>and every block after it</i>, winning the whole Proof-of-Work race again, while the honest network keeps extending the real chain with all its power. Below 50% of the hashrate, you fall further behind every ten minutes. Fingerprints make tampering visible; work makes fixing it a race you lose. That combination is immutability.") };

  L.merkle = { world: "chain", title: "Merkle tree", oneliner: "Prove inclusion cheaply", icon: "⋔",
    hero: "How does a phone confirm a payment without downloading the whole blockchain? A clever tree of hashes.",
    beats: [
      { n: "01", h: "Click a transaction to prove it", cap: "To prove one transaction is in a block of thousands, you only need a <b>handful</b> of sibling hashes along the path to the root — not the whole block.",
        build(s) { const txs = ["Alice→Bob", "Bob→Carol", "Carol→Dan", "Dan→Eve", "Eve→Finn", "Finn→Gail", "Gail→Hank", "Hank→Ivy"];
          let levels = []; let lvl = txs.map(t => ({ hash: sha256(t), label: t })); levels.push(lvl); while (lvl.length > 1) { const n = []; for (let i = 0; i < lvl.length; i += 2) { const a = lvl[i], b = lvl[i + 1] || lvl[i]; n.push({ hash: sha256(a.hash + b.hash) }); } levels.push(n); lvl = n; }
          const wrap = el("div", ""); wrap.innerHTML = `<div class="mtree2" id="mt"></div><div class="sig-state" id="mM" style="max-width:560px;margin:18px auto 0;text-align:center">Click any transaction at the bottom.</div>`; s.appendChild(wrap);
          function proof(leaf) { const path = new Set(), prf = new Set(); let idx = leaf; for (let l = 0; l < levels.length - 1; l++) { path.add(levels[l][idx].hash); const sib = idx % 2 === 0 ? idx + 1 : idx - 1; prf.add((levels[l][sib] || levels[l][idx]).hash); idx = Math.floor(idx / 2); } path.add(levels[levels.length - 1][0].hash); return { path, prf }; }
          function render(sel) { const w = wrap.querySelector("#mt"); w.innerHTML = ""; const pr = sel >= 0 ? proof(sel) : null; for (let l = levels.length - 1; l >= 0; l--) { const row = el("div", "mrow"); levels[l].forEach((node, i) => { const isLeaf = l === 0, isRoot = l === levels.length - 1; let c = "mnode" + (isLeaf ? " leaf" : isRoot ? " root" : ""); if (pr) { if (pr.path.has(node.hash)) c += " path"; else if (pr.prf.has(node.hash)) c += " proof"; } const n = el("div", c, (isLeaf ? node.label + "<br>" : isRoot ? "ROOT<br>" : "") + short(node.hash, 5, 3)); if (isLeaf) n.onclick = () => { render(i); const sz = proof(i).prf.size; wrap.querySelector("#mM").innerHTML = `To prove <b>${txs[i]}</b> is in this block of ${txs.length}, supply just <b style="color:var(--gold-2)">${sz} gold hashes</b> and re-hash up the path to the root.`; }; row.appendChild(n); }); w.appendChild(row); } } render(-1);
        } },
    ],
    deeper: P("The tree's height is <code>log₂(n)</code>, so a million transactions need ~20 sibling hashes, a billion ~30 — doubling the block adds just one hash to the proof. A fake sibling produces the wrong root, so the proof fails safely even from an untrusted source. <b>Policy hook:</b> immutability proves a record wasn't altered after entry — it says nothing about whether the entry was <i>true</i>. Garbage in, immutable garbage out: the sharp question for any ‘blockchain for transparency’ pitch.") };

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
    ],
    deeper: P("<b>Stablecoins</b> hold a peg — fiat-backed (a dollar in reserve), crypto-backed (over-collateralised), or algorithmic (held by code, and fragile — Terra collapsed). A <b>CBDC</b> is a central bank's own digital currency, and technically the opposite of crypto: centralised, permissioned, fully controlled. The through-line of the whole course: take the referee out and you get money no state can freeze; hand the state the keys and you get the most controllable money in history. The policy question is never the tech — it's who holds the keys.") };

  return L;
})();
