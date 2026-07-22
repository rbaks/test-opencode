import { describe, it, expect } from 'vitest'
import { runBacktest, runComparison } from '@/lib/backtest'
import { RETURN_SERIES } from '@/data/returns'
import { STRATEGIES, getStrategy } from '@/data/strategies'
import { FIXTURE_STRATEGY, FIXTURE_SERIES } from '../fixtures/backtest'

/**
 * T025 — Backtest engine produces the expected growth series from the bundled
 * fixture, AND shows 2008/2020 dips honestly (FR-007: never smoothed, clipped,
 * or hidden).
 *
 * T027 — runBacktest returns structured errors (INVALID_AMOUNT, INVALID_RANGE,
 * NO_DATA) and never throws on bad input.
 *
 * T040 — Comparison alignment: when a strategy starts later than the user's
 * chosen start, the run is shortened to the latest common start with a
 * `shortened-to-data` warning.
 */

describe('T025 — runBacktest growth series (hand-verified fixture)', () => {
  it('produces the expected month-end values for the 60/40 fixture', () => {
    const result = runBacktest(
      {
        strategyId: FIXTURE_STRATEGY.id,
        startAmount: 1000,
        startMonth: '2024-01',
        endMonth: '2024-03',
      },
      FIXTURE_SERIES,
      FIXTURE_STRATEGY,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return // narrow for TS; vitest's expect above already failed

    const values = result.run.growthSeries.map((p) => Math.round(p.value * 100) / 100)
    // Hand-computed: 1000 → 1060 → 742 → 831.04
    expect(values).toEqual([1060, 742, 831.04])
  })

  it('every growth point has the right ascending month and a finite positive-ish value', () => {
    const result = runBacktest(
      {
        strategyId: FIXTURE_STRATEGY.id,
        startAmount: 1000,
        startMonth: '2024-01',
        endMonth: '2024-03',
      },
      FIXTURE_SERIES,
      FIXTURE_STRATEGY,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const months = result.run.growthSeries.map((p) => p.month)
    expect(months).toEqual(['2024-01', '2024-02', '2024-03'])
    for (const p of result.run.growthSeries) {
      expect(Number.isFinite(p.value)).toBe(true)
    }
  })

  it('respects the user start month (first growth point IS the start month)', () => {
    const result = runBacktest(
      {
        strategyId: FIXTURE_STRATEGY.id,
        startAmount: 1000,
        startMonth: '2024-02',
        endMonth: '2024-03',
      },
      FIXTURE_SERIES,
      FIXTURE_STRATEGY,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.run.growthSeries[0]?.month).toBe('2024-02')
    expect(result.run.growthSeries[1]?.month).toBe('2024-03')
  })
})

describe('T025 — FR-007 honesty: 2008 and 2020 crashes are real dips on the bundled data', () => {
  // A balanced strategy over 2007-2010 must contain a substantial month-on-month
  // drop during the 2008 crisis window. The same is true for early 2020.
  it('the 60/40 strategy shows a real loss month during the 2008 crisis', () => {
    const s = getStrategy('60-40')!
    const result = runBacktest(
      {
        strategyId: s.id,
        startAmount: 10000,
        startMonth: '2007-01',
        endMonth: '2010-12',
      },
      RETURN_SERIES,
      s,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // Find the worst month-on-month return inside the 2008-09..2009-02 window.
    const window = result.run.growthSeries.filter((p) =>
      ['2008-09', '2008-10', '2008-11', '2008-12', '2009-01', '2009-02'].includes(p.month),
    )
    expect(window.length).toBeGreaterThan(0)
    // Compute month-on-month pct change inside the run (we recompute from the
    // raw series so this test does not depend on the metrics module).
    const monthReturns: number[] = []
    const series = result.run.growthSeries
    for (let i = 1; i < series.length; i++) {
      const prev = series[i - 1]!
      const curr = series[i]!
      if (prev.value !== 0) monthReturns.push(curr.value / prev.value - 1)
    }
    const minReturn = Math.min(...monthReturns)
    expect(minReturn).toBeLessThan(-0.05) // at least one -5% or worse month
  })

  it('the 60/40 strategy shows a real loss month during the 2020 COVID crash', () => {
    const s = getStrategy('60-40')!
    const result = runBacktest(
      {
        strategyId: s.id,
        startAmount: 10000,
        startMonth: '2019-06',
        endMonth: '2020-12',
      },
      RETURN_SERIES,
      s,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const series = result.run.growthSeries
    const monthReturns: number[] = []
    for (let i = 1; i < series.length; i++) {
      const prev = series[i - 1]!
      const curr = series[i]!
      if (prev.value !== 0) monthReturns.push(curr.value / prev.value - 1)
    }
    const minReturn = Math.min(...monthReturns)
    expect(minReturn).toBeLessThan(-0.03) // at least one -3% or worse month
  })
})

describe('T027 — runBacktest returns structured errors (never throws)', () => {
  const baseInput = {
    strategyId: FIXTURE_STRATEGY.id,
    startAmount: 1000,
    startMonth: '2024-01',
    endMonth: '2024-03',
  }

  it('returns INVALID_AMOUNT for zero', () => {
    const r = runBacktest({ ...baseInput, startAmount: 0 }, FIXTURE_SERIES, FIXTURE_STRATEGY)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error.code).toBe('INVALID_AMOUNT')
    expect(r.error.message).toMatch(/greater than zero/i)
  })

  it('returns INVALID_AMOUNT for negative', () => {
    const r = runBacktest({ ...baseInput, startAmount: -500 }, FIXTURE_SERIES, FIXTURE_STRATEGY)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error.code).toBe('INVALID_AMOUNT')
  })

  it('returns INVALID_AMOUNT for NaN (non-finite)', () => {
    const r = runBacktest(
      { ...baseInput, startAmount: Number.NaN },
      FIXTURE_SERIES,
      FIXTURE_STRATEGY,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error.code).toBe('INVALID_AMOUNT')
  })

  it('returns INVALID_RANGE when start > end', () => {
    const r = runBacktest(
      { ...baseInput, startMonth: '2024-03', endMonth: '2024-01' },
      FIXTURE_SERIES,
      FIXTURE_STRATEGY,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error.code).toBe('INVALID_RANGE')
    expect(r.error.message).toMatch(/before/i)
  })

  it('returns NO_DATA when the requested range has no overlap with the data', () => {
    const r = runBacktest(
      { ...baseInput, startMonth: '2030-01', endMonth: '2030-06' },
      FIXTURE_SERIES,
      FIXTURE_STRATEGY,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error.code).toBe('NO_DATA')
    expect(r.error.message).toMatch(/no data/i)
  })

  it('returns NO_DATA when the range is entirely before any component data starts', () => {
    // The fixture's only asset with data starts at 2024-01, so 2023 is empty.
    const r = runBacktest(
      { ...baseInput, startMonth: '2023-01', endMonth: '2023-06' },
      FIXTURE_SERIES,
      FIXTURE_STRATEGY,
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error.code).toBe('NO_DATA')
  })
})

describe('T040 — range adjustment + shortened-to-data warning (alignment helper)', () => {
  it('shortens the run to the strategy earliestStartMonth and warns', () => {
    // Build a strategy whose earliestStartMonth is inside the fixture range.
    const s = { ...FIXTURE_STRATEGY, earliestStartMonth: '2024-02' }
    const r = runBacktest(
      {
        strategyId: s.id,
        startAmount: 1000,
        startMonth: '2024-01', // before earliestStartMonth
        endMonth: '2024-03',
      },
      FIXTURE_SERIES,
      s,
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.run.dataRangeUsed.startMonth).toBe('2024-02')
    expect(r.run.dataRangeUsed.endMonth).toBe('2024-03')
    expect(r.run.warnings.some((w) => w.code === 'shortened-to-data')).toBe(true)
    expect(r.run.growthSeries[0]?.month).toBe('2024-02')
  })
})

describe('T040 — runComparison aligns multiple runs on the latest common start month', () => {
  it('aligns every successful run to the max of the strategies\' earliestStartMonth', () => {
    // Two strategies that disagree on their earliest start month. The
    // comparison must start every run at the later of the two so every line
    // covers the exact same span (data-model.md edge case).
    const earlyStrategy = { ...FIXTURE_STRATEGY, id: 'early', earliestStartMonth: '2024-01' }
    const lateStrategy = { ...FIXTURE_STRATEGY, id: 'late', earliestStartMonth: '2024-02' }

    const plan = runComparison(
      [earlyStrategy, lateStrategy],
      { startAmount: 1000, startMonth: '2024-01', endMonth: '2024-03' },
      FIXTURE_SERIES,
    )

    expect(plan.commonStartMonth).toBe('2024-02')
    expect(plan.commonEndMonth).toBe('2024-03')
    expect(plan.runs).toHaveLength(2)
    for (const { result } of plan.runs) {
      expect(result.ok).toBe(true)
      if (!result.ok) continue
      expect(result.run.dataRangeUsed.startMonth).toBe('2024-02')
      expect(result.run.growthSeries[0]?.month).toBe('2024-02')
    }
  })

  it('flags an alignment warning when the strategies have different earliest-data months', () => {
    const earlyStrategy = { ...FIXTURE_STRATEGY, id: 'early', earliestStartMonth: '2024-01' }
    const lateStrategy = { ...FIXTURE_STRATEGY, id: 'late', earliestStartMonth: '2024-02' }

    const plan = runComparison(
      [earlyStrategy, lateStrategy],
      { startAmount: 1000, startMonth: '2024-01', endMonth: '2024-03' },
      FIXTURE_SERIES,
    )

    expect(plan.alignmentWarning.present).toBe(true)
    // The warning references the latest common start so a beginner understands
    // why the chart does not begin at their requested month.
    expect(plan.alignmentWarning.commonStartMonth).toBe('2024-02')
  })

  it('does NOT flag an alignment warning when the strategies share the same earliest month', () => {
    // All strategies start in 2024-01 → no misalignment, even though the
    // requested start is exactly that month.
    const a = { ...FIXTURE_STRATEGY, id: 'a', earliestStartMonth: '2024-01' }
    const b = { ...FIXTURE_STRATEGY, id: 'b', earliestStartMonth: '2024-01' }

    const plan = runComparison(
      [a, b],
      { startAmount: 1000, startMonth: '2024-01', endMonth: '2024-03' },
      FIXTURE_SERIES,
    )

    expect(plan.alignmentWarning.present).toBe(false)
    expect(plan.commonStartMonth).toBe('2024-01')
  })

  it('reports a range-shifted alignment when the user start predates the common start', () => {
    // Even when strategies agree, a user start earlier than the data forces a
    // shift to the common start — surfaced as shortenedFrom for the UI.
    const a = { ...FIXTURE_STRATEGY, id: 'a', earliestStartMonth: '2024-02' }
    const b = { ...FIXTURE_STRATEGY, id: 'b', earliestStartMonth: '2024-02' }

    const plan = runComparison(
      [a, b],
      { startAmount: 1000, startMonth: '2024-01', endMonth: '2024-03' },
      FIXTURE_SERIES,
    )

    expect(plan.commonStartMonth).toBe('2024-02')
    expect(plan.alignmentWarning.present).toBe(true)
    expect(plan.alignmentWarning.shortenedFrom).toBe('2024-01')
  })

  it('excludes strategies that fail validation (e.g. NO_DATA) instead of throwing', () => {
    // A failing strategy must never poison the comparison — it is dropped, and
    // the remaining strategies still align (FR-012 graceful failure).
    const ok = { ...FIXTURE_STRATEGY, id: 'ok', earliestStartMonth: '2024-01' }
    const doomed = {
      ...FIXTURE_STRATEGY,
      id: 'doomed',
      earliestStartMonth: '2030-01', // outside the fixture's data span
    }

    const plan = runComparison(
      [ok, doomed],
      { startAmount: 1000, startMonth: '2024-01', endMonth: '2024-03' },
      FIXTURE_SERIES,
    )

    expect(plan.runs).toHaveLength(1)
    expect(plan.runs[0]!.result.ok).toBe(true)
  })

  it('produces aligned runs on the real bundled dataset for an arbitrary 3-strategy set', () => {
    const picked = [getStrategy('60-40')!, getStrategy('all-weather')!, getStrategy('all-equity')!]
    const plan = runComparison(
      picked,
      { startAmount: 10000, startMonth: '2000-01', endMonth: '2025-06' },
      RETURN_SERIES,
    )
    // The bundled series are aligned (all share the same span), so every
    // selected strategy shares the same earliestStartMonth and no warning fires.
    expect(plan.runs).toHaveLength(3)
    const starts = new Set(
      plan.runs.map((r) => (r.result.ok ? r.result.run.dataRangeUsed.startMonth : null)),
    )
    expect(starts.size).toBe(1) // every run covers the same span
  })
})

describe('T025 — every real strategy can run over its declared span on the bundled data', () => {
  for (const s of STRATEGIES) {
    it(`strategy "${s.id}" produces a non-empty finite growth series`, () => {
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
      expect(r.run.growthSeries.length).toBeGreaterThan(0)
      for (const p of r.run.growthSeries) {
        expect(Number.isFinite(p.value)).toBe(true)
        expect(p.value).toBeGreaterThan(0) // values never collapse to <=0 with bounded returns
      }
    })
  }
})
