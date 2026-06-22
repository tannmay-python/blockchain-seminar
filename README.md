# Blockchain — A Technical & Policy Primer (Interactive Seminar)

An interactive, scroll-driven companion for a one-hour technical seminar on blockchain.
Every demo runs **locally in the browser** — no build step, no dependencies, no internet
required after first load. The SHA-256 is computed for real (pure-JS implementation),
and digital signatures use the real **Web Crypto ECDSA P-256** API when served over
`localhost`/`https`.

## Run it

Any static server works. The simplest:

```bash
cd blockchainResearchSeminar
python3 -m http.server 4321
# then open http://localhost:4321
```

> Tip: serve over `http://localhost` (not `file://`) so the digital-signatures demo can use
> the browser's native ECDSA. The rest (including SHA-256) works either way.

## Presenter notes

- **Scroll** top-to-bottom — the talk is structured as a narrative.
- **Right-side dots** jump between sections; **← / →** arrow keys also navigate.
- Everything is touchable. Suggested live beats:

| Section | Do this live |
|---|---|
| **Hashing** | Change one letter in Input B → watch the avalanche bit-grid light up red |
| **The Chain** | Edit Block #0's data → blocks turn red → hit *Re-mine* → cascade repairs |
| **Signatures** | Generate → Sign → Verify (valid) → change the message → Verify (tamper caught) |
| **Merkle Trees** | Click a transaction → see the O(log n) proof path |
| **Consensus** | Run the PoW race (hash power = odds), then the PoS weighted lottery |
| **Trilemma** | Drag the point toward a corner → the other two shrink |
| **TPS** | Bars animate Bitcoin (7) vs Ethereum (25) vs Visa (24,000) |
| **Policy** | Toggle India / US / EU → table highlights that column |
| **ZKP** | Run rounds as HONEST, then flip to CHEATER → exposed |
| **Bridges** | Bridge ETH (lock→mint), then "Simulate exploit" → the $2.5B failure mode |

## Structure

```
index.html        all sections + copy
css/style.css     dark cryptographic theme
js/sha256.js      pure-JS SHA-256 (FIPS 180-4), verified against test vectors
js/demos.js       every interactive component
js/main.js        scroll progress, dot nav, reveal animations, keyboard nav
```

## Content

Part I — The Technology · Part II — Global Policy Landscape · Part III — Emerging Developments.
Covers hashing, block structure, public-key signatures, Merkle trees, PoW/PoS consensus,
network types, smart contracts, the scalability trilemma, the India/US/EU regulatory
comparison, zero-knowledge proofs, account abstraction, RWA tokenization, CBDCs, and
cross-chain interoperability.
