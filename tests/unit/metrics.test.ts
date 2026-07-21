import { describe, it, expect } from 'vitest'
import { runBacktest } from '@/lib/backtest'
import { computeMetrics } from '@/lib/metrics'
import { RETURN_SERIES } from '@/data/returns'
import { STRATEGIES, getStrategy } from '@/data/strategies'
import { FIXTURE_STRATEGY, FIXTURE_SERIES } from '../fixtures/backtest'

/**
 * T026 — computeMetrics returns all four headline metrics, max-drawdown ≤ 0,
 * and no NaN/Infinity on any input.
 *
 * Guarantees from contracts/backtest.md:
 * - All four metrics present (total-growth, annualized-return, volatility,
 *   max-drawdown).
 * - max-drawdown ≤ 0 always.
 * - Deterministic: identical inputs → identical outputs.
 * - No NaN/Infinity: outputs are finite decimals.
 *
 * Interpretation note: V_start = the user's `startAmount` (the money the user
 * actually put in), V_end = the last month-end portfolio value. This matches
 * the plain-language definition "how much your money grew" — a user who starts
 * with $10,000 and ends at $14,200 grew their money by +42%, never by some
 * smaller number that ignores the first month's gain.
 */

describe('T026 — computeMetrics on the hand-verified fixture', () => {
  const START = 1000

  function fixtureRun() {
    const r = runBacktest(
      {
        strategyId: FIXTURE_STRATEGY.id,
        startAmount: START,
        startMonth: '2024-01',
        endMonth: '2024-03',
      },
      FIXTURE_SERIES,
      FIXTURE_STRATEGY,
    )
    if (!r.ok) throw new Error('expected ok')
    return r.run
  }

  it('returns all four required metric keys with finite values', () => {
    const run = fixtureRun()
    const monthlyReturns = monthlyReturnsFromGrowth(run.growthSeries.map((p) => p.value))
    const metrics = computeMetrics(run.startAmount, run.growthSeries, monthlyReturns)

    const keys = metrics.map((m) => m.key).sort()
    expect(keys).toEqual(['annualized-return', 'max-drawdown', 'total-growth', 'volatility'])

    for (const m of metrics) {
      expect(Number.isFinite(m.value)).toBe(true)
      expect(m.label.length).toBeGreaterThan(0)
      expect(m.displayValue.length).toBeGreaterThan(0)
      expect(m.definition.length).toBeGreaterThan(0)
    }
  })

  it('total-growth matches (V_end / startAmount) - 1', () => {
    const run = fixtureRun()
    const monthlyReturns = monthlyReturnsFromGrowth(run.growthSeries.map((p) => p.value))
    const metrics = computeMetrics(run.startAmount, run.growthSeries, monthlyReturns)
    const totalGrowth = metrics.find((m) => m.key === 'total-growth')!

    const vEnd = run.growthSeries[run.growthSeries.length - 1]!.value
    const expected = vEnd / START - 1 // 831.04 / 1000 - 1 = -0.16896
    expect(totalGrowth.value).toBeCloseTo(expected, 6)
  })

  it('max-drawdown ≤ 0 and reflects the worst peak-to-trough drop including the start', () => {
    const run = fixtureRun()
    const monthlyReturns = monthlyReturnsFromGrowth(run.growthSeries.map((p) => p.value))
    const metrics = computeMetrics(run.startAmount, run.growthSeries, monthlyReturns)
    const dd = metrics.find((m) => m.key === 'max-drawdown')!

    expect(dd.value).toBeLessThanOrEqual(0)
    // Peak in the growth series is $1060 (end of Jan). Trough = $742 (end of Feb).
    // DD = 742/1060 - 1 = -0.30000 (the deepest hole before recovery).
    expect(dd.value).toBeCloseTo(-0.3, 5)
  })

  it('volatility × √12 is finite and non-negative', () => {
    const run = fixtureRun()
    const monthlyReturns = monthlyReturnsFromGrowth(run.growthSeries.map((p) => p.value))
    const metrics = computeMetrics(run.startAmount, run.growthSeries, monthlyReturns)
    const vol = metrics.find((m) => m.key === 'volatility')!

    expect(vol.value).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(vol.value)).toBe(true)
  })

  it('annualized return matches (V_end / startAmount)^(12/n) - 1', () => {
    const run = fixtureRun()
    const monthlyReturns = monthlyReturnsFromGrowth(run.growthSeries.map((p) => p.value))
    const metrics = computeMetrics(run.startAmount, run.growthSeries, monthlyReturns)
    const cagr = metrics.find((m) => m.key === 'annualized-return')!

    const vEnd = run.growthSeries[run.growthSeries.length - 1]!.value
    const n = run.growthSeries.length
    const expected = Math.pow(vEnd / START, 12 / n) - 1
    expect(cagr.value).toBeCloseTo(expected, 6)
  })
})

describe('T026 — NaN/Infinity guard + max-drawdown ≤ 0 over the real bundled dataset', () => {
  for (const s of STRATEGIES) {
    it(`strategy "${s.id}" metrics are finite, all four present, drawdown ≤ 0`, () => {
      const r = runBacktest(
        {
          strategyId: s.id,
          startAmount: 10000,
          startMonth: s.earliestStartMonth,
          endMonth: '2025-06',
        },
        RETURN_SERIES,
        s,
      )
      expect(r.ok).toBe(true)
      if (!r.ok) return

      const values = r.run.growthSeries.map((p) => p.value)
      const monthlyReturns = monthlyReturnsFromGrowth(values)
      const metrics = computeMetrics(r.run.startAmount, r.run.growthSeries, monthlyReturns)

      const keys = metrics.map((m) => m.key).sort()
      expect(keys).toEqual(['annualized-return', 'max-drawdown', 'total-growth', 'volatility'])

      for (const m of metrics) {
        expect(Number.isFinite(m.value)).toBe(true)
      }

      const dd = metrics.find((m) => m.key === 'max-drawdown')!
      expect(dd.value).toBeLessThanOrEqual(0)

      const vol = metrics.find((m) => m.key === 'volatility')!
      expect(vol.value).toBeGreaterThanOrEqual(0)
    })

    it(`strategy "${s.id}" metrics are deterministic across two runs`, () => {
      const runOnce = () => {
        const r = runBacktest(
          {
            strategyId: s.id,
            startAmount: 10000,
            startMonth: s.earliestStartMonth,
            endMonth: '2025-06',
          },
          RETURN_SERIES,
          s,
        )
        if (!r.ok) throw new Error('expected ok')
        const monthlyReturns = monthlyReturnsFromGrowth(r.run.growthSeries.map((p) => p.value))
        return computeMetrics(r.run.startAmount, r.run.growthSeries, monthlyReturns)
      }
      const a = runOnce()
      const b = runOnce()
      expect(a.map((m) => m.value)).toEqual(b.map((m) => m.value))
    })
  }
})

describe('T026 — plain-language label + definition present (FR-005)', () => {
  it('every metric carries a non-empty label, displayValue, and one-line definition', () => {
    const s = getStrategy('60-40')!
    const r = runBacktest(
      {
        strategyId: s.id,
        startAmount: 10000,
        startMonth: s.earliestStartMonth,
        endMonth: '2025-06',
      },
      RETURN_SERIES,
      s,
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return

    const values = r.run.growthSeries.map((p) => p.value)
    const monthlyReturns = monthlyReturnsFromGrowth(values)
    const metrics = computeMetrics(r.run.startAmount, r.run.growthSeries, monthlyReturns)
    for (const m of metrics) {
      expect(m.label.trim().length).toBeGreaterThan(0)
      expect(m.displayValue.trim().length).toBeGreaterThan(0)
      expect(m.definition.trim().length).toBeGreaterThan(10)
      // Definitions end with sentence-ending punctuation (a beginner sentence).
      expect(m.definition).toMatch(/[.!?]$/)
    }
  })
})

/** Helper: derive month-on-month returns from a series of month-end values. */
function monthlyReturnsFromGrowth(values: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1]!
    const curr = values[i]!
    if (prev !== 0) out.push(curr / prev - 1)
  }
  return out
}
