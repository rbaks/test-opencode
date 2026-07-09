# Contract: Backtest Engine & Metrics

**Branch**: `001-passive-portfolio-visualizer`

This is the app's **internal** pure-function contract: the backtest engine and
the headline-metric computations. These functions are the testable core of the
product — they take deterministic inputs and produce deterministic outputs,
with **no React, no DOM, no network**. Keeping them pure is what makes the
constitution's testing standard (II) tractable.

In plain words: a **backtest** is a time-travel replay — "if you had put
$10,000 into this exact recipe in January 2000 and rebalanced it back to the
recipe every month, what would the balance have done through today?" The
**metrics** are four summary scores of that replay: how much it grew, the
smoothed yearly rate, how bumpy the ride was, and how bad the worst dip got.

---

## Module: `src/lib/backtest.ts`

### `runBacktest(input, series, strategy) → BacktestRun`

```ts
function runBacktest(
  input: BacktestRunInput,
  series: Record<AssetCategoryId, ReturnSeries>,
  strategy: Strategy,
): BacktestResult;
```

Where the result is either a valid run or a structured validation failure
(never throws on bad user input — see Validation below):

```ts
type BacktestResult =
  | { ok: true; run: BacktestRun }
  | { ok: false; error: BacktestError };
```

### Computation contract (the testable guarantees)

1. **Monthly cadence.** The engine operates one month at a time over
   `[startMonth .. endMonth]`.
2. **Monthly rebalance.** At the start of each month, the portfolio is
   redistributed to `strategy.allocations` target weights. (Drift is reset
   monthly — see research.md §R-3 for why monthly, not daily or never.)
3. **Portfolio monthly return** = `Σ (weight_i × return_i(month))` over the
   strategy's asset classes, using that month's total return from `series`.
4. **Growth series** = cumulative value: `V(t) = V(t−1) · (1 + r_portfolio(t))`,
   starting at `input.startAmount`. Returned as `GrowthPoint[]` month-by-month.
5. **Honesty** (FR-007): losses, crashes, and drawdowns are computed from the
   real series and **never smoothed, clipped, or hidden**. The 2008 and 2020
   crashes (within the bundled 2000–present window) must appear as real dips.
6. **Range adjustment** (edge cases): if `input.startMonth` predates
   `strategy.earliestStartMonth`, the run is shortened to
   `strategy.earliestStartMonth` and a `RunWarning` is attached ("shortened
   to the available data"). If the range is entirely invalid, the run is
   excluded from a comparison — **never invented**.

### Validation (must FAIL gracefully, never throw)

`runBacktest` returns `{ ok: false, error }` when:

| Condition | Error code | User-facing message |
|---|---|---|
| `startAmount <= 0` (zero/blank/negative) | `INVALID_AMOUNT` | "Enter an amount greater than zero." |
| `startMonth > endMonth` | `INVALID_RANGE` | "Start month must be before the end month." |
| No overlap between the requested range and available data | `NO_DATA` | "This strategy has no data for the chosen period." |

A failed validation **blocks computation** — no partial/garbage chart is ever
rendered (FR-012, edge case "Amount is zero, blank, or negative").

---

## Module: `src/lib/metrics.ts`

### `computeMetrics(growthSeries, monthlyReturns) → Metric[]`

Given a run's growth series and the per-month portfolio returns, compute the
**four required headline metrics** (FR-005). Every metric carries its
plain-language label and one-line definition (so the UI never shows a bare
number).

| key | label | formula | units |
|---|---|---|---|
| `total-growth` | Total Growth | `(V_end / V_start) − 1` | decimal (e.g. `0.42`) |
| `annualized-return` | Annualized Return | `(V_end / V_start)^(12 / n_months) − 1` | decimal per year |
| `volatility` | Volatility (Risk) | `stdev(monthlyReturns) × √12` | decimal per year |
| `max-drawdown` | Worst Drawdown | `max over t of (1 − V(t) / max(V[0..t]))` | decimal (≤ 0) |

### Contract guarantees

- **All four metrics present** for every successful run (no partial sets).
- **`max-drawdown ≤ 0`** always (it is a drop or zero; never positive).
- **Deterministic**: identical inputs → byte-identical outputs (no
  floating-point nondeterminism across runs; stable rounding for display).
- **No NaN/Infinity**: inputs are pre-validated, so outputs are finite
  decimals. A guard test asserts this over the fixture dataset.

### Display formatting (`src/lib/format.ts`)

Metrics are formatted for display via pure functions:
- `formatPercent(decimal)` → `"+42.0%"` / `"-18.3%"`
- `formatCurrency(usd)` → `"$10,000"` / `"$14,200"`
- `formatMonth('YYYY-MM')` → `"Jan 2000"`

Formatting is locale-stable (en-US, USD — spec assumption) and unit-tested.
