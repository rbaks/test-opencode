# Data Model: Passive Portfolio Visualizer

**Branch**: `001-passive-portfolio-visualizer`
**Date**: 2026-07-09

This describes every piece of data the app works with, in plain words first
and then as the concrete TypeScript shapes the code will use. There is **no
database** — all of this is in-memory at runtime, with the bundled market
history shipped as static JSON and the user's choices encoded into the URL.
See [research.md](./research.md) §R-1 (no backend) and §R-8 (URL is storage).

A quick framing for non-experts: think of this app like a recipe book. The
**Asset Classes** are the ingredients (US stocks, international stocks,
bonds, gold…). A **Strategy** is a recipe that says how much of each
ingredient to use. A **Backtest Run** is "what happened when we cooked that
recipe over a specific stretch of history." The **Metric** values are the
taste-test scores (how much it grew, how bumpy the ride was, how bad the
worst dip got).

---

## Entities at a glance

| Entity | What it is (plain words) | Lifecycle |
|---|---|---|
| **AssetClass** | An ingredient (a market slice we have data for) | Bundled, read-only |
| **ReturnSeries** | The monthly performance history of one asset class | Bundled, read-only |
| **Strategy** | A named recipe: % per asset class + plain-language guidance | Bundled, read-only |
| **Allocation** | One line of a strategy: "asset X = Y%" | Part of a Strategy |
| **Backtest Run** | One simulation: a strategy + an amount + a date range | Created per user action, in-memory |
| **Metric** | A headline number for a run (growth, return, risk, drawdown) | Computed from a Run |
| **UserPreferenceSet** | The user's quiz answers (time horizon + risk comfort) | In-memory only, encoded to URL |

---

## AssetClass

A single market slice the app has bundled history for. Each maps to one
real-world data series (see [research.md](./research.md) §R-2 for sources).

```ts
type AssetCategoryId =
  | 'us-total-equity'     // US total stock market (Fama–French market factor)
  | 'intl-developed'      // International developed markets ex-US
  | 'intl-emerging'       // Emerging markets
  | 'us-treasury-interm'  // US intermediate Treasuries (derived from FRED GS5)
  | 'gold';               // Gold (FRED London PM fix)

interface AssetClass {
  id: AssetCategoryId;
  name: string;                 // Plain-language: "US total stock market"
  category: 'equity' | 'fixed-income' | 'commodity';
  dataSource: string;           // Human-readable source + series id
  proxyNote?: string;           // If this is a documented proxy (e.g. Treasury-for-bonds)
  glossary: string;             // One-line beginner definition (FR-003)
  dataStartMonth: string;       // 'YYYY-MM' — earliest available month
}
```

**Concrete asset classes bundled** (5):

| id | name | category | source |
|---|---|---|---|
| `us-total-equity` | US Total Stock Market | equity | Fama–French `Mkt-Rf` (CRSP value-weighted, dividends reinvested) |
| `intl-developed` | International Developed Stocks | equity | Fama–French "Developed ex US" `Mkt-Rf` |
| `intl-emerging` | Emerging-Market Stocks | equity | Fama–French "Emerging Markets 5 Factors" `Mkt-Rf` |
| `us-treasury-interm` | US Intermediate Treasuries | fixed-income | Derived total return from FRED `GS5` (5-yr constant-maturity yield) — **documented proxy** for the bond sleeve |
| `gold` | Gold | commodity | FRED `GOLDAMGBD228NLBM` (London PM fix) |

**Validation rules**:
- `id` is unique and stable (used in URL encoding — see Allocation).
- `dataStartMonth` is honored at run time: a strategy needing an asset class
  whose data starts after the user's chosen start date is either shortened to
  the latest common start (with a plain-language warning) or excluded
  (FR edge case: "Chosen period has missing data"). **Never invent numbers.**

---

## ReturnSeries

The bundled monthly performance history for one asset class. Each point is a
**monthly total return** (gains + dividends/interest reinvested), as a
decimal (e.g. `0.012` = +1.2%, `-0.034` = −3.4%).

```ts
interface ReturnPoint {
  month: string;     // 'YYYY-MM' (month-start, e.g. '2010-03')
  return: number;    // Monthly total return as a decimal
}

interface ReturnSeries {
  assetId: AssetCategoryId;
  points: ReturnPoint[];        // Sorted ascending by month; no duplicates
}
```

**Validation rules**:
- `points` strictly ascending by `month`; duplicate months are a data error.
- No gaps inside `[dataStartMonth .. latest]` except documented ones; missing
  months are flagged at build time (a data-lint test), not silently shipped.
- Stored as compressed JSON under `src/data/returns/` and imported as a
  build-time asset (no runtime fetch — see R-1).

---

## Allocation

One line of a strategy's recipe: "this asset class makes up this percentage."

```ts
interface Allocation {
  assetId: AssetCategoryId;
  weight: number;   // 0..1 (e.g. 0.6 = 60%)
}
```

**Validation rules**:
- Within a single `Strategy`, weights **sum to exactly 1.0** (± a tiny
  floating-point epsilon). A data-lint test enforces this; a strategy whose
  weights don't sum to 100% is rejected at build time, never at runtime.
- `weight` ∈ `[0, 1]` (no negative weights, no leverage in v1).

---

## Strategy

A named, predefined portfolio recipe. This is the heart of the "explore"
story (User Story 1) and the unit of comparison (Story 3).

```ts
interface Strategy {
  id: string;                    // URL-safe slug, e.g. '60-40', 'three-fund'
  name: string;                  // Display name: "60/40 Balanced"
  shortDescription: string;      // One-line summary for the gallery card
  whoItSuits: string;            // Plain-language "who this suits" guidance
  tradeoffs: string;             // Plain-language growth-vs-calm trade-off
  riskTier: 'conservative' | 'balanced' | 'aggressive';  // For recommendation
  allocations: Allocation[];     // The recipe (weights sum to 1.0)
  earliestStartMonth: string;    // 'YYYY-MM' — derived: max of component dataStartMonth
}
```

**The bundled strategy library (6 archetypes)** — covering the risk spectrum
from conservative to aggressive, as required by FR-001 (5–7 archetypes):

| id | name | risk tier | recipe | who it suits |
|---|---|---|---|---|
| `conservative-income` | Conservative Income | conservative | 20% US equity / 80% intermediate Treasuries | Investors who value stability over growth; short horizons |
| `60-40` | 60/40 Balanced | balanced | 60% US total equity / 40% intermediate Treasuries | The classic "set and forget"; medium horizons |
| `three-fund` | 3-Fund Portfolio | balanced | 50% US total equity / 20% intl developed / 30% intermediate Treasuries | Broad diversification, low cost; medium-to-long horizons |
| `all-weather` | All-Weather (simplified) | balanced | 30% US total equity / 15% intl developed / 40% intermediate Treasuries / 15% gold | Smooth ride across many economic conditions; medium-to-long horizons |
| `growth-tilt` | Growth Tilt | aggressive | 50% US total equity / 25% intl developed / 15% emerging / 10% intermediate Treasuries | Growth-seeking investors; long horizons |
| `all-equity` | All-Equity (Global) | aggressive | 55% US total equity / 30% intl developed / 15% emerging | Maximum long-term growth, highest volatility; long horizons |

> **Note on the bond sleeve**: every strategy above uses
> `us-treasury-interm` for its fixed-income allocation. This is the
> documented proxy from research.md §R-2 — there is no clean
> public-domain corporate/aggregate-bond total-return series. The UI and
> disclaimer label this clearly (FR-011). This is an educational simplification,
> not a silent substitution.

**Validation rules**:
- `id` is URL-safe and unique (it goes in the shareable link — R-7).
- `allocations` weights sum to 1.0 (± epsilon).
- `earliestStartMonth` = the **latest** `dataStartMonth` across the strategy's
  components (a strategy cannot start before its latest-arriving ingredient).
  Computed at build time and validated by test.

---

## Backtest Run

One simulation: "strategy S, starting with $A on month M₁, run through month
M₂." This is the unit of User Story 2 and the building block of comparison
(Story 3).

```ts
interface BacktestRunInput {
  strategyId: string;
  startAmount: number;           // > 0 (USD); zero/negative is blocked (edge case)
  startMonth: string;            // 'YYYY-MM'
  endMonth: string;              // 'YYYY-MM', >= startMonth
}

interface GrowthPoint {
  month: string;                 // 'YYYY-MM'
  value: number;                 // Portfolio value in USD at month-end
}

interface BacktestRun extends BacktestRunInput {
  growthSeries: GrowthPoint[];   // Month-end values, start..end (post-rebalance)
  metrics: Metric[];             // The four headline numbers
  dataRangeUsed: {               // What was actually computed (may differ from input)
    startMonth: string;          // Adjusted to latest-common-start if needed
    endMonth: string;
  };
  warnings: RunWarning[];        // e.g. "shortened to available data"
}
```

**Computation rules** (see [research.md](./research.md) §R-3 for the math):
- **Monthly rebalance** to target weights at each month's start.
- Portfolio monthly return = weighted sum of component monthly returns.
- `value(t) = value(t-1) · (1 + r_portfolio(t))`, starting at `startAmount`.
- Drawdowns, crashes, and losses are shown **honestly** — never smoothed
  (FR-007, edge case "Selected period is a market crash").

**State transitions**:
- `validated` → input passes (amount > 0, start ≤ end, data available) →
  `computed` → growth series + metrics produced. If validation fails, the run
  is **blocked** with a friendly message (never computed with bad input).

**Validation rules** (enforced before any computation):
- `startAmount > 0` (zero/blank/negative blocked — edge case).
- `startMonth <= endMonth`.
- `startMonth >= strategy.earliestStartMonth`; if not, the run either shortens
  to `earliestStartMonth` (with a warning) or is excluded from a comparison.

---

## Metric

A headline number for a run, always paired with a plain-language label and
definition (FR-005). This is what makes the abstract math legible to a
beginner.

```ts
type MetricKey = 'total-growth' | 'annualized-return' | 'volatility' | 'max-drawdown';

interface Metric {
  key: MetricKey;
  label: string;          // Plain-language: "Total Growth"
  value: number;          // The computed figure (decimal, e.g. 0.42 = 42%)
  displayValue: string;   // Formatted for humans: "+42.0%"
  definition: string;     // One-line beginner definition (FR-003/FR-005)
}
```

**The four required metrics** (FR-005):

| key | label | formula (research.md §R-3) | plain definition |
|---|---|---|---|
| `total-growth` | Total Growth | `(V_end / V_start) − 1` | How much your money grew (or shrank) over the whole period. |
| `annualized-return` | Annualized Return (CAGR) | `(V_end / V_start)^(12 / n_months) − 1` | The yearly growth rate that would have produced this result, smoothed. |
| `volatility` | Volatility (Risk) | `stdev(monthly returns) × √12` | How bumpy the ride was — bigger means wider swings up and down. |
| `max-drawdown` | Worst Drawdown | `max(1 − V(t) / running_peak)` | The worst drop from a peak to a trough before it recovered. |

**Validation rules**:
- All four metrics are present for every successful run (no partial results).
- `max-drawdown` is shown as a **non-positive** figure (a drop) and never
  softened (FR-007).

---

## UserPreferenceSet

The user's answers to the personalization quiz (User Story 4). Held in memory
only; encoded into the URL for sharing. Never persisted to device or server
(spec clarification 2026-07-09).

```ts
type TimeHorizon = 'short' | 'medium' | 'long';   // <5y / 5–15y / >15y
type RiskComfort = 'low' | 'medium' | 'high';     // How much drop the user can stomach

interface UserPreferenceSet {
  timeHorizon: TimeHorizon;
  riskComfort: RiskComfort;
}
```

**Validation rules**:
- Both fields required to produce a recommendation.
- Values come from a **fixed enum** (radio-group UI) — no free text.

**Recommendation mapping** (FR-008 — deterministic rule-based lookup):
`(timeHorizon, riskComfort) → strategyId`. Defined as a pure function in
`src/lib/recommend.ts` (see [contracts/recommendation.md](./contracts/recommendation.md)
for the full matrix and rationale text). The recommendation is **always**
accompanied by a one-paragraph plain-language reason that explains the mapping.

---

## Relationships

```text
AssetClass 1───* ReturnSeries        (one class, its full monthly history)
    │
    └─* Allocation *──1 Strategy     (a class appears in many strategies)
                        │
                        └─1──* BacktestRun  (a recipe replayed over a period)
                                     │
                                     └─* Metric       (4 per run)

UserPreferenceSet ──(recommend.ts lookup)──> Strategy (the recommendation)
```

---

## What is NOT in the data model

Explicitly out of scope (to prevent speculative complexity):
- **No User / Account entity** — no accounts exist (FR-009).
- **No SavedPortfolio / watchlist** — no persistence (R-8).
- **No Transaction / cash-flow entity** — runs have no deposits or
  withdrawals during the period (R-3).
- **No forward-looking projection entity** — v1 is historical backtests only
  (spec assumption: "historical, not predictive").
- **No live-price / quote entity** — no runtime data API (R-1).
