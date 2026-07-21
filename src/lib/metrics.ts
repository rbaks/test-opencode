import type { GrowthPoint, Metric } from '@/types'
import { formatPercent } from './format'

/**
 * Headline-metric computation (T034, contracts/backtest.md).
 *
 * A successful backtest run produces a month-by-month growth series. This
 * module turns that series into the four headline numbers every user sees:
 * how much the money grew (total growth), the steady yearly rate that would
 * have produced that growth (annualized return / CAGR), how bumpy the ride was
 * (volatility), and the worst drop from peak to trough (max drawdown).
 *
 * Pure function: identical inputs → byte-identical outputs. Never returns
 * NaN/Infinity on validated inputs. Each metric carries its plain-language
 * label and a one-line beginner definition (FR-005) so the UI never shows a
 * bare number without context.
 */

/**
 * Compute the four required headline metrics for a single run.
 *
 * @param startAmount     The user's starting amount in USD (V_start).
 * @param growthSeries    Month-end portfolio values (one point per month).
 * @param monthlyReturns  Month-on-month portfolio returns for the same span.
 */
export function computeMetrics(
  startAmount: number,
  growthSeries: GrowthPoint[],
  monthlyReturns: number[],
): Metric[] {
  if (growthSeries.length === 0) {
    return []
  }

  const last = growthSeries[growthSeries.length - 1]!
  const vStart = startAmount
  const vEnd = last.value
  const nMonths = growthSeries.length

  // --- Total growth = (V_end / V_start) − 1 -------------------------------
  // V_start is the user's starting amount (what they actually put in), so
  // the result measures "how much money I made or lost over the whole period."
  const totalGrowth = vEnd / vStart - 1

  // --- Annualized return = CAGR = (V_end / V_start)^(12/n) − 1 ------------
  // The steady yearly rate that would have produced V_end from V_start.
  // Never the arithmetic mean of yearly returns (FR-005 / CHK022).
  const ratio = vEnd / vStart
  const annualizedReturn = nMonths > 0 && ratio > 0 ? Math.pow(ratio, 12 / nMonths) - 1 : -1

  // --- Annualized volatility = stdev(monthlyReturns) × √12 ----------------
  // Standard deviation of monthly portfolio returns, scaled up to a yearly
  // figure. Bigger = wider swings = a bumpier ride.
  const volatility = computeAnnualizedVolatility(monthlyReturns)

  // --- Max drawdown = largest peak-to-trough drop, ≤ 0 --------------------
  // Computed against a running peak that starts at the user's starting amount
  // (so a portfolio that only falls from day one still records a drawdown).
  const maxDrawdown = computeMaxDrawdown(vStart, growthSeries)

  return [
    {
      key: 'total-growth',
      label: 'Total Growth',
      value: totalGrowth,
      displayValue: formatPercent(totalGrowth),
      definition:
        'How much your money grew (or shrank) over the whole chosen period, as a percentage of what you started with.',
    },
    {
      key: 'annualized-return',
      label: 'Annualized Return',
      value: annualizedReturn,
      displayValue: formatPercent(annualizedReturn),
      definition:
        'The steady yearly growth rate that would have produced your total result. It smooths the bumpy years into one comparable per-year number.',
    },
    {
      key: 'volatility',
      label: 'Volatility',
      value: volatility,
      displayValue: formatPercent(volatility),
      definition:
        'How bumpy the ride was — wider swings up and down mean a higher number. Annualized from monthly returns.',
    },
    {
      key: 'max-drawdown',
      label: 'Worst Drawdown',
      value: maxDrawdown,
      displayValue: formatPercent(maxDrawdown),
      definition:
        'The largest peak-to-trough drop observed over the whole period — the deepest hole your portfolio fell into before climbing back out.',
    },
  ]
}

/** Sample standard deviation of an array of numbers; returns 0 for < 2 samples. */
export function standardDeviation(values: number[]): number {
  const n = values.length
  if (n < 2) return 0
  const mean = values.reduce((sum, v) => sum + v, 0) / n
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1)
  return Math.sqrt(variance)
}

/** Annualized volatility: stdev(monthlyReturns) × √12. */
function computeAnnualizedVolatility(monthlyReturns: number[]): number {
  return standardDeviation(monthlyReturns) * Math.sqrt(12)
}

/**
 * Largest peak-to-trough drop in the growth series, ≤ 0 always.
 * The running peak starts at the user's starting amount (V_start) so that a
 * monotonically-falling run records its full drop.
 */
function computeMaxDrawdown(vStart: number, growthSeries: GrowthPoint[]): number {
  let peak = vStart
  let maxDrawdown = 0
  for (const point of growthSeries) {
    if (point.value > peak) peak = point.value
    if (peak > 0) {
      const drawdown = point.value / peak - 1 // ≤ 0 always
      if (drawdown < maxDrawdown) maxDrawdown = drawdown
    }
  }
  return maxDrawdown
}
