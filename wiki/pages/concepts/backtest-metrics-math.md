---
type: concept
title: "Backtest metrics math (monthly returns, rebalancing, headline metrics)"
tags: [finance, backtesting, math, reference]
sources: [[../../raw/passive-portfolio-visualizer-research.md#r-3]]
related:
  - [[../summaries/passive-portfolio-visualizer-research.md]]
status: stable
updated: 2026-07-10
---

# Backtest metrics math

Reference definitions for a deterministic, fully unit-testable backtest. All
functions are pure: a strategy + starting amount + start/end month → a monthly
growth series + four headline metrics [[../../raw/passive-portfolio-visualizer-research.md#r-3]].

## Inputs & recipe

- **Series:** monthly **total returns** per asset class (dividends reinvested).
- **Rebalancing:** **monthly** — at the start of each month, redistribute to
  the strategy's target weights. (Monthly is the conventional default; daily
  adds noise without changing the educational story. No-rebalance drift makes
  "the strategy" ambiguous over long horizons.)

## Computation

Let `r_i(t)` = asset class *i*'s monthly total return, `w_i` = its target
weight, `V(t)` = portfolio value.

- **Monthly portfolio return:** `r_p(t) = Σ_i w_i · r_i(t)` (weighted sum, post-rebalance).
- **Growth series:** `V(t) = V(t-1) · (1 + r_p(t))`, starting at the user's amount.
- **Total growth (%):** `(V_end / V_start) − 1`.
- **Annualized return (CAGR):** `(V_end / V_start)^(12 / n_months) − 1`.
- **Annualized volatility:** `std(monthly r_p) × √12` (standard monthly→annual annualization).
- **Max drawdown:** `max over t of (1 − V(t) / running_max(V up to t))`, as a percentage.

**Time-weighted vs money-weighted:** use time-weighted (CAGR). There are no
cash flows in/out during a run, so the distinction collapses.

## The honesty rules (non-negotiable)

- **Never smooth or hide drawdowns** — 2008/2020 crashes must appear as real
  dips in every value-over-time chart.
- **Never invent, interpolate, or carry-forward** numbers to fill a gap. If a
  chosen start predates a component's data, **shorten to the latest common
  start** (with a plain-language warning) or **exclude** that strategy.
- **Comparisons align on the latest common start month** and say so plainly.
- Metrics use **identical definitions, units, and time bases across every
  view** (single run, comparison table, recommendation recap) so a given number
  means the same thing wherever it appears.

## Why monthly (not daily)

Daily rebalancing multiplies data size ~21× for the same educational story.
Monthly keeps each strategy faithful to its stated recipe at minimal cost.
