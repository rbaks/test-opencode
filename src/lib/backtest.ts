import type {
  AssetCategoryId,
  BacktestError,
  BacktestRun,
  BacktestRunInput,
  GrowthPoint,
  ReturnSeries,
  RunWarning,
  Strategy,
} from '@/types'
import { computeMetrics } from './metrics'

/**
 * The backtest engine (T033, contracts/backtest.md).
 *
 * A "backtest" is a time-travel replay of a strategy over real history: "if
 * you had put $X into this exact recipe on month M1 and rebalanced it back to
 * the recipe every month, what would the balance have done through M2?" The
 * engine takes a strategy, a starting amount, and a date range, and produces a
 * month-by-month growth series plus the four headline metrics.
 *
 * Pure function: no React, no DOM, no network. Identical inputs always produce
 * byte-identical outputs. Bad input returns a structured error — never throws
 * — so the UI can show a friendly message instead of a crash (FR-012).
 */

export type BacktestResult = { ok: true; run: BacktestRun } | { ok: false; error: BacktestError }

/**
 * Run a single-strategy backtest.
 *
 * @param input   The user's chosen strategy/amount/range.
 * @param series  The full bundled return series, keyed by asset id.
 * @param strategy The strategy being run (its allocations + earliestStartMonth).
 * @returns Either a successful BacktestRun or a structured validation error.
 */
export function runBacktest(
  input: BacktestRunInput,
  series: Record<AssetCategoryId, ReturnSeries>,
  strategy: Strategy,
): BacktestResult {
  // 1. Validate amount — zero/blank/negative/non-finite is blocked.
  if (!Number.isFinite(input.startAmount) || input.startAmount <= 0) {
    return {
      ok: false,
      error: { code: 'INVALID_AMOUNT', message: 'Enter an amount greater than zero.' },
    }
  }

  // 2. Validate range — start must be ≤ end (lexicographic = chronological for YYYY-MM).
  if (input.startMonth > input.endMonth) {
    return {
      ok: false,
      error: { code: 'INVALID_RANGE', message: 'Start month must be before the end month.' },
    }
  }

  // 3. Compute the effective range — the intersection of [start..end] with the
  //    strategy's `earliestStartMonth` (the latest component data start) and
  //    the latest month covered by every component. If the intersection is
  //    empty, return NO_DATA. If start predates the data, shorten with a
  //    warning (research.md §R-3, data-model.md edge case).
  const latestDataStart = strategy.earliestStartMonth
  const dataEnd = earliestAvailableEndMonth(strategy, series)

  let effectiveStart = input.startMonth
  let effectiveEnd = input.endMonth
  const warnings: RunWarning[] = []

  if (effectiveStart < latestDataStart) {
    effectiveStart = latestDataStart
    warnings.push({
      code: 'shortened-to-data',
      message: `Shortened to the available data (${latestDataStart} onward).`,
    })
  }
  if (effectiveEnd > dataEnd) {
    effectiveEnd = dataEnd
  }

  // No overlap → block the run with NO_DATA (never invent).
  if (effectiveStart > effectiveEnd) {
    return {
      ok: false,
      error: { code: 'NO_DATA', message: 'This strategy has no data for the chosen period.' },
    }
  }

  // 4. Iterate every month in [effectiveStart..effectiveEnd] and compute the
  //    portfolio's month-end value (post-rebalance monthly-return compounding).
  const growthSeries: GrowthPoint[] = []
  const monthlyReturns: number[] = []
  let value = input.startAmount

  for (const month of iterMonths(effectiveStart, effectiveEnd)) {
    // Portfolio monthly return = Σ (weight_i × return_i(month)) over the
    // strategy's allocations, using each component's monthly total return.
    let portfolioReturn = 0
    let allComponentsHaveData = true
    for (const alloc of strategy.allocations) {
      const r = lookupReturn(series[alloc.assetId], month)
      if (r === undefined) {
        allComponentsHaveData = false
        break
      }
      portfolioReturn += alloc.weight * r
    }

    // If any component is missing this month, treat the whole run as NO_DATA.
    // This is a defensive guard — the integrity check at module load should
    // guarantee alignment, so we should never hit this branch on the real
    // bundled dataset.
    if (!allComponentsHaveData) {
      return {
        ok: false,
        error: { code: 'NO_DATA', message: 'This strategy has no data for the chosen period.' },
      }
    }

    // Guard against pathological non-finite values from a malformed dataset.
    if (!Number.isFinite(portfolioReturn)) {
      return {
        ok: false,
        error: { code: 'NO_DATA', message: 'This strategy has no data for the chosen period.' },
      }
    }

    value = value * (1 + portfolioReturn)
    monthlyReturns.push(portfolioReturn)
    growthSeries.push({ month, value })
  }

  // 5. Empty range (shouldn't happen after the checks above, but be defensive).
  if (growthSeries.length === 0) {
    return {
      ok: false,
      error: { code: 'NO_DATA', message: 'This strategy has no data for the chosen period.' },
    }
  }

  // 6. Compute the four headline metrics from the growth series + monthly returns.
  const metrics = computeMetrics(input.startAmount, growthSeries, monthlyReturns)

  const run: BacktestRun = {
    ...input,
    growthSeries,
    metrics,
    dataRangeUsed: { startMonth: effectiveStart, endMonth: effectiveEnd },
    warnings,
  }

  return { ok: true, run }
}

/** The earliest month that is the end of every component series in this strategy. */
function earliestAvailableEndMonth(
  strategy: Strategy,
  series: Record<AssetCategoryId, ReturnSeries>,
): string {
  let earliest = ''
  for (const alloc of strategy.allocations) {
    const s = series[alloc.assetId]
    if (!s) continue
    const last = s.points[s.points.length - 1]?.month
    if (last !== undefined && (earliest === '' || last < earliest)) earliest = last
  }
  return earliest
}

/** Binary search for a month's return in a sorted ReturnSeries. */
function lookupReturn(series: ReturnSeries | undefined, month: string): number | undefined {
  if (!series) return undefined
  let lo = 0
  let hi = series.points.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const point = series.points[mid]
    if (!point) break
    const cmp = point.month.localeCompare(month)
    if (cmp === 0) return point.return
    if (cmp < 0) lo = mid + 1
    else hi = mid - 1
  }
  return undefined
}

/** Yields every 'YYYY-MM' in [start..end] inclusive, one calendar month at a time. */
export function iterMonths(start: string, end: string): string[] {
  const out: string[] = []
  let y = Number(start.slice(0, 4))
  let m = Number(start.slice(5, 7))
  const ey = Number(end.slice(0, 4))
  const em = Number(end.slice(5, 7))
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return out
}

/**
 * One strategy's aligned backtest result inside a comparison plan.
 * (US3 / T040 — only successful runs are included; failures are dropped.)
 */
export interface ComparisonRun {
  strategyId: string
  result: BacktestResult
}

/**
 * Plain-language alignment notice produced when a comparison could not honor
 * the user's exact requested span. Two distinct causes (often both at once):
 *   - the selected strategies disagree on their earliest-data month, OR
 *   - the user's requested start predates the latest common start month.
 * Either way the chart still covers the same span for every line — we just
 * say so plainly (data-model.md edge case, FR-007/FR-011).
 */
export interface ComparisonAlignmentWarning {
  present: boolean
  /** The aligned start month every line actually begins at. */
  commonStartMonth?: string
  /** The user's requested start, when it was shifted forward to commonStart. */
  shortenedFrom?: string
  /** True when strategies disagree on their earliest-data month. */
  strategiesDiffer?: boolean
}

/**
 * A comparison plan: the aligned, successful runs plus the common span they
 * all cover. The UI renders one line per run on a shared time axis and an
 * aligned metrics table (US3 / SC-003, SC-005).
 */
export interface ComparisonPlan {
  runs: ComparisonRun[]
  commonStartMonth: string
  commonEndMonth: string
  alignmentWarning: ComparisonAlignmentWarning
}

/**
 * runComparison (T040) — aligns multiple strategies on the latest common
 * start month so every line covers the exact same span.
 *
 * The rule (data-model.md edge case): a comparison can only start at the
 * latest of the selected strategies' `earliestStartMonth` values — the month
 * when every selected strategy finally has data. The user's requested start
 * is honored when it falls at or after that common start; otherwise the span
 * is shifted forward and an alignment warning is attached.
 *
 * Strategies that cannot contribute (their data starts after the requested
 * end, or their run fails validation) are silently dropped — they never
 * poison the comparison or throw (FR-012 graceful failure).
 *
 * Pure function: identical inputs → byte-identical outputs.
 */
export function runComparison(
  strategies: Strategy[],
  input: { startAmount: number; startMonth: string; endMonth: string },
  series: Record<AssetCategoryId, ReturnSeries>,
): ComparisonPlan {
  if (strategies.length === 0) {
    return {
      runs: [],
      commonStartMonth: input.startMonth,
      commonEndMonth: input.endMonth,
      alignmentWarning: { present: false },
    }
  }

  // Step 1 — drop strategies whose data starts after the requested end. They
  // cannot contribute to this span; including them would force every other
  // line to start past the user's end month, producing an empty plan.
  const usable = strategies.filter((s) => s.earliestStartMonth <= input.endMonth)

  if (usable.length === 0) {
    return {
      runs: [],
      commonStartMonth: input.startMonth,
      commonEndMonth: input.endMonth,
      alignmentWarning: { present: false },
    }
  }

  // Step 2 — compute the latest common start month among the survivors and
  // whether the strategies disagree on their earliest-data month.
  let commonStart = usable[0]!.earliestStartMonth
  let strategiesDiffer = false
  for (const s of usable) {
    if (s.earliestStartMonth !== commonStart) strategiesDiffer = true
    if (s.earliestStartMonth > commonStart) commonStart = s.earliestStartMonth
  }

  // Step 3 — the aligned start honors the user's choice when it is already
  // at or after the common start; otherwise it shifts forward to the common
  // start so every line covers the same span.
  const alignedStart = input.startMonth > commonStart ? input.startMonth : commonStart
  const alignedEnd = input.endMonth

  // Step 4 — run each survivor over the aligned span. Defensive: a run could
  // still fail (e.g. INVALID_RANGE when alignedStart > alignedEnd on a
  // pathological input) — failures are dropped, never thrown.
  const runs: ComparisonRun[] = []
  for (const strategy of usable) {
    const result = runBacktest(
      {
        strategyId: strategy.id,
        startAmount: input.startAmount,
        startMonth: alignedStart,
        endMonth: alignedEnd,
      },
      series,
      strategy,
    )
    if (result.ok) {
      runs.push({ strategyId: strategy.id, result })
    }
  }

  // Step 5 — surface the alignment warning when strategies disagree OR the
  // user's requested start was shifted forward. The UI shows this as a
  // plain-language note so a beginner understands why the chart starts where
  // it does (FR-011, spec edge case "Chosen period has missing data").
  const userShifted = input.startMonth < commonStart
  const present = strategiesDiffer || userShifted

  return {
    runs,
    commonStartMonth: alignedStart,
    commonEndMonth: alignedEnd,
    alignmentWarning: present
      ? {
          present: true,
          commonStartMonth: alignedStart,
          shortenedFrom: userShifted ? input.startMonth : undefined,
          strategiesDiffer,
        }
      : { present: false },
  }
}
