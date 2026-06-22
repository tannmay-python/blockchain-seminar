/* ============================================================
   labs.js — Consensus, from the ground up. Six gamified labs.
   1. Double-spend problem  2. The mining puzzle  3. Mining race
   4. Forks & longest chain  5. 51% attack game  6. PoS & slashing
   Depends on window.sha256.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const fmt = (n) => n.toLocaleString();
  // split a hash into its leading-zero run and the rest, for highlighting
  function splitZeros(hash, want) {
    let z = 0; while (z < hash.length && hash[z] === "0") z++;
    const matched = Math.min(z, hash.length);
    return `<span class="lead-zeros">${hash.slice(0, matched)}</span><span class="rest">${hash.slice(matched)}</span>`;
  }

  /* =========================================================
     LAB 1 — THE DOUBLE-SPEND PROBLEM
     Why consensus must exist at all.
  ========================================================= */
  (function doubleSpend() {
    const host = $("labDoubleSpend"); if (!host) return;
    host.innerHTML = `
      <p class="lab-q">You have <b>1 coin</b>. There is <b>no bank</b>. What stops you from spending it twice — paying two different people with the same coin before anyone notices?</p>
      <div class="ds-stage">
        <div class="actor" id="dsAlice"><div class="ava">🧑‍💻</div><div class="who">You (Alice)</div><div class="bal" id="dsBal">balance: 1.0 coin</div></div>
        <div style="text-align:center"><div id="dsArrows" class="note">signs &amp; broadcasts →</div></div>
        <div>
          <div class="actor" id="dsBob"><div class="ava">🏪</div><div class="who">Bob's shop</div><div class="bal" id="dsBobState">waiting…</div></div>
          <div class="actor mt-s" id="dsCarol"><div class="ava">🚗</div><div class="who">Carol's dealership</div><div class="bal" id="dsCarolState">waiting…</div></div>
        </div>
      </div>
      <div class="flex gap wrap mt">
        <button class="btn-xl cy" id="dsStep1">1 · Sign &amp; pay Bob</button>
        <button class="btn-xl red" id="dsStep2" disabled>2 · Pay Carol with the SAME coin</button>
        <button class="btn-xl ghost" id="dsReset">Reset</button>
      </div>
      <div class="log-feed mt" id="dsLog"><div class="info">// mempool — pending transactions</div></div>
      <div class="lab-takeaway" id="dsTake" style="display:none"></div>`;
    const log = (h, c) => { const d = el("div", c, h); $("dsLog").appendChild(d); $("dsLog").scrollTop = 1e9; };
    let paidBob = false;
    $("dsStep1").onclick = () => {
      paidBob = true;
      log(`tx1: Alice → Bob, 1.0 coin · <span style="color:var(--green)">signature VALID ✓</span>`, "");
      $("dsBobState").textContent = "sees tx1 → ships goods 📦";
      $("dsBob").style.borderColor = "var(--green)";
      $("dsStep2").disabled = false;
      $("dsStep1").disabled = true;
    };
    $("dsStep2").onclick = () => {
      log(`tx2: Alice → Carol, 1.0 coin <span style="color:var(--gold)">(SAME coin as tx1)</span> · <span style="color:var(--green)">signature VALID ✓</span>`, "");
      log(`⚠ Both signatures are cryptographically valid. Crypto proves Alice authorized both — but NOT which is "first".`, "warn");
      $("dsCarolState").textContent = "sees tx2 → ships car 🚗";
      $("dsCarol").style.borderColor = "var(--red)";
      $("dsAlice").classList.add("dupe");
      $("dsBal").innerHTML = `spent <b style="color:var(--red)">2.0</b> with only 1.0!`;
      log(`💥 Alice received goods from BOTH. The single coin was spent twice.`, "bad");
      $("dsStep2").disabled = true;
      const t = $("dsTake");
      t.style.display = "block";
      t.innerHTML = `Signatures prove <b>authorization</b>, not <b>ordering</b>. A bank would simply reject the second spend — but there is no bank. The network must somehow agree on <b>one</b> canonical, ordered history of transactions. Making that agreement <b>expensive to forge</b> is exactly the job of a consensus mechanism like Proof of Work. That's what the next labs build.`;
    };
    $("dsReset").onclick = () => doubleSpend.reset();
    doubleSpend.reset = () => {
      paidBob = false;
      $("dsLog").innerHTML = `<div class="info">// mempool — pending transactions</div>`;
      $("dsBobState").textContent = "waiting…"; $("dsCarolState").textContent = "waiting…";
      $("dsBob").style.borderColor = ""; $("dsCarol").style.borderColor = "";
      $("dsAlice").classList.remove("dupe"); $("dsBal").textContent = "balance: 1.0 coin";
      $("dsStep1").disabled = false; $("dsStep2").disabled = true; $("dsTake").style.display = "none";
    };
  })();

  /* =========================================================
     LAB 2 — THE MINING PUZZLE
     Brute-force a nonce so hash starts with N zeros.
  ========================================================= */
  (function puzzle() {
    const host = $("labPuzzle"); if (!host) return;
    const BLOCK_DATA = "Alice→Bob 5₿; Carol→Dan 2₿";
    const PREV = "00000000a3f2c1";
    let difficulty = 2, nonce = 0, attempts = 0, mining = false, startT = 0;

    host.innerHTML = `
      <p class="lab-q">A block is only valid if <code>SHA-256(block + nonce)</code> starts with a required number of <b>zeros</b>. The hash is unpredictable, so the <b>only</b> way to find a winning nonce is to try them one by one. Verifying the answer takes a single hash. <b>That asymmetry is the whole game.</b></p>
      <div class="puzzle-grid">
        <div>
          <label class="fld">Block contents (fixed)</label>
          <div class="attempt-hash" style="font-size:13px">${BLOCK_DATA}<br><span class="rest">prev: ${PREV}…</span></div>
          <div class="mt">
            <div class="target-vis">Target — hash must start with <span class="req" id="pzTargetTxt">00</span></div>
            <div class="slider-row mt-s">
              <span class="note">Difficulty</span>
              <input type="range" id="pzDiff" min="1" max="5" value="2">
              <span class="val" id="pzDiffVal" style="color:var(--gold)">2</span>
            </div>
            <div class="diff-stat mt">
              <div class="s"><span class="n" id="pzExpected">256</span><span class="l">expected tries (16^N)</span></div>
              <div class="s"><span class="n" id="pzAttempts">0</span><span class="l">your tries so far</span></div>
            </div>
          </div>
        </div>
        <div>
          <div class="nonce-display"><span class="lbl">CURRENT NONCE</span><span id="pzNonce">0</span></div>
          <div class="attempt-hash mt" id="pzHash"></div>
          <div class="verdict fail" id="pzVerdict">—</div>
          <div class="hashrate mt center" id="pzRate" style="display:none"><span class="big" id="pzRateN">0</span> hashes/sec</div>
        </div>
      </div>
      <div class="flex gap wrap mt">
        <button class="btn-xl gold go" id="pzTry">⛏ Try +1 nonce</button>
        <button class="btn-xl ghost" id="pzTry500">Jump 500 tries</button>
        <button class="btn-xl vi" id="pzAuto">🚀 Auto-mine</button>
        <button class="btn-xl ghost" id="pzReset">Reset</button>
      </div>
      <div class="lab-takeaway">A miner does nothing clever — it just guesses nonces astronomically fast. At Bitcoin's real difficulty the network makes <b>~700 quintillion guesses every second</b>. Raising difficulty by one hex zero makes the puzzle <b>16× harder</b>, which is how the protocol keeps blocks ~10 minutes apart as more miners join.</div>`;

    const target = () => "0".repeat(difficulty);
    function render() {
      const h = sha256(BLOCK_DATA + PREV + nonce);
      $("pzNonce").textContent = fmt(nonce);
      $("pzAttempts").textContent = fmt(attempts);
      const hashEl = $("pzHash");
      hashEl.innerHTML = splitZeros(h, difficulty);
      const ok = h.startsWith(target());
      const v = $("pzVerdict");
      if (ok) {
        v.className = "verdict win";
        v.innerHTML = `🏆 GOLDEN NONCE after ${fmt(attempts)} tries (expected ~${fmt(Math.pow(16, difficulty))})`;
        hashEl.classList.add("win");
      } else {
        v.className = "verdict fail";
        v.innerHTML = `✘ starts with "${h.slice(0, difficulty)}" — need "${target()}". Keep guessing.`;
        hashEl.classList.remove("win");
      }
      return ok;
    }
    function setDiff(d) {
      difficulty = d;
      $("pzDiffVal").textContent = d; $("pzTargetTxt").textContent = "0".repeat(d);
      $("pzExpected").textContent = fmt(Math.pow(16, d));
    }
    $("pzDiff").oninput = (e) => { setDiff(+e.target.value); render(); };
    $("pzTry").onclick = () => { if (mining) return; nonce++; attempts++; render(); };
    $("pzTry500").onclick = () => {
      if (mining) return;
      for (let i = 0; i < 500; i++) { nonce++; attempts++; if (sha256(BLOCK_DATA + PREV + nonce).startsWith(target())) break; }
      render();
    };
    $("pzAuto").onclick = () => {
      if (mining) { mining = false; $("pzAuto").innerHTML = "🚀 Auto-mine"; return; }
      mining = true; $("pzAuto").innerHTML = "⏸ Stop"; startT = performance.now();
      const batch = 2500;
      const step = () => {
        if (!mining) return;
        let found = false;
        for (let i = 0; i < batch; i++) {
          nonce++; attempts++;
          if (sha256(BLOCK_DATA + PREV + nonce).startsWith(target())) { found = true; break; }
        }
        const secs = (performance.now() - startT) / 1000;
        $("pzRate").style.display = "block";
        $("pzRateN").textContent = fmt(Math.round(attempts / Math.max(secs, 0.001)));
        render();
        if (found) { mining = false; $("pzAuto").innerHTML = "🚀 Auto-mine"; return; }
        setTimeout(step, 0);
      };
      setTimeout(step, 0);
    };
    $("pzReset").onclick = () => { mining = false; nonce = 0; attempts = 0; $("pzAuto").innerHTML = "🚀 Auto-mine"; $("pzRate").style.display = "none"; render(); };
    setDiff(2); render();
  })();

  /* =========================================================
     LAB 3 — THE MINING RACE  (hashpower = win probability)
  ========================================================= */
  (function race() {
    const host = $("labRace"); if (!host) return;
    let miners = [
      { n: "You", p: 25, c: "#34e1d4", wins: 0 },
      { n: "Pool B", p: 35, c: "#8b7bff", wins: 0 },
      { n: "Pool C", p: 40, c: "#ffcf6b", wins: 0 }
    ];
    let totalBlocks = 0, racing = false;

    host.innerHTML = `
      <p class="lab-q">Mining is a <b>memoryless lottery</b>. Each guess is independent, so your chance of finding the next block equals your share of the network's total hash power. Set the hash power, then watch reward share converge to it.</p>
      <div id="raceSliders"></div>
      <div class="race-track mt" id="raceTrack"></div>
      <div class="mt"><div class="note mb">Blocks won (<span id="raceTotal">0</span> mined) — does the split match the hash-power split above?</div><div class="tally-bar" id="raceTally"></div></div>
      <div class="flex gap wrap mt">
        <button class="btn-xl cy" id="raceOne">⛏ Mine 1 block (watch the race)</button>
        <button class="btn-xl vi" id="raceMany">⚡ Simulate 100 blocks</button>
        <button class="btn-xl ghost" id="raceReset">Reset tally</button>
      </div>
      <div class="lab-takeaway">No miner is ever "due" a block — past losses don't improve future odds. Over many blocks, <b>reward share ≈ hash-power share</b>. This is also why solo miners join <b>pools</b>: to convert rare, high-variance jackpots into a smooth income stream proportional to the work they contribute.</div>`;

    function renderSliders() {
      const c = $("raceSliders"); c.innerHTML = "";
      miners.forEach((m, i) => {
        const row = el("div", "slider-row", `<span class="note" style="width:70px;color:${m.c}">${m.n}</span>`);
        const inp = el("input"); inp.type = "range"; inp.min = "5"; inp.max = "80"; inp.value = m.p;
        inp.oninput = () => { miners[i].p = +inp.value; renderTrack(); renderSliders.vals(); };
        const val = el("span", "val", m.p + "%"); val.dataset.v = i; val.style.color = m.c;
        row.appendChild(inp); row.appendChild(val); c.appendChild(row);
      });
    }
    renderSliders.vals = () => { document.querySelectorAll('#raceSliders .val').forEach((v, i) => v.textContent = Math.round(miners[i].p / total() * 100) + "%"); };
    function total() { return miners.reduce((a, b) => a + b.p, 0); }
    function renderTrack() {
      const t = $("raceTrack"); t.innerHTML = "";
      miners.forEach((m) => {
        const lane = el("div", "race-lane", `<div class="ml-name">${m.n}<small>${Math.round(m.p / total() * 100)}% hashpower</small></div>`);
        const prog = el("div", "race-prog", `<div class="fill" style="background:${m.c}"></div><span class="hashtxt"></span>`);
        const wins = el("div", "ml-wins", m.wins); wins.style.color = m.c;
        lane.appendChild(prog); lane.appendChild(wins); t.appendChild(lane);
      });
    }
    function renderTally() {
      const t = $("raceTally"); t.innerHTML = ""; $("raceTotal").textContent = totalBlocks;
      if (totalBlocks === 0) { t.innerHTML = `<div class="tally-seg" style="flex:1 1 100%;background:var(--line-soft);color:var(--dim)">mine some blocks…</div>`; return; }
      miners.forEach((m) => {
        const pct = m.wins / totalBlocks * 100;
        const seg = el("div", "tally-seg", pct > 7 ? Math.round(pct) + "%" : "");
        seg.style.flex = `${m.wins} 1 0`; seg.style.background = m.c; t.appendChild(seg);
      });
    }
    function pickWinner() {
      let r = Math.random() * total();
      for (let i = 0; i < miners.length; i++) { if (r < miners[i].p) return i; r -= miners[i].p; }
      return miners.length - 1;
    }
    $("raceOne").onclick = () => {
      if (racing) return; racing = true;
      const fills = [...document.querySelectorAll('#raceTrack .fill')];
      const txts = [...document.querySelectorAll('#raceTrack .hashtxt')];
      const prog = miners.map(() => 0);
      const winner = pickWinner();
      const tick = () => {
        let done = false;
        miners.forEach((m, i) => {
          prog[i] += (m.p / total()) * (6 + Math.random() * 8);
          if (i === winner && prog[i] >= 100) done = true;
          fills[i].style.width = Math.min(100, prog[i]) + "%";
          txts[i].textContent = "guessing… " + fmt(Math.round(prog[i] * 137)) + " H";
        });
        if (prog[winner] >= 100) {
          fills[winner].style.width = "100%";
          txts[winner].innerHTML = "🏆 found the block!";
          miners[winner].wins++; totalBlocks++;
          [...document.querySelectorAll('#raceTrack .ml-wins')][winner].textContent = miners[winner].wins;
          renderTally(); racing = false;
        } else setTimeout(tick, 40);
      };
      tick();
    };
    $("raceMany").onclick = () => {
      if (racing) return;
      for (let i = 0; i < 100; i++) { miners[pickWinner()].wins++; totalBlocks++; }
      renderTrack(); renderTally();
    };
    $("raceReset").onclick = () => { miners.forEach(m => m.wins = 0); totalBlocks = 0; renderTrack(); renderTally(); };
    renderSliders(); renderSliders.vals(); renderTrack(); renderTally();
  })();

  /* =========================================================
     LAB 4 — FORKS & THE LONGEST-CHAIN RULE
  ========================================================= */
  (function fork() {
    const host = $("labFork"); if (!host) return;
    // chain state: list of heights; we model a base chain then a fork
    let state = "base"; // base | forked | resolved
    host.innerHTML = `
      <p class="lab-q">Two honest miners on opposite sides of the planet can find the next block at nearly the same instant. Now there are <b>two valid chains</b>. Which one is real? The rule is brutally simple: <b>the chain with the most accumulated work (the longest) wins.</b></p>
      <div class="chaintree" id="forkTree"></div>
      <div class="flex gap wrap mt" id="forkControls"></div>
      <div class="log-feed mt" id="forkLog"><div class="info">// network view</div></div>
      <div class="lab-takeaway">Short forks happen all the time and resolve within a block or two — the losing block becomes an <b>orphan</b> and its transactions return to the mempool. This is precisely why a payment isn't final the instant it's mined: each additional block on top (a <b>confirmation</b>) makes it exponentially harder to ever end up on the losing side of a fork.</div>`;
    const flog = (h, c) => { const d = el("div", c); d.innerHTML = h; $("forkLog").appendChild(d); $("forkLog").scrollTop = 1e9; };

    function blk(label, sub, cls) { const b = el("div", "cblock " + (cls || ""), `${label}<span class="h">${sub}</span>`); return b; }
    function edge(cls) { return el("div", "cedge " + (cls || "")); }

    function render() {
      const tree = $("forkTree"); tree.innerHTML = "";
      // main row
      const row = el("div", "chain-row");
      row.appendChild(blk("#1", "genesis…", ""));
      row.appendChild(edge());
      row.appendChild(blk("#2", "a1b2…", ""));
      if (state === "base") {
        row.appendChild(edge());
        row.appendChild(blk("#3", "tip", "tip"));
        tree.appendChild(row);
      } else {
        // fork: two branches off #2
        row.appendChild(edge());
        const branchWrap = el("div", "", "");
        branchWrap.style.display = "inline-flex"; branchWrap.style.flexDirection = "column"; branchWrap.style.gap = "10px";
        const top = el("div", "chain-row"); top.style.margin = "0";
        top.appendChild(blk("#3a", "by Pool A", "honest" + (state === "resolved" ? " " : " tip clickable")));
        if (state === "resolved") { top.appendChild(edge("honest")); top.appendChild(blk("#4", "tip", "honest tip")); }
        const bot = el("div", "chain-row"); bot.style.margin = "0";
        bot.appendChild(blk("#3b", "by Pool B", state === "resolved" ? "orphan" : "attacker tip clickable"));
        branchWrap.appendChild(top); branchWrap.appendChild(bot);
        row.appendChild(branchWrap);
        tree.appendChild(row);
        if (state === "forked") {
          [...top.querySelectorAll('.clickable'), ...bot.querySelectorAll('.clickable')].forEach((b) => {});
          top.querySelector('.cblock').onclick = () => resolve("3a");
          bot.querySelector('.cblock').onclick = () => resolve("3b");
        }
      }
      renderControls();
    }
    function renderControls() {
      const c = $("forkControls"); c.innerHTML = "";
      if (state === "base") {
        const b = el("button", "btn-xl go", "⚡ Two miners find block #3 at once"); b.onclick = doFork; c.appendChild(b);
      } else if (state === "forked") {
        const note = el("span", "note", "👆 Click whichever block #3 you think the next miner builds on (mine block #4 on top of it):");
        c.appendChild(note);
      } else {
        const b = el("button", "btn-xl ghost", "↺ Replay"); b.onclick = () => { state = "base"; $("forkLog").innerHTML = `<div class="info">// network view</div>`; render(); }; c.appendChild(b);
      }
    }
    function doFork() {
      state = "forked";
      flog(`Pool A mines block <b style="color:var(--green)">#3a</b>; Pool B mines <b style="color:var(--blue)">#3b</b> ~simultaneously.`, "");
      flog(`⚠ Network split: both are valid. Nodes keep whichever they saw first and wait. <b>Undecided.</b>`, "warn");
      render();
    }
    function resolve(which) {
      state = "resolved";
      const win = which === "3a" ? "3a" : "3b";
      flog(`A miner extends <b style="color:var(--green)">#${win}</b> with block #4 → that branch is now longer (more work).`, "info");
      flog(`Longest-chain rule: every node switches to it. The other block is <b style="color:var(--red)">orphaned</b>; its txns go back to the mempool.`, "bad");
      flog(`✓ Consensus restored. The fork lasted one block.`, "ok");
      // for simplicity we always render 3a as the survivor visually
      render();
    }
    render();
  })();

  /* =========================================================
     LAB 5 — THE 51% ATTACK GAME (with Satoshi's probability)
  ========================================================= */
  (function attack() {
    const host = $("labAttack"); if (!host) return;
    let q = 25, conf = 6, running = false;

    host.innerHTML = `
      <p class="lab-q">You bought a <b>$1,000,000 car</b>. The dealer waits for <b>K confirmations</b>, then hands you the keys. Your heist: secretly mine a <b>longer</b> chain that omits your payment, then publish it — reversing the transaction so you keep the car <i>and</i> the coins. Can you out-mine the honest network?</p>
      <div class="attack-stage">
        <div class="slider-row"><span class="note" style="width:170px">Your hash power (q)</span><input type="range" id="atkQ" min="1" max="90" value="25"><span class="val" id="atkQVal">25%</span></div>
        <div class="slider-row"><span class="note" style="width:170px">Confirmations dealer waits</span><input type="range" id="atkConf" min="0" max="12" value="6"><span class="val" id="atkConfVal">6</span></div>
        <div class="conf-pips" id="atkPips"></div>
      </div>
      <div class="grid-2 mt" style="gap:22px;align-items:center">
        <div class="center">
          <div class="note mb">Probability your attack <b>eventually succeeds</b><br><span style="font-size:11px">(Nakamoto, Bitcoin whitepaper §11)</span></div>
          <div class="prob-readout"><span class="pct" id="atkPct">—</span></div>
          <div class="note mt-s" id="atkVerdict"></div>
        </div>
        <div>
          <div class="note mb">Live race (one stochastic attempt):</div>
          <div id="atkChains"></div>
          <div class="flex gap wrap mt">
            <button class="btn-xl red" id="atkRun">☠ Launch attack</button>
            <button class="btn-xl ghost" id="atkReset">Reset</button>
          </div>
        </div>
      </div>
      <div class="lab-takeaway" id="atkTake"></div>`;

    // Satoshi's formula: P(attacker ever catches up after z confirmations)
    function attackSuccessProb(qf, z) {
      const p = 1 - qf;
      if (qf >= p) return 1; // q >= 50%
      const lambda = z * (qf / p);
      let sum = 0;
      // P = 1 - Σ_{k=0}^{z} poisson(k; λ) * (1 - (q/p)^(z-k))
      let poisson = Math.exp(-lambda); // k=0 term λ^0/0!
      for (let k = 0; k <= z; k++) {
        if (k > 0) poisson *= lambda / k;
        sum += poisson * (1 - Math.pow(qf / p, z - k));
      }
      return 1 - sum;
    }
    function renderPips() {
      const c = $("atkPips"); c.innerHTML = "";
      for (let i = 1; i <= conf; i++) { const pip = el("div", "conf-pip done", "✓"); c.appendChild(pip); }
      if (conf === 0) c.innerHTML = `<span class="note" style="color:var(--red)">0 confirmations — dealer ships instantly. Reckless.</span>`;
    }
    function renderProb() {
      const qf = q / 100;
      const P = attackSuccessProb(qf, conf);
      const pctEl = $("atkPct");
      const pctStr = P >= 0.5 ? (P * 100).toFixed(0) + "%" : P < 0.0001 ? "<0.01%" : (P * 100).toPrecision(2) + "%";
      pctEl.textContent = pctStr;
      const danger = P > 0.01;
      pctEl.className = "pct " + (danger ? "danger" : "safe");
      const v = $("atkVerdict");
      if (qf >= 0.5) v.innerHTML = `<b style="color:var(--red)">q ≥ 50% — you control the majority. Success is guaranteed given time. This is "the 51% attack."</b>`;
      else if (P < 0.0001) v.innerHTML = `Practically impossible. Give up — you'll just waste electricity.`;
      else if (danger) v.innerHTML = `<b style="color:var(--gold)">Non-trivial risk.</b> A merchant should demand more confirmations for this amount.`;
      else v.innerHTML = `Safe enough for the dealer. The deeper the payment is buried, the harder it gets.`;
      $("atkTake").innerHTML = `Below 50% hash power, every extra confirmation multiplies your failure odds — the success probability <b>decays exponentially</b> in K. That's why exchanges wait more confirmations for larger deposits. At <b>≥50%</b> the math flips: the attacker is now the fastest chain and the "longest-chain wins" rule works <i>for</i> them. Bitcoin's security ultimately rests on no single party controlling a majority of hash power.`;
    }
    function renderChains() {
      $("atkChains").innerHTML = `
        <div class="race-lane"><div class="ml-name" style="color:var(--green)">Honest<small>builds the real chain</small></div><div class="race-prog"><div class="fill" id="atkHonest" style="background:var(--green)"></div><span class="hashtxt" id="atkHonestN">height 0</span></div><div class="ml-wins" id="atkHonestH" style="color:var(--green)">0</div></div>
        <div class="race-lane mt-s"><div class="ml-name" style="color:var(--red)">You (secret)<small>building a fork</small></div><div class="race-prog"><div class="fill" id="atkEvil" style="background:var(--red)"></div><span class="hashtxt" id="atkEvilN">height 0</span></div><div class="ml-wins" id="atkEvilH" style="color:var(--red)">0</div></div>`;
    }
    $("atkQ").oninput = (e) => { q = +e.target.value; $("atkQVal").textContent = q + "%"; renderProb(); };
    $("atkConf").oninput = (e) => { conf = +e.target.value; $("atkConfVal").textContent = conf; renderPips(); renderProb(); };
    $("atkReset").onclick = () => { renderChains(); };
    $("atkRun").onclick = () => {
      if (running) return; running = true; renderChains();
      const qf = q / 100;
      // honest starts 'conf' blocks ahead (the confirmations already mined); attacker at 0
      let honest = conf, evil = 0, ticks = 0;
      const maxTicks = 300;
      const hf = $("atkHonest"), ef = $("atkEvil");
      const step = () => {
        ticks++;
        if (Math.random() < qf) evil++; else honest++;
        const scale = Math.max(honest, evil, conf + 4);
        hf.style.width = (honest / scale * 100) + "%";
        ef.style.width = (evil / scale * 100) + "%";
        $("atkHonestN").textContent = "height " + honest; $("atkEvilN").textContent = "height " + evil;
        $("atkHonestH").textContent = honest; $("atkEvilH").textContent = evil;
        if (evil > honest) {
          $("atkEvilN").innerHTML = "🏴 PUBLISHED — overtook honest chain!";
          flogResult(true); running = false; return;
        }
        if (ticks >= maxTicks || (qf < 0.5 && honest - evil > 30)) {
          flogResult(false); running = false; return;
        }
        setTimeout(step, 45);
      };
      step();
    };
    function flogResult(won) {
      const v = $("atkVerdict");
      if (won) v.innerHTML = `<b style="color:var(--red)">💀 This run: attack SUCCEEDED.</b> You reversed the payment. (Theoretical chance shown above — you may have gotten lucky.)`;
      else v.innerHTML = `<b style="color:var(--green)">🛡 This run: attack FAILED.</b> The honest chain pulled too far ahead. Re-run — outcomes are random, but the odds above are the long-run truth.`;
    }
    renderPips(); renderChains(); renderProb();
  })();

  /* =========================================================
     LAB 6 — PROOF OF STAKE & SLASHING
  ========================================================= */
  (function pos() {
    const host = $("labPos"); if (!host) return;
    let vals = [
      { n: "Val A", stake: 32, c: "#34e1d4", wins: 0, slashed: false },
      { n: "Val B", stake: 96, c: "#8b7bff", wins: 0, slashed: false },
      { n: "Val C", stake: 64, c: "#ffcf6b", wins: 0, slashed: false },
      { n: "Val D", stake: 32, c: "#57e08a", wins: 0, slashed: false }
    ];
    let blocks = 0;
    host.innerHTML = `
      <p class="lab-q">Proof of Work secures the chain by burning <b>electricity</b>. Proof of Stake swaps that for <b>capital at risk</b>: validators lock up coins as a bond. Propose honestly and you earn; cheat and the protocol <b>destroys your stake</b> (slashing). Energy use drops ~99.95%.</p>
      <div class="pos-grid" id="posGrid"></div>
      <div class="flex gap wrap mt">
        <button class="btn-xl vi" id="posOne">🎲 Propose 1 block (weighted by stake)</button>
        <button class="btn-xl ghost" id="posMany">⚡ Run 50 blocks</button>
        <button class="btn-xl red" id="posCheat">☠ Make Val B sign a fraudulent block</button>
        <button class="btn-xl ghost" id="posReset">Reset</button>
      </div>
      <div class="log-feed mt" id="posLog"><div class="info">// beacon chain</div></div>
      <div class="lab-takeaway">Selection odds scale with stake, just as PoW odds scale with hash power — but the "scarce resource" is the validator's own money, posted <b>on-chain</b>. Attacking the network means risking your entire bond, and acquiring a majority stake would be ruinously expensive and self-defeating (you'd tank the value of the very asset you hold). Ethereum switched to this model in <b>The Merge (Sept 2022)</b>.</div>`;
    const plog = (h, c) => { const d = el("div", c); d.innerHTML = h; $("posLog").appendChild(d); $("posLog").scrollTop = 1e9; };
    function active() { return vals.filter(v => !v.slashed); }
    function totalStake() { return active().reduce((a, b) => a + b.stake, 0); }
    function render() {
      const g = $("posGrid"); g.innerHTML = "";
      const tot = totalStake();
      vals.forEach((v, i) => {
        const pct = v.slashed ? 0 : Math.round(v.stake / tot * 100);
        const card = el("div", "pos-card" + (v.slashed ? " slashed" : ""), `
          <div style="font-weight:700">${v.n}</div>
          <div class="stk">${v.stake} Ξ</div>
          <div class="note">${v.slashed ? "SLASHED ✘" : pct + "% selection odds"}</div>
          <div class="note mt-s" style="color:${v.c}">won ${v.wins}</div>`);
        card.dataset.i = i; g.appendChild(card);
      });
    }
    function pick() {
      const a = active(); let r = Math.random() * totalStake();
      for (const v of a) { if (r < v.stake) return v; r -= v.stake; }
      return a[a.length - 1];
    }
    $("posOne").onclick = () => {
      const w = pick(); w.wins++; blocks++;
      render();
      [...document.querySelectorAll('#posGrid .pos-card')].forEach((c, i) => c.classList.toggle("chosen", vals[i] === w));
      plog(`Block ${blocks}: <b style="color:${w.c}">${w.n}</b> proposed (had ${Math.round(w.stake / totalStake() * 100)}% odds) → earns reward.`, "ok");
    };
    $("posMany").onclick = () => { for (let i = 0; i < 50; i++) { pick().wins++; blocks++; } render(); plog(`Ran 50 blocks. Reward share is tracking stake share.`, "info"); };
    $("posCheat").onclick = () => {
      const b = vals[1];
      if (b.slashed) { plog(`Val B already slashed.`, "warn"); return; }
      plog(`☠ Val B signs two conflicting blocks at the same height (equivocation).`, "warn");
      plog(`Other validators submit proof of the double-sign. Protocol response:`, "");
      b.slashed = true; const lost = b.stake; b.stake = 0;
      render();
      plog(`💥 Val B SLASHED — ${lost} Ξ bond destroyed and ejected from the validator set. Cheating cost more than it could ever gain.`, "bad");
    };
    $("posReset").onclick = () => { vals.forEach((v, i) => { v.wins = 0; v.slashed = false; }); vals[1].stake = 96; blocks = 0; $("posLog").innerHTML = `<div class="info">// beacon chain</div>`; render(); };
    render();
  })();

})();
