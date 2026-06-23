/* ============================================================
   chain.js — a real (toy) blockchain that actually runs.
   Real SHA-256 Proof-of-Work, real ECDSA transactions, an account
   ledger, simulated miners, a live mempool. Everything the UI shows
   is computed here. Emits events the visualization subscribes to.
   ============================================================ */
window.CHAIN = (function () {
  "use strict";
  const subtle = window.crypto && window.crypto.subtle;
  const hasSubtle = !!(subtle && subtle.generateKey);
  const hexOf = (buf) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");

  /* ---- event bus ---- */
  const listeners = {};
  function on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); return () => { listeners[ev] = listeners[ev].filter(f => f !== fn); }; }
  function emit(ev, d) { (listeners[ev] || []).forEach(fn => { try { fn(d); } catch (e) { console.error(e); } }); }

  const MINER_COLORS = ["#f3920b", "#0bb5c9", "#10b981", "#f43f5e", "#a855f7", "#2f6df6"];
  const SIM_NAMES = ["Alice", "Bob", "Carol", "Dmitri", "Esha", "Faruq", "Gita", "Hiro"];

  const state = {
    chain: [],            // confirmed blocks (linear main chain)
    orphans: [],          // orphaned block hashes (for fork demo)
    fork: null,           // transient competing tip {block}
    mempool: [],          // pending txs
    accounts: {},         // addr -> {balance, sent, label, color, isYou}
    miners: [],           // {id, name, color, hp, isYou}
    difficulty: 4,        // leading hex zeros
    mode: "pow",          // 'pow' | 'pos'
    reward: 50,
    maxTxPerBlock: 5,
    running: false,
    speed: 1,             // 0.5 .. 4
    you: null,            // {address, keyPair, pubHex}
    stats: { hashes: 0, hps: 0, lastBlockTime: 0, avgBlockTime: 0, energy: 100 },
    // mining work
    _tpl: null, _nonce: 0, _winnerPreview: "", _lastTickHashes: 0, _lastTs: 0,
  };

  /* ---- helpers ---- */
  const now = () => Date.now();
  const target = () => "0".repeat(state.difficulty);
  function merkleRoot(items) {
    if (!items.length) return sha256("∅");
    let lvl = items.map(x => sha256(x));
    while (lvl.length > 1) { const n = []; for (let i = 0; i < lvl.length; i += 2) n.push(sha256(lvl[i] + (lvl[i + 1] || lvl[i]))); lvl = n; }
    return lvl[0];
  }
  function txStr(tx) { return `${tx.from}>${tx.to}:${tx.amount}f${tx.fee}n${tx.nonce}`; }
  function headerStr(b) { return `${b.height}|${b.prevHash}|${b.merkleRoot}|${b.timestamp}|${b.difficulty}|${b.nonce}`; }
  function hashBlock(b) { return sha256(headerStr(b)); }
  const addrShort = (a) => a.slice(0, 6) + "…" + a.slice(-4);

  /* ---- genesis & sim world ---- */
  function makeAccount(label, balance, color, isYou) {
    const addr = "0x" + sha256(label + Math.random() + now()).slice(-40);
    state.accounts[addr] = { balance, sent: 0, label, color: color || "#8b93ad", isYou: !!isYou };
    return addr;
  }
  function genesis() {
    const g = { height: 0, prevHash: "0".repeat(64), timestamp: now(), txs: ["genesis"], difficulty: state.difficulty, nonce: 0, minerName: "Satoshi", minerColor: "#121624" };
    g.merkleRoot = merkleRoot(g.txs);
    while (!hashBlock(g).startsWith("000")) g.nonce++;
    g.hash = hashBlock(g);
    return g;
  }
  function init() {
    state.chain = [genesis()];
    // simulated participants double as miners + accounts
    state.miners = [];
    const hps = [30, 22, 18, 14, 10]; // relative hash power
    for (let i = 0; i < 5; i++) {
      const addr = makeAccount(SIM_NAMES[i], 200 + ((i * 137) % 300), MINER_COLORS[i % MINER_COLORS.length]);
      state.miners.push({ id: i, name: SIM_NAMES[i], color: MINER_COLORS[i % MINER_COLORS.length], hp: hps[i], isYou: false, addr });
    }
    newTemplate();
    seedMempool(3);
  }

  function totalHP() { return state.miners.reduce((a, m) => a + m.hp, 0); }

  /* ---- transactions ---- */
  function pendingOut(addr) { return state.mempool.filter(t => t.from === addr).reduce((a, t) => a + t.amount + t.fee, 0); }
  function spendable(addr) { const a = state.accounts[addr]; return a ? a.balance - pendingOut(addr) : 0; }

  function seedMempool(n) { for (let i = 0; i < n; i++) addNoiseTx(); }
  function addNoiseTx() {
    const addrs = Object.keys(state.accounts).filter(a => !state.accounts[a].isYou && state.accounts[a].balance > 5);
    if (addrs.length < 2) return;
    const from = addrs[(Math.random() * addrs.length) | 0];
    let to = addrs[(Math.random() * addrs.length) | 0]; let guard = 0;
    while (to === from && guard++ < 5) to = addrs[(Math.random() * addrs.length) | 0];
    const max = Math.max(1, Math.min(spendable(from) - 1, 40));
    const amount = +(1 + Math.random() * max).toFixed(2);
    const fee = +(0.1 + Math.random() * 1.4).toFixed(2);
    if (amount + fee > spendable(from)) return;
    const tx = { from, to, amount, fee, nonce: state.accounts[from].sent, ts: now(), sim: true, valid: true };
    tx.hash = sha256(txStr(tx) + tx.ts);
    state.accounts[from].sent++;
    state.mempool.push(tx); emit("mempool", state.mempool);
  }

  async function createWallet() {
    let keyPair = null, pubHex;
    if (hasSubtle) { keyPair = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]); pubHex = hexOf(await subtle.exportKey("raw", keyPair.publicKey)); }
    else { const p = sha256("p" + Math.random()); keyPair = { _p: p }; pubHex = sha256(p); }
    const address = "0x" + sha256(pubHex).slice(-40);
    state.accounts[address] = { balance: 0, sent: 0, label: "You", color: "#5b5bf0", isYou: true };
    state.you = { address, keyPair, pubHex };
    emit("wallet", state.you); emit("accounts", state.accounts);
    return state.you;
  }
  function faucet(amount) { if (!state.you) return; state.accounts[state.you.address].balance += amount; emit("accounts", state.accounts); emit("balance", balanceOf(state.you.address)); }
  function balanceOf(addr) { return state.accounts[addr] ? state.accounts[addr].balance : 0; }

  async function sign(message) {
    if (hasSubtle && state.you.keyPair.privateKey) { const sig = await subtle.sign({ name: "ECDSA", hash: "SHA-256" }, state.you.keyPair.privateKey, new TextEncoder().encode(message)); return hexOf(sig); }
    return sha256(state.you.keyPair._p + message);
  }
  async function verify(pubKeyOrYou, message, sigHex) {
    if (hasSubtle && state.you && state.you.keyPair.publicKey) { const sigBuf = new Uint8Array(sigHex.match(/../g).map(h => parseInt(h, 16))); return subtle.verify({ name: "ECDSA", hash: "SHA-256" }, state.you.keyPair.publicKey, sigBuf, new TextEncoder().encode(message)); }
    return sigHex === sha256(state.you.keyPair._p + message);
  }

  // send a signed tx from the user. opts: {to, amount, fee, allowOverspend}
  async function sendTx({ to, amount, fee = 0.5, allowOverspend = false, toLabel }) {
    if (!state.you) throw new Error("no wallet");
    amount = +amount; fee = +fee;
    const from = state.you.address;
    let toAddr = to;
    if (!to || to === "random") { const others = Object.keys(state.accounts).filter(a => a !== from); toAddr = others[(Math.random() * others.length) | 0]; }
    if (!allowOverspend && amount + fee > spendable(from)) return { error: `Insufficient spendable balance (${spendable(from).toFixed(2)} available).` };
    const tx = { from, to: toAddr, amount, fee, nonce: state.accounts[from].sent, ts: now(), sim: false };
    const msg = txStr(tx);
    tx.sig = await sign(msg); tx.valid = true; tx.mine = true; tx.toLabel = toLabel;
    tx.hash = sha256(msg + tx.ts);
    state.accounts[from].sent++;
    state.mempool.push(tx); emit("mempool", state.mempool); emit("tx", tx);
    return { tx };
  }

  /* ---- mining ---- */
  function newTemplate() {
    const tip = state.chain[state.chain.length - 1];
    // pick highest-fee txs first
    const txs = state.mempool.slice().sort((a, b) => b.fee - a.fee).slice(0, state.maxTxPerBlock);
    const tpl = { height: tip.height + 1, prevHash: tip.hash, timestamp: now(), difficulty: state.difficulty, nonce: 0, _txObjs: txs };
    tpl.txs = txs.map(txStr);
    tpl.merkleRoot = merkleRoot(tpl.txs.length ? tpl.txs : ["empty"]);
    state._tpl = tpl; state._nonce = 0;
  }
  function pickFinder() { let r = Math.random() * totalHP(); for (const m of state.miners) { if (r < m.hp) return m; r -= m.hp; } return state.miners[state.miners.length - 1]; }

  function applyBlock(block) {
    // apply txs to ledger
    (block._txObjs || []).forEach(tx => {
      const s = state.accounts[tx.from], r = state.accounts[tx.to];
      if (!s) return;
      if (s.balance >= tx.amount + tx.fee) {
        s.balance -= (tx.amount + tx.fee);
        if (r) r.balance += tx.amount;
        const finder = state.accounts[block.minerAddr]; if (finder) finder.balance += tx.fee;
      } else { tx.rejected = true; }
    });
    // block reward
    if (block.minerAddr && state.accounts[block.minerAddr]) state.accounts[block.minerAddr].balance += state.reward;
    // remove included txs from mempool (only the non-rejected)
    const incl = new Set((block._txObjs || []).map(t => t.hash));
    state.mempool = state.mempool.filter(t => !incl.has(t.hash));
  }

  function finalizeBlock(finder) {
    const tpl = state._tpl;
    const block = { ...tpl, hash: hashBlock(tpl), minerName: finder.name, minerColor: finder.color, minerAddr: finder.addr, minerIsYou: finder.isYou };
    delete block._txObjs; block._txObjs = tpl._txObjs;
    state.chain.push(block);
    applyBlock(block);
    const t = now(); const dt = state.stats.lastBlockTime ? (t - state.stats.lastBlockTime) / 1000 : 0;
    state.stats.lastBlockTime = t; state.stats.avgBlockTime = state.stats.avgBlockTime ? state.stats.avgBlockTime * 0.7 + dt * 0.3 : dt;
    emit("block", block); emit("accounts", state.accounts); emit("mempool", state.mempool);
    if (state.you) emit("balance", balanceOf(state.you.address));
    newTemplate();
    // occasional noise so the mempool keeps flowing
    if (Math.random() < 0.8) addNoiseTx();
    if (Math.random() < 0.4) addNoiseTx();
  }

  let _loop = null, _noiseT = 0;
  function tick() {
    if (!state.running) return;
    const t0 = performance.now();
    if (state.mode === "pow") {
      // Scale work to elapsed wall-time so block time stays consistent
      // regardless of how often the timer actually fires (tab throttling, slow CPU).
      const nowp = performance.now();
      let raw = (nowp - state._lastTs) / 1000;
      if (!(raw > 0)) raw = 0.016;
      state._lastTs = nowp;
      const dt = Math.min(raw, 0.5);                      // bound batch after a stall
      const targetRate = 62000 * state.speed;            // hashes/sec target
      const batch = Math.min(28000, Math.max(300, Math.round(targetRate * dt)));
      let found = false, finder = null;
      for (let i = 0; i < batch; i++) {
        state._nonce++; state._tpl.nonce = state._nonce; state.stats.hashes++;
        const h = hashBlock(state._tpl);
        if (i === batch - 1) state._winnerPreview = h;
        if (h.startsWith(target())) { found = true; finder = pickFinder(); break; }
      }
      const realRate = batch / raw;                       // honest hashrate
      state.stats.hps = state.stats.hps ? state.stats.hps * 0.7 + realRate * 0.3 : realRate;
      emit("tick", { nonce: state._nonce, preview: state._winnerPreview, hps: state.stats.hps });
      if (found) finalizeBlock(finder);
    } else { // PoS: choose proposer by stake every ~targetBlockTime
      _noiseT += 16 * state.speed;
      if (_noiseT > 1400) { _noiseT = 0; const finder = pickFinder(); state._tpl.nonce = (Math.random() * 1e6) | 0; finalizeBlock(finder); }
      state.stats.energy = 0.05; emit("tick", { nonce: 0, preview: "proof-of-stake — no hashing", hps: 0 });
    }
    _loop = setTimeout(tick, 16);
  }
  function play() { if (state.running) return; state.running = true; state._lastTs = performance.now(); emit("running", true); tick(); }
  function pause() { state.running = false; clearTimeout(_loop); emit("running", false); }
  function setSpeed(s) { state.speed = s; emit("speed", s); }
  function setDifficulty(d) { state.difficulty = d; state._tpl.difficulty = d; emit("difficulty", d); }
  function setMode(m) { state.mode = m; if (m === "pos") state.stats.energy = 0.05; else state.stats.energy = 100; emit("mode", m); }
  function stepBlock() { // mine exactly one block (used when paused)
    const wasRunning = state.running; state.running = true;
    if (state.mode === "pos") { finalizeBlock(pickFinder()); }
    else { let guard = 0; while (guard++ < 5e6) { state._nonce++; state._tpl.nonce = state._nonce; state.stats.hashes++; if (hashBlock(state._tpl).startsWith(target())) { finalizeBlock(pickFinder()); break; } } }
    state.running = wasRunning; if (!wasRunning) emit("tick", { nonce: state._nonce, preview: state._winnerPreview, hps: 0 });
  }

  /* ---- you as a miner ---- */
  function joinAsMiner(hp) {
    if (!state.you) return;
    let me = state.miners.find(m => m.isYou);
    if (!me) { me = { id: 99, name: "You", color: "#5b5bf0", hp, isYou: true, addr: state.you.address }; state.miners.push(me); }
    else me.hp = hp;
    emit("miners", state.miners);
  }
  function setYourHP(hp) { const me = state.miners.find(m => m.isYou); if (me) { me.hp = hp; emit("miners", state.miners); } }
  function yourShare() { const me = state.miners.find(m => m.isYou); return me ? me.hp / totalHP() : 0; }

  /* ---- fork demonstration ---- */
  function demoFork() {
    // create a competing block at the current tip's height, mined by a different miner
    const parent = state.chain[state.chain.length - 2] || state.chain[0];
    const tip = state.chain[state.chain.length - 1];
    const alt = { height: tip.height, prevHash: tip.prevHash, timestamp: now(), difficulty: state.difficulty, nonce: 0, txs: ["competing block"], minerName: "Pool-Z", minerColor: "#a855f7" };
    alt.merkleRoot = merkleRoot(alt.txs);
    while (!hashBlock(alt).startsWith(target().slice(0, Math.max(2, state.difficulty - 1)))) alt.nonce++;
    alt.hash = hashBlock(alt);
    state.fork = alt; emit("fork", { tip, alt }); return alt;
  }
  function resolveFork(winnerIsMain) {
    if (!state.fork) return;
    if (!winnerIsMain) { // reorg: alt becomes part of main, old tip orphaned
      const old = state.chain.pop(); state.orphans.push(old.hash);
      state.chain.push(state.fork);
    } else { state.orphans.push(state.fork.hash); }
    const resolved = state.fork; state.fork = null; emit("reorg", { winnerIsMain }); newTemplate(); emit("block", state.chain[state.chain.length - 1]);
    return resolved;
  }

  /* ---- 51% attack probability (Nakamoto, whitepaper §11) ---- */
  function attackProb(q, z) { const p = 1 - q; if (q >= p) return 1; const lam = z * (q / p); let s = 0, po = Math.exp(-lam); for (let k = 0; k <= z; k++) { if (k > 0) po *= lam / k; s += po * (1 - Math.pow(q / p, z - k)); } return 1 - s; }

  return {
    state, on, init, play, pause, setSpeed, setDifficulty, setMode, stepBlock,
    createWallet, faucet, sendTx, balanceOf, spendable, addrShort,
    joinAsMiner, setYourHP, yourShare, totalHP,
    demoFork, resolveFork, attackProb,
    merkleRoot, hashBlock, headerStr, target, addNoiseTx, hasSubtle,
  };
})();
