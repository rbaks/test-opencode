---
type: entity
title: "Kenneth French Data Library (Tuck / Dartmouth)"
tags: [finance, data, equities, datasets]
sources: [[../../raw/passive-portfolio-visualizer-research.md#r-2]]
related:
  - [[../concepts/free-redistributable-market-data.md]]
  - [[./fred.md]]
status: stable
updated: 2026-07-10
---

# Kenneth French Data Library (Tuck / Dartmouth)

**What:** A free academic dataset maintained by Kenneth French at Tuck /
Dartmouth. URL:
`https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html`.

**Why it matters here:** It is the universally-tolerated academic standard for
equity factor/return data — the basis of essentially all modern asset-pricing
research since the 1990s. It supplies **monthly total returns** (dividends
reinvested) for the equity asset classes used in passive-portfolio backtests.

## Series used

| Need | Factor / file |
|---|---|
| US total stock market | `Mkt-RF` (CRSP value-weighted) — standard proxy for a total-market index fund |
| International developed ex-US | Developed ex US `Mkt-RF` |
| Emerging markets | Emerging Markets 5 Factors `Mkt-RF` |
| Risk-free rate | `Rf` (1-month T-bill) |

## License posture (important)

- **No explicit redistributable license.** However it is the conventional,
  universally-tolerated source — academic backtesters have shipped derivatives
  of it for ~30 years.
- Mitigation: ship a `NOTICE` / `DATA_SOURCES.md` crediting French
  (Tuck/Dartmouth), and document methodology. This is the conventional
  low-risk path. See [[../concepts/free-redistributable-market-data.md]].

Contrast with [[./fred.md]], which is cleanly public domain.
