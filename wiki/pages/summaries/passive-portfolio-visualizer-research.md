---
type: summary
title: "Research: Passive Portfolio Visualizer"
tags: [finance, backtesting, react, charting, data, decision-log]
sources: [[../../raw/passive-portfolio-visualizer-research.md]]
related:
  - [[../concepts/free-redistributable-market-data.md]]
  - [[../concepts/bond-total-return-data-gap.md]]
  - [[../concepts/backtest-metrics-math.md]]
  - [[../entities/tradingview-lightweight-charts.md]]
status: stable
updated: 2026-07-10
---

# Research: Passive Portfolio Visualizer

Compiled view of the technical-research document produced during
`/speckit.plan` Phase 0 for the Passive Portfolio Visualizer feature
(specs/001). The original records **why** each plan decision was made. This
page distills the decisions and points to the reusable domain knowledge filed
from it; feature-specific rationale stays in the spec/plan.

## Headline decisions

| Area | Decision |
|---|---|
| Architecture | **Static frontend SPA, no backend** — all compute in-browser, dataset bundled as JSON [[../../raw/passive-portfolio-visualizer-research.md#r-1]] |
| Data source | **Fama-French + FRED**, public-domain / universally-tolerated, annual refresh [[../concepts/free-redistributable-market-data.md]] |
| Backtest math | Monthly total returns, monthly rebalance, CAGR / √12-volatility / max drawdown [[../concepts/backtest-metrics-math.md]] |
| Frontend stack | React 18 + Vite + TypeScript + Tailwind + shadcn/ui (constitution-mandated) |
| Charting | **TradingView Lightweight Charts v5** for all time-series [[../entities/tradingview-lightweight-charts.md]] |
| Allocation visual | shadcn/ui donut (Recharts) — a categorical chart, outside the axis-chart mandate |
| Shareable link | Flat query params via `react-router` `useSearchParams`; no compression |
| State persistence | None — URL is the only storage (spec requires no device/server persistence) |
| Testing | Vitest + React Testing Library |

## Reusable knowledge filed from this source

- The free, legally-redistributable market-data combo and why commercial feeds
  (Yahoo, Bloomberg-ICE) are off-limits → [[../concepts/free-redistributable-market-data.md]]
- The public-domain gap in bond total-return data and the labeled Treasury
  proxy → [[../concepts/bond-total-return-data-gap.md]]
- Backtest metric definitions and the monthly-rebalance recipe → [[../concepts/backtest-metrics-math.md]]
- TradingView Lightweight Charts v5 integration specifics (API, React wrapper,
  theming, canvas a11y) → [[../entities/tradingview-lightweight-charts.md]]

## Carried risks

1. Bond-sleeve fidelity: tracks intermediate Treasuries, not the true Bloomberg
   Aggregate — disclosed in-app.
2. French library has no explicit redistributable license (universally
   tolerated); mitigated by attribution.
3. Canvas charts each need a hand-authored visually-hidden companion table for
   a11y — tracked per-chart, not an afterthought.
