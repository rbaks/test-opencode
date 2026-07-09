---
type: concept
title: "The public-domain bond total-return gap (and the Treasury proxy)"
tags: [finance, data, bonds, public-domain, honesty]
sources: [[../../raw/passive-portfolio-visualizer-research.md#r-2]]
related:
  - [[../concepts/free-redistributable-market-data.md]]
  - [[../entities/fred.md]]
status: stable
updated: 2026-07-10
---

# The public-domain bond total-return gap

**The problem:** There is **no clean public-domain monthly total-return series**
for US investment-grade corporate or aggregate bonds. The commercial indices
that track them (ICE/Bloomberg, formerly Barclays) **forbid redistribution** —
even when those series are mirrored on FRED. So a bundled, redistributable,
honest backtester cannot ship a "true aggregate bond" ingredient.

**The labeled proxy:** Use a **derived intermediate-Treasury total return** —
computed from the FRED `GS5` 5-year constant-maturity yield via the standard
duration formula [[../../raw/passive-portfolio-visualizer-research.md#r-3]] — as
a **clearly labeled** stand-in for the bond sleeve.

Source series: FRED `GS5` / `DGS5` ([[../entities/fred.md]]).

## Why it is acceptable (and must be disclosed)

- **Educationally sound:** intermediate Treasuries capture the broad shape of
  bond behavior over decades — the steady, lower-volatility ballast against
  stocks. That is the lesson the tool teaches.
- **Fidelity gap is real but bounded** vs a true aggregate-bond index.
- **Must never be silent.** Disclosure pattern (from FR-011):
  - UI labels the ingredient as "US Intermediate Treasuries."
  - Disclaimer states Treasuries stand in for the broader bond market as a
    known limitation.
  - Attribution records the exact series used.

## Generalizable rule

When redistributable data does not exist for an asset class, **pick one
documented proxy, label it loudly, and disclose the limitation at every output
it affects** — never silently substitute. This is the honest path when a
canonical free dataset is missing.
