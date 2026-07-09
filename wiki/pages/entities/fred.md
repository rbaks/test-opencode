---
type: entity
title: "FRED (Federal Reserve Economic Data)"
tags: [finance, data, public-domain, datasets]
sources: [[../../raw/passive-portfolio-visualizer-research.md#r-2]]
related:
  - [[../concepts/free-redistributable-market-data.md]]
  - [[../concepts/bond-total-return-data-gap.md]]
  - [[./ken-french-data-library.md]]
status: stable
updated: 2026-07-10
---

# FRED (Federal Reserve Economic Data)

**What:** A free public database run by the St. Louis Fed. URL:
`https://fred.stlouisfed.org/`.

**Why it matters here:** It is the cleanest legal basis for US fixed-income and
commodity data in a redistributable static app. Its core series are **US
government works → public domain**, freely redistributable with attribution.
This avoids the ToS/prohibition problems of commercial feeds
([[../concepts/free-redistributable-market-data.md]]).

## Series used

| Need | Series id | Notes |
|---|---|---|
| Intermediate Treasuries (yield) | `GS5` / `DGS5` | 5-yr constant maturity. Converted to a total return via the duration formula — see [[../concepts/bond-total-return-data-gap.md]]. |
| Gold | `GOLDAMGBD228NLBM` | London PM fix. |

## Properties

- **Granularity:** daily/monthly; back to 1953–1962 depending on series.
- **License:** public domain (US government work) with attribution.
- **Refresh:** publishes monthly within a few weeks of month-end, so
  refresh-on-demand is possible later without architectural change.
