---
type: concept
title: "Free, legally-redistributable historical market data"
tags: [finance, data, public-domain, licensing, backtesting]
sources: [[../../raw/passive-portfolio-visualizer-research.md#r-2]]
related:
  - [[../entities/fred.md]]
  - [[../entities/ken-french-data-library.md]]
  - [[../concepts/bond-total-return-data-gap.md]]
status: stable
updated: 2026-07-10
---

# Free, legally-redistributable historical market data

**The thesis:** For a static app that **bundles** historical returns at build
time (no runtime API, no backend), data must be **legally redistributable** —
not merely free to *view*. Most "free" finance APIs forbid redistributing the
raw feed, which rules them out for a bundled dataset. The canonical combo that
clears the legal bar is:

- **Equities:** Kenneth French Data Library ([[../entities/ken-french-data-library.md]]) — monthly total returns, dividends reinvested.
- **Fixed income + gold:** FRED ([[../entities/fred.md]]) — public-domain US-government series.

This Fama-French + FRED stitch is the academic standard for exactly this
purpose [[../../raw/passive-portfolio-visualizer-research.md#r-2]].

## What is ruled out and why

| Source | Status | Reason |
|---|---|---|
| Yahoo Finance / Tiingo / Stooq | Rejected | Free to **view**, but ToS **prohibits redistribution** of the raw feed — shipping in a static app is a clear violation. |
| Portfolio Visualizer | Rejected | Proprietary; curated dataset explicitly off-limits for redistribution. (Useful only as an independent dev cross-check.) |
| MSCI / S&P / Bloomberg-ICE index feeds | Rejected | Paid licenses that forbid redistribution; out of scope for an educational tool. |
| Damodaran (NYU) | Rejected | **Annual** granularity only — unusable for monthly backtests. |
| Shiller (Yale) | Not primary | French already covers US total-market equity with explicit dividend reinvestment; noted as an independent cross-check for S&P 500. |

## Practical sizing

Monthly data over ~25 years (2000–present) for ~5 series ≈ 300 points/series ≈
~1.5k numeric points total. As compressed JSON this is **well under 100 KB** —
negligible against any bundle budget [[../../raw/passive-portfolio-visualizer-research.md#r-2]].

## The one honest gap

There is no clean public-domain monthly **total-return** series for US
corporate/aggregate bonds (commercial ICE/Bloomberg indices forbid
redistribution even when mirrored on FRED). That gap and its labeled proxy are
covered separately: [[../concepts/bond-total-return-data-gap.md]].
