/* ============================================================
   guide.js — the narration. Eight chapters that drive and explain
   the one live network. Plain, concrete, peer-to-peer voice.
   ============================================================ */
window.GUIDE = (function () {
  "use strict";
  const C = window.CHAIN, V = window.VIZ;
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => Math.round(n).toLocaleString();
  let idx = 0; const done = new Set(); let cleanups = [];
  const track = (off) => cleanups.push(off);
  const w = (label, inner) => `<div class="w"><div class="wl">${label}</div>${inner}</div>`;
  const obj = (t) => `<div class="do" id="theObjective"><div class="l">Try this</div><div class="t">${t}</div></div>`;

  const CH = [];

  /* ===== 1 ===== */
  CH.push({ id: "ledger", kick: "Chapter 1 / 8", title: "The ledger no one owns", sub: "Why this exists",
    body() { return `
      <p class="lead">Money is a list of who owns what. The hard part was never the list. It was agreeing on it.</p>
      <p class="p">A bank keeps that list on its own servers, and you trust it to stay honest. A blockchain throws out the trusted keeper and lets a few thousand strangers each hold a copy of one shared list that no single one of them can rewrite. What you're looking at is exactly that, running live: transactions, packed into <span class="k">blocks</span>, mined seconds ago, linked into one growing record.</p>
      <p class="p">The glowing mesh is the network — every node keeps the full ledger. Watch the light travel along it: those are transactions propagating. The cards streaming in are the blocks. They only ever get appended. Never edited.</p>
      ${obj("Let the network run and watch three new blocks join the chain.")}
      ${w("Network", `<div class="btn-row"><button class="btn" id="w1play">Pause / resume</button></div><div class="note" id="w1count" style="margin-top:10px"></div>`)}
      <div class="aside"><div class="h">The real problem</div>With no one in charge, who decides which transactions are real, and in what order? Every chapter after this is a piece of that answer.</div>`; },
    enter(ctx) { if (!C.state.running) C.play(); $("#w1play").onclick = () => C.state.running ? C.pause() : C.play();
      let base = C.state.chain.length; const upd = () => { const m = C.state.chain.length - base; $("#w1count").textContent = `${Math.min(m,3)} of 3 blocks added`; if (m >= 3) ctx.done(); }; upd(); track(C.on("block", upd)); }});

  /* ===== 2 ===== */
  CH.push({ id: "block", kick: "Chapter 2 / 8", title: "Anatomy of a block", sub: "Hashing & headers",
    body() { return `
      <p class="lead">A block is mostly a small header — five fields — plus a list of transactions.</p>
      <p class="p">The header holds the <b>previous block's hash</b>, a <b>Merkle root</b> (one hash that summarizes every transaction inside), a timestamp, the difficulty, and a <span class="k">nonce</span>. Hash that header and you get the block's own ID. Because each block names the one before it, you can't quietly reorder them.</p>
      <p class="p">The function doing the work is <span class="k">SHA-256</span>. Feed it anything, get back 256 bits. Same input, same output, forever. Change one character and roughly half the output bits flip, with no pattern. And it doesn't run backwards. That's why a hash is a tamper seal: alter the data and the fingerprint stops fitting.</p>
      ${obj("Open any block and re-hash its header to confirm the ID is genuine.")}
      ${w("Inspect", `<button class="btn primary block" id="w2open">Open the latest block</button>`)}
      <div class="aside"><div class="h">Try breaking it</div>In the inspector you can also rebuild the Merkle root from the transaction list. Change one transaction and it won't match — and the block's hash won't either.</div>`; },
    enter(ctx) { C.pause(); $("#w2open").onclick = () => V.openInspector(C.state.chain[C.state.chain.length - 1]); V.onInspect(() => ctx.done()); },
    exit() { V.onInspect(null); }});

  /* ===== 3 ===== */
  CH.push({ id: "keys", kick: "Chapter 3 / 8", title: "Your keys", sub: "Identity without accounts",
    body() { return `
      <p class="lead">There are no usernames and no passwords. A private key is the only thing that proves ownership.</p>
      <p class="p">You hold a secret key — a random 256-bit number. From it you derive a <b>public key</b>, and from that a short <b>address</b>. Share the address; it's how people pay you. Guard the private key; it's how you spend. This is <span class="k">ECDSA</span>, the same elliptic-curve signature scheme Bitcoin and Ethereum use, generated for real by your browser right now.</p>
      <p class="p">The math runs one way. The private key signs, the public key checks the signature, and no amount of checking ever reveals the secret. The flip side is unforgiving: lose the key and the money is gone. No reset, no support line. That's the price of having no custodian.</p>
      ${obj("Generate your key pair, then pull some coins from the faucet.")}
      ${w("Your wallet", `<div id="w3empty"><button class="btn primary block lg" id="w3gen">Generate my key pair</button></div>
        <div id="w3show" style="display:none"><div class="kvs"><div class="kv"><span class="k">address</span><span class="v vi" id="w3addr"></span></div><div class="kv"><span class="k">private key</span><span class="v">•••••• kept secret</span></div><div class="kv"><span class="k">balance</span><span class="v gr" id="w3bal">0</span></div></div><button class="btn cyan block" id="w3faucet" style="margin-top:11px">Claim 100 test coins</button></div>`)}`; },
    enter(ctx) { const g = $("#w3gen");
      g.onclick = async () => { const wal = await C.createWallet(); $("#w3empty").style.display = "none"; $("#w3show").style.display = "block"; $("#w3addr").textContent = C.addrShort(wal.address); V.toast("Key pair generated. This is you now."); };
      $("#w3faucet").onclick = () => { C.faucet(100); $("#w3bal").textContent = C.balanceOf(C.state.you.address).toFixed(0); ctx.done(); };
      if (C.state.you) { $("#w3empty").style.display = "none"; $("#w3show").style.display = "block"; $("#w3addr").textContent = C.addrShort(C.state.you.address); $("#w3bal").textContent = C.balanceOf(C.state.you.address).toFixed(0); } }});

  /* ===== 4 ===== */
  CH.push({ id: "send", kick: "Chapter 4 / 8", title: "Sending money", sub: "Signatures, fees, the mempool",
    body() { return `
      <p class="lead">A transaction is a signed instruction: move this much from my address to theirs.</p>
      <p class="p">You sign it with your private key, and the signature covers the exact contents — change the amount afterward and it breaks. The signed transaction lands in the <span class="k">mempool</span>, the waiting room for unconfirmed payments. Miners pick from there.</p>
      <p class="p">They pick by <b>fee</b>. A miner keeps the fees in the block it finds, so higher-fee transactions get chosen first. The moment a block includes yours, that's one confirmation. Spend coins you don't have and the network rejects it outright. Spend the same coins twice and only one survives — and choosing which, with no referee, is exactly what mining settles next.</p>
      ${obj("Sign a transaction and watch the chain confirm it. The block that includes it will open on its own.")}
      ${w("New transaction", `<label class="fld">Amount</label><input class="in mono" id="w4amt" value="25">
        <label class="fld" style="margin-top:11px">Fee &nbsp;<span class="muted" style="text-transform:none;letter-spacing:0">higher confirms sooner</span></label><div class="srow"><input type="range" id="w4fee" min="0.2" max="5" step="0.1" value="1.5"><span class="v" id="w4feev">1.5</span></div>
        <button class="btn primary block" id="w4send" style="margin-top:12px">Sign and broadcast</button><div class="note" id="w4msg" style="margin-top:9px"></div>`)}`; },
    enter(ctx) { if (!C.state.you) C.createWallet().then(() => C.faucet(100)); C.setSpeed(1); C.play();
      const f = $("#w4fee"); f.oninput = () => $("#w4feev").textContent = (+f.value).toFixed(1);
      let mine = null;
      $("#w4send").onclick = async () => { const r = await C.sendTx({ to: "random", amount: +$("#w4amt").value, fee: +f.value }); if (r.error) { $("#w4msg").innerHTML = `<span class="note bad">${r.error}</span>`; return; } mine = r.tx.hash; $("#w4msg").innerHTML = `<span class="note ok">Signed and broadcast.</span> It's in the mempool below, highlighted. Watch for it to be mined.`; V.highlight("#mempool"); };
      track(C.on("block", (b) => { if (mine && b._txObjs && b._txObjs.find(t => t.hash === mine)) { V.toast("Your transaction was confirmed."); V.openInspector(b); ctx.done(); mine = null; } })); }});

  /* ===== 5 ===== */
  CH.push({ id: "pow", kick: "Chapter 5 / 8", title: "Mining", sub: "Proof of work",
    body() { return `
      <p class="lead">Adding a block has to be expensive. Otherwise rewriting history would be free.</p>
      <p class="p">Mining is a guessing game with one rule: find a <span class="k">nonce</span> that makes the block's hash start with a required run of zeros. There's no shortcut, because the hash is unpredictable — you just try numbers, fast. Each extra zero of difficulty makes a winning hash 16 times rarer. The strip up top shows the actual hashes flying by as the network searches.</p>
      <p class="p">Your odds of finding the next block equal your share of the network's hashing. It's a lottery with no memory; no one is ever "due." Win and you take the block reward plus every fee in the block. Real networks quietly retune the difficulty to keep block time roughly constant as miners join and leave.</p>
      <p class="p">Here's the point of all of it: producing a block costs real work, but checking one costs a single hash. That gap is the security. Honest nodes reject fakes for free, and rewriting the past means redoing every block since — faster than the rest of the network combined.</p>
      ${obj("Join as a miner, turn up your hash power, and mine a block under your own name.")}
      ${w("Your rig", `<div class="srow"><span class="nm">Hash power</span><input type="range" id="w5hp" min="5" max="220" value="70"><span class="v" id="w5hpv">70</span></div>
        <div class="srow" style="margin-top:9px"><span class="nm">Difficulty</span><input type="range" id="w5diff" min="3" max="5" value="4"><span class="v" id="w5diffv">4</span></div>
        <div class="note" id="w5share" style="margin:9px 0"></div><button class="btn gold block" id="w5join">Start mining</button>`)}`; },
    enter(ctx) { C.setSpeed(2); if (!C.state.running) C.play();
      const hp = $("#w5hp"), df = $("#w5diff");
      const sh = () => { const tot = C.totalHP() - (C.state.miners.find(m => m.isYou)?.hp || 0) + (+hp.value); $("#w5share").innerHTML = `That's about <b>${Math.round(+hp.value / tot * 100)}%</b> of the network. Expect one win roughly every ${Math.round(tot / +hp.value)} blocks.`; };
      hp.oninput = () => { $("#w5hpv").textContent = hp.value; C.setYourHP(+hp.value); sh(); };
      df.oninput = () => { $("#w5diffv").textContent = df.value; C.setDifficulty(+df.value); };
      $("#w5join").onclick = () => { C.joinAsMiner(+hp.value); sh(); $("#w5join").textContent = "Mining…"; V.toast("You're mining. Watch for a block under your name."); }; sh();
      track(C.on("block", (b) => { if (b.minerIsYou) { V.toast("You mined a block. The reward and fees are yours."); ctx.done(); } })); }});

  /* ===== 6 ===== */
  CH.push({ id: "forks", kick: "Chapter 6 / 8", title: "Forks", sub: "Reaching consensus",
    body() { return `
      <p class="lead">Two miners can solve the same height at the same instant. Now the network disagrees with itself.</p>
      <p class="p">Blocks travel at internet speed, not instantly, so a brief split is normal. This is a <span class="k">fork</span>: two valid chains, same length. The rule that settles it is blunt — keep the chain with the most work behind it. Whichever side gets the next block wins, and everyone switches to it.</p>
      <p class="p">The block on the losing side becomes an <b>orphan</b>, and its transactions fall back into the mempool to be mined again. This is why a fresh payment isn't final. Every block added on top buries it deeper, and the chance of it ever being undone drops sharply. "Wait for six confirmations" is just that idea with a number on it.</p>
      ${obj("Trigger a fork, then resolve it by choosing which branch the next block extends.")}
      ${w("Fork", `<button class="btn primary block" id="w6fork">Trigger a fork at the tip</button>
        <div id="w6resolve" style="display:none;margin-top:11px"><div class="note">Two valid blocks now sit at the same height. Which one gets built on?</div><div class="btn-row" style="margin-top:9px"><button class="btn" id="w6main">Extend the original</button><button class="btn" id="w6alt">Extend the rival</button></div></div>
        <div class="note" id="w6msg" style="margin-top:10px"></div>`)}`; },
    enter(ctx) { C.pause();
      $("#w6fork").onclick = () => { C.demoFork(); $("#w6resolve").style.display = "block"; $("#w6fork").disabled = true; $("#w6msg").innerHTML = `<span class="note">Two tips at the same height. The network is briefly undecided.</span>`; };
      const r = () => { C.resolveFork(true); $("#w6msg").innerHTML = `<span class="note ok">Settled by the longest-chain rule. The losing block is orphaned and its transactions return to the mempool.</span>`; $("#w6main").disabled = $("#w6alt").disabled = true; ctx.done(); };
      $("#w6main").onclick = r; $("#w6alt").onclick = r; }});

  /* ===== 7 ===== */
  CH.push({ id: "attack", kick: "Chapter 7 / 8", title: "The 51% attack", sub: "Where security comes from",
    body() { return `
      <p class="lead">The whole system rests on one assumption: no one controls most of the mining.</p>
      <p class="p">Picture buying a car for a million. The dealer waits a few confirmations, then hands you the keys. Your move: quietly mine your own version of the chain that leaves the payment out, and once it's longer than the real one, publish it. The network adopts the longer chain, your payment disappears, and you drive off.</p>
      <p class="p">Whether it works comes down to two numbers — your share of the hashing, and how many confirmations the dealer waited. Below half the network, your odds of catching up fall off exponentially with each confirmation. That's the gambler's-ruin result from Satoshi's whitepaper, and it's computed live below. At half or more, it stops being a gamble: you are the longest chain.</p>
      <p class="p">Even then, a majority only lets you reverse your own recent payments and stall others. You can't forge a signature, mint a coin, or rewrite deep history. The real defense isn't in the code. It's that no one owns half the machines.</p>
      ${obj("Set your power and the merchant's confirmations, read the odds, then run an attack.")}
      ${w("Attack console", `<div class="srow"><span class="nm">Your power</span><input type="range" id="w7q" min="5" max="90" value="30"><span class="v" id="w7qv">30%</span></div>
        <div class="srow" style="margin-top:9px"><span class="nm">Confirmations</span><input type="range" id="w7z" min="0" max="12" value="6"><span class="v" id="w7zv">6</span></div>
        <div style="text-align:center;margin:13px 0"><div class="note">chance the attack eventually succeeds</div><div class="mono" id="w7p" style="font-size:40px;font-weight:700;letter-spacing:-.02em">—</div></div>
        <div id="w7race"></div><button class="btn danger block" id="w7run" style="margin-top:11px">Run the attack</button><div class="note" id="w7msg" style="margin-top:9px"></div>`)}`; },
    enter(ctx) { C.pause(); const q = $("#w7q"), z = $("#w7z");
      const upd = () => { $("#w7qv").textContent = q.value + "%"; $("#w7zv").textContent = z.value; const P = C.attackProb(+q.value / 100, +z.value); const e = $("#w7p"); e.textContent = P >= .5 ? Math.round(P * 100) + "%" : P < 1e-4 ? "<0.01%" : (P * 100).toPrecision(2) + "%"; e.style.color = P > .01 ? "var(--red)" : "var(--green)"; };
      q.oninput = upd; z.oninput = upd; upd();
      $("#w7race").innerHTML = `<div class="srow" style="gap:8px"><span class="nm" style="width:64px;color:var(--green)">Honest</span><div style="flex:1;height:16px;background:rgba(255,255,255,.08);border-radius:7px;overflow:hidden"><i id="w7h" style="display:block;height:100%;width:0;background:var(--green)"></i></div><span class="v" style="width:26px;color:var(--green)" id="w7hn">0</span></div>
        <div class="srow" style="gap:8px;margin-top:6px"><span class="nm" style="width:64px;color:var(--red)">You</span><div style="flex:1;height:16px;background:rgba(255,255,255,.08);border-radius:7px;overflow:hidden"><i id="w7e" style="display:block;height:100%;width:0;background:var(--red)"></i></div><span class="v" style="width:26px;color:var(--red)" id="w7en">0</span></div>`;
      let run = false;
      $("#w7run").onclick = () => { if (run) return; run = true; const qf = +q.value / 100; let h = +z.value, e = 0, t = 0; const hf = $("#w7h"), ef = $("#w7e");
        const step = () => { t++; Math.random() < qf ? e++ : h++; const sc = Math.max(h, e, +z.value + 3); hf.style.width = h / sc * 100 + "%"; ef.style.width = e / sc * 100 + "%"; $("#w7hn").textContent = h; $("#w7en").textContent = e;
          if (e > h) { $("#w7msg").innerHTML = `<span class="note bad">Your chain overtook the honest one. The payment is reversed.</span>`; run = false; ctx.done(); return; }
          if (t > 220 || (qf < .5 && h - e > 22)) { $("#w7msg").innerHTML = `<span class="note ok">The honest chain pulled away. Attack failed.</span> Run it again — luck varies, but the odds above are the long-run truth.`; run = false; ctx.done(); return; }
          setTimeout(step, 42); }; step(); }; }});

  /* ===== 8 ===== */
  CH.push({ id: "beyond", kick: "Chapter 8 / 8", title: "Proof of stake, and beyond", sub: "The frontier",
    body() { return `
      <p class="lead">Proof of work spends electricity to stay honest. There's another way to make honesty pay.</p>
      <p class="p">Proof of stake swaps hardware for collateral. Validators lock up coins, and the protocol picks one to propose each block, weighted by how much they've staked. Behave and you earn. Cheat and the network destroys your deposit — that's <span class="k">slashing</span>. It's the same trick as mining, a scarce resource you'd lose by attacking, except the resource is money rather than energy. Ethereum switched in 2022 and dropped its energy use by about 99.95%.</p>
      ${obj("Switch the live network to proof of stake and watch the energy meter collapse.")}
      ${w("Consensus engine", `<div class="btn-row"><button class="btn" id="w8pow">Proof of work</button><button class="btn primary" id="w8pos">Proof of stake</button></div>
        <div class="srow" style="margin-top:13px"><span class="nm">Energy</span><div style="flex:1;height:16px;background:rgba(255,255,255,.08);border-radius:7px;overflow:hidden"><i id="w8en" style="display:block;height:100%;width:100%;background:var(--gold);transition:width .7s,background .7s"></i></div><span class="v" id="w8env" style="color:var(--gold)">100%</span></div>`)}
      <p class="sub">Where it goes from here</p>
      <p class="p">Everything ahead is built from the parts you just used. <b>Rollups</b> bundle thousands of transactions and post a single proof to the main chain; <b>zero-knowledge proofs</b> let that proof reveal nothing but its own validity. <b>Smart contracts</b> turn the ledger into a programmable platform. <b>Tokenization</b> puts real assets — treasuries, property — on-chain. <b>Central bank digital currencies</b> do the reverse of all this: one issuer, total control. And regulation, from the EU's MiCA to India's tax regime, decides how much of it ever reaches you.</p>
      <div class="aside"><div class="h">You ran the whole thing</div>A shared ledger, hashed and chained, signed transactions, mining, forks, the 51% line, and stake. The point was never the coin. It was getting strangers to agree on one history with no one in charge.</div>`; },
    enter(ctx) { if (!C.state.running) C.play(); C.setSpeed(2);
      const set = (v, col) => { $("#w8en").style.width = v + "%"; $("#w8en").style.background = col; $("#w8env").textContent = v < 1 ? "~0%" : v + "%"; $("#w8env").style.color = col; };
      $("#w8pow").onclick = () => { C.setMode("pow"); $("#w8pow").className = "btn primary"; $("#w8pos").className = "btn"; set(100, "var(--gold)"); };
      $("#w8pos").onclick = () => { C.setMode("pos"); $("#w8pos").className = "btn primary"; $("#w8pow").className = "btn"; set(0.5, "var(--green)"); V.toast("Now running proof of stake. No hashing."); ctx.done(); };
      $("#w8pow").className = "btn"; }});

  /* ---- shell ---- */
  function renderRail() {
    const r = $("#rail"); r.innerHTML = `<div class="rail-kicker">The journey</div>`;
    CH.forEach((c, i) => {
      const node = document.createElement("div");
      node.className = "chap" + (i === idx ? " cur" : "") + (done.has(c.id) ? " done" : "");
      node.innerHTML = `${i < CH.length - 1 ? '<div class="rail-line"></div>' : ''}<div class="ix">${done.has(c.id) ? "✓" : i + 1}</div><div class="tx"><div class="t">${c.title}</div><div class="s">${c.sub}</div></div>`;
      node.onclick = () => go(i); r.appendChild(node);
    });
  }
  function go(i) {
    if (CH[idx] && CH[idx].exit) try { CH[idx].exit(); } catch (e) {}
    cleanups.forEach(fn => { try { fn(); } catch (e) {} }); cleanups = [];
    idx = Math.max(0, Math.min(CH.length - 1, i));
    const c = CH[idx];
    $("#narrKick").textContent = c.kick; $("#narrTitle").textContent = c.title;
    const body = $("#narrBody"); body.innerHTML = c.body(); body.scrollTop = 0; body.classList.remove("fadein"); void body.offsetWidth; body.classList.add("fadein");
    $("#gPrev").disabled = idx === 0;
    const nx = $("#gNext"); nx.disabled = idx === CH.length - 1; nx.textContent = idx === CH.length - 1 ? "Done" : "Next"; nx.classList.toggle("ready", done.has(c.id));
    const ctx = { done: () => { if (!done.has(c.id)) { done.add(c.id); renderRail(); $("#gNext").classList.add("ready"); const o = $("#theObjective"); if (o) { o.classList.add("done"); o.querySelector(".l").textContent = "Done"; } } } };
    try { c.enter && c.enter(ctx); } catch (e) { console.error("enter", c.id, e); }
    renderRail();
  }
  function init() { $("#gPrev").onclick = () => go(idx - 1); $("#gNext").onclick = () => go(idx + 1); renderRail(); go(0); }
  return { init, go, CH };
})();
