# Seminar run-of-show — Blockchain for the High-Tech Geopolitics team

**Audience:** Takshashila colleagues — technically literate, policy-minded, care about state power, standards, sovereignty, financial statecraft.
**Length:** 60 min (~50 content + ~10 Q&A).
**The strategy in one line:** go *deep and live* on the technology first (dashboard), so the *broad geopolitics* second half (slides) rests on a shared, concrete mental model. Earn the right to make policy claims by showing you actually understand the machine.

```
SLIDES  ─ Open / framing ........ 4 min
DASH    ─ Part I: the technology  22 min   ← the dashboard's whole job
SLIDES  ─ Part II: geopolitics .. 18 min
SLIDES  ─ Part III: frontier ..... 6 min
SLIDES  ─ Close .................. 2 min
          Q&A ................... ~8 min
```

Two windows, one switch: dashboard fullscreen in Chrome, slides in Keynote/PPT. Alt-Tab between them. Practise that switch once.

---

## Before you start (5-min setup)
- Open the dashboard, press **F** (fullscreen), press **P** (presentation mode — larger text).
- Press the hero's **Enter the network**, then **pause** (spacebar) so you open on a calm, already-populated chain rather than a frantic one.
- Set speed to **1×**. Have the difficulty at default (4) — gives ~1-second blocks.
- Keyboard you'll use on stage: **1–8** jump chapters · **← / →** prev/next chapter · **space** play/pause · **click any block** to inspect · **Esc** closes the inspector.
- Backup: take 3 screenshots (a mined block, the 51% screen, PoS energy) in case the room's machine struggles with the live demo.

---

## OPEN — 4 min · SLIDES

**Goal: tell them why a geopolitics team is spending an hour on this, and that it won't be hand-wavy.**

- Hook: "Most coverage of this is either price charts or hype. I want to give you the engineer's view — what the thing actually *is* — because the policy fights we track only make sense once you see the mechanism."
- The one-sentence thesis: **A blockchain is a way for parties who don't trust each other to agree on a shared record without a central authority in the middle.** Removing that middle is what makes it geopolitical — it pulls the bank, the clearing house, and ultimately the state out of the chokepoint.
- Roadmap slide: (1) how it works — live; (2) the global regulatory map — US vs EU vs India; (3) the frontier worth tracking.

> Transition: "Rather than describe it, I'll just run one. This is a real blockchain, mining in your browser." → Alt-Tab to dashboard.

---

## PART I — THE TECHNOLOGY, LIVE — 22 min · DASHBOARD

Walk the eight chapters. For each: let the visual carry it, narrate plainly, and drop the **geopolitics hook** so the room sees why the mechanic matters to *them*. Press the chapter number to jump; press **space** to let blocks mine when you want motion.

**Ch 1 · The ledger no one owns — 3 min**
- Show: blocks streaming in, the network mesh, the mempool. Press space; let three blocks land.
- Say: every node holds the full ledger; no one can edit the past; the chain only grows.
- **Hook:** "Hold this thought — there is no one to subpoena, no one to order to reverse an entry. That single property is the root of every regulatory headache in the second half."

**Ch 2 · Anatomy of a block (hashing) — 3 min**
- Show: click a block → inspector → **Re-hash the header** (verifies) → mention the Merkle root rebuild.
- Say: a hash is a tamper-evident fingerprint; each block carries the previous block's hash, so you can't quietly rewrite history.
- **Hook:** "Immutable, verifiable records — the same property that makes this great for provenance and audit also makes deletion/῾right to be forgotten᾿ and certain AML demands genuinely hard."

**Ch 3 + 4 · Identity & sending money — 4 min**
- Show: Ch3 generate your key pair + faucet. Ch4 sign and broadcast a transaction; watch it sit in the mempool, then get mined; the block opens with *your* tx inside.
- Say: ownership is a private key, not an account; transfers are permissionless and pseudonymous; miners prioritise by fee.
- **Hook:** "No intermediary means no natural point to apply KYC or sanctions. This is exactly what FATF's travel rule, India's 1% TDS, and the whole AML/CFT debate are trying to reach around."

**Ch 5 · Mining / Proof of Work — 4 min**
- Show: turn your hash power up, press **Start mining**, get a block under your name. Point at the live hash spotlight and the difficulty/hashrate stats.
- Say: security = cost; your odds equal your share of global hashing; rewriting history means out-computing everyone.
- **Hook:** "Hash power is a strategic resource. China banned mining in 2021 and overnight the map redrew toward the US and Central Asia. Where the machines sit is now a geopolitical fact."

**Ch 6 · Forks & consensus — 2 min**
- Show: trigger a fork, resolve it (longest chain wins; the loser is orphaned).
- Say: finality is probabilistic; this is why exchanges 'wait for confirmations'.

**Ch 7 · The 51% attack — 3 min** *(your strongest moment)*
- Show: slide your power to ~30% with 6 confirmations — read the tiny success probability. Then push past 50% — it jumps to certain. Run the attack once.
- Say: the whole system holds on one social fact — no single party controls a majority. The math is Satoshi's, computed live.
- **Hook:** "This reframes 'decentralisation' from ideology to a security parameter. It's also why a state-scale actor or a dominant mining pool is a real threat model, and why smaller chains are routinely 51%-attacked."

**Ch 8 · Proof of Stake & beyond — 2 min**
- Show: flip the engine to **Proof of Stake** — the energy meter collapses to ~0.
- Say: same security idea, different scarce resource — capital you'd lose by cheating, instead of electricity. Ethereum did this in 2022, cutting energy ~99.95%.
- **Hook:** "This defuses the energy/climate critique but trades it for a concentration-of-capital question — useful to have both framings when the ESG argument comes up."

> Transition: "That's the machine — trustless coordination, secured by cost. Now the real question for us: **who governs it, and who's competing to set the rules?**" → Alt-Tab to slides.

---

## PART II — THE GEOPOLITICAL & REGULATORY MAP — 18 min · SLIDES

This is home turf. Lead with *your* analysis; the dashboard already gave them the mechanics.

**Framing slide (3 min):** the three tensions every jurisdiction must resolve — **classification** (currency / commodity / security → decides *who* regulates), **protection vs innovation** (over-regulate and builders go offshore; under-regulate and retail gets hurt), **jurisdiction** (borderless networks, national law). Frame regulation itself as competition between states.

**United States (4 min):** no single federal law; authority fragmented — SEC (most tokens are securities, Howey, enforcement against Coinbase/Binance), CFTC (BTC/ETH as commodities), FinCEN (BSA/MSB), IRS (property). FIT21 passed the House in 2024; Senate pending; the 2025 administration signalled a friendlier stance. **Takeaway: fragmentation is itself a policy outcome — it exports regulatory uncertainty.**

**European Union (4 min):** MiCA — enacted 2023, in force Dec 2024 — the most comprehensive framework among major economies. Authorise once, **passport** across the bloc. Strict stablecoin reserve rules; NFTs/DeFi largely out of scope for now. **Takeaway: this is the Brussels Effect applied to crypto — the EU setting the global default, the way GDPR did. Standard-setting *is* power projection.**

**India (5 min):** the most volatile trajectory of any major economy — 2018 RBI banking ban → 2020 Supreme Court strikes it down → 2022 punitive 30% tax + 1% TDS (volume flees offshore) → 2023 FATF presidency, pushing global AML coordination → today FIU-IND registration under PMLA, no enabling law, RBI sceptical while building the Digital Rupee. **Takeaway: the risk isn't a ban, it's *paralysis* — restrictive tax with no framework for institutional participation. India is using AML/standards bodies as its lever rather than domestic law.**

**CBDCs as statecraft (the part this team will care about most):** distinguish sharply from crypto — centralised, state-issued, permissioned, the *opposite* of permissionless. China's e-CNY is the most advanced large-economy pilot; the digital euro is in preparation; India's e-Rupee is in pilot with modest uptake; the US Fed has studied but not committed. **The geopolitics:** programmable money (can expire, be geofenced, restricted by purpose), cross-border settlement rails that route around correspondent banking and the dollar, and the sanctions-resilience angle. This is where blockchain ideas meet great-power competition directly.

---

## PART III — THE FRONTIER WORTH TRACKING — 6 min · SLIDES

Keep it crisp; these are 'put it on your radar' items, each with a policy hook.

- **Zero-knowledge proofs** — prove a fact without revealing it. Policy hook: privacy-preserving compliance (prove you're *not* sanctioned without revealing identity) — the privacy-vs-surveillance axis, in cryptographic form. *(Optional: jump to dashboard Ch8 prose or just describe.)*
- **Real-world asset tokenisation** — treasuries, property, credit on-chain; BCG's ~$16T-by-2030 estimate; BlackRock/Franklin already live; SEBI and IFSCA have opened consultations — the India angle.
- **Interoperability / bridges** — connecting chains; also crypto's single largest hack surface (>$2.5B lost, 2021–23). Policy hook: the security of cross-border financial plumbing.
- **Account abstraction** — wallets that behave like apps (recovery, sponsorship) → the usability step that precedes mainstream adoption.

---

## CLOSE — 2 min · SLIDES

Three takeaways to leave them with:
1. **Blockchain's substance is trustless coordination, not the coin.** Immutability + no central keeper is the whole story; everything else is built on it.
2. **The contest is over who writes the rules** — US fragmentation vs the EU's exported standard vs China's state model vs India's caution. Regulation is competitive infrastructure.
3. **CBDCs and tokenised assets are where this collides with great-power finance** — that's the part this team should track most closely.

Then: **Q&A (~8 min).** Likely questions to pre-load: energy (you have the PoS answer), "is it just for criminals" (pseudonymous ≠ anonymous; chain analysis), quantum risk, India's next move, can a state 51%-attack Bitcoin (cost framing).

---

### Demo cheat-sheet (keep this glanceable)
| Want to show | Do |
|---|---|
| Jump to a chapter | press its number **1–8** |
| Let blocks mine | **space** (toggles the network) |
| Inspect a block | click it · **Esc** to close |
| Mine one block on demand | the **⏭** button (top right) |
| Bigger text for the room | **P** (presentation mode) |
| Fullscreen | **F** |
| Mine a block yourself | Ch5 → raise hash power → **Start mining** |
| Break it | Ch7 → push power past 50% → **Run the attack** |
| Kill the energy critique | Ch8 → **Proof of stake** |

**If the live demo misbehaves:** pause, switch to your backup screenshots, narrate from those, move on. Never debug on stage.
