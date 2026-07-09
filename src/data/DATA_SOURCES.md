# Data Sources & Methodology

This document credits the sources of the bundled historical data and explains the
one documented substitution ("proxy") used for the bond sleeve. It is the
detailed methodology behind the always-visible disclaimer (FR-011). See
`specs/001-passive-portfolio-visualizer/research.md` §R-2 for the full rationale.

> **Plain-language summary**: the numbers in this app come from two free,
> widely-trusted public datasets — one for stocks (the Kenneth French Data
> Library at Dartmouth) and one for bonds and gold (FRED, run by the St. Louis
> Fed). Because there is no clean free dataset for the whole bond market, the
> bond portion uses roughly-five-year US government bonds (Treasuries) as a
> labeled stand-in. This is stated openly, never hidden.

## Sources

| Asset class | Source | Series id |
|---|---|---|
| US Total Stock Market | Kenneth French Data Library (Tuck / Dartmouth) | `Mkt-RF` (CRSP value-weighted, dividends reinvested) |
| International Developed Stocks | Kenneth French Data Library | Developed ex US `Mkt-RF` |
| Emerging-Market Stocks | Kenneth French Data Library | Emerging Markets 5 Factors `Mkt-RF` |
| US Intermediate Treasuries | FRED (St. Louis Fed) | Derived total return from `GS5` (5-yr constant-maturity yield) |
| Gold | FRED (St. Louis Fed) | `GOLDAMGBD228NLBM` (London PM fix) |

- **Kenneth French Data Library**: `https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html`
- **FRED (Federal Reserve Economic Data)**: `https://fred.stlouisfed.org/`

All equity series are **monthly total returns** (dividends reinvested). US
government data from FRED is in the **public domain** and freely redistributable
with attribution. The French Data Library has no explicit redistributable
license but is the universally-tolerated academic standard for asset-pricing
research; it is credited here and in the in-app disclaimer.

## Data vintage ("as-of" date)

The bundled dataset is a **frozen snapshot** taken at build time. The specific
"as-of" month is shown in the in-app disclaimer so a reader always knows how
fresh the numbers are. The data covers roughly 1990–present at monthly
granularity.

## Refresh cadence

**Annual.** A yearly refresh is sufficient for an educational tool whose point
is long-horizon behavior, not daily tracking. The dataset is bundled at build
time, so a refresh is a new build, not a runtime fetch — the app stays fully
usable offline after first load (FR-012).

## Documented proxy: intermediate Treasuries for the bond sleeve

There is **no clean public-domain monthly total-return series** for US
investment-grade corporate or aggregate bonds. The commercial indices that track
them (ICE/Bloomberg) forbid redistribution — even when mirrored on FRED. To stay
both legal and educationally honest, every strategy's fixed-income allocation
uses a **derived intermediate-Treasury total return** (computed from the FRED
`GS5` 5-year yield via the standard duration formula, per research.md §R-3).

This is a **labeled substitution**, not a silent one:

- The UI labels the bond ingredient as "US Intermediate Treasuries."
- The disclaimer states plainly that Treasuries stand in for the broader bond
  market as a known limitation (FR-011).
- The attribution above records exactly which series is used.

Educationally this is sound: intermediate Treasuries capture the broad
shape of bond behavior over decades (the steady, lower-volatility ballast against
stocks), which is the lesson the tool teaches. The fidelity gap to a true
aggregate-bond index is disclosed so no one mistakes it for one.

## How the numbers are computed

- **Rebalancing**: monthly. At the start of each month the portfolio is reset to
  the strategy's target weights.
- **Monthly portfolio return**: the weighted sum of each asset class's monthly
  total return, using the target weights.
- **Growth series**: cumulative value starting at the user's amount, compounded
  month by month: `value(t) = value(t-1) × (1 + return(t))`.
- **Total growth**: `(ending value / starting amount) − 1`.
- **Annualized return (CAGR)**: `(ending / starting)^(12 / months) − 1`.
- **Volatility**: standard deviation of monthly returns × √12 (annualized).
- **Worst drawdown**: largest peak-to-trough drop in the growth series.

Gains and losses are shown **truthfully** — drawdowns (including the 2008 and
2020 crashes) are never smoothed or hidden (FR-007). When a chosen period
predates a strategy's data, the run is **shortened to the latest common start
month** with a plain-language warning — numbers are never invented (FR-012).

## Comparison alignment rule

When comparing strategies whose data begins in different months, all strategies
are aligned on the **latest common start month** so every line covers the same
span. The comparison states this plainly when it happens (FR-006).

## Attribution for TradingView Lightweight Charts

All time-series charts use TradingView Lightweight Charts (Apache-2.0), which
includes its own attribution logo as required by the license.
