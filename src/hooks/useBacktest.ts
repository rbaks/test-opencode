import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { runBacktest, type BacktestResult } from '@/lib/backtest'
import { RETURN_SERIES, DATA_START_MONTH, DATA_END_MONTH } from '@/data/returns'
import { getStrategy } from '@/data/strategies'
import { useSelectedStrategy } from './useUrlState'

/**
 * useBacktest (T039) — wires the VisualizePanel to the URL + the backtest engine.
 *
 * Reads four URL params: `s=` (selected strategy), `a=` (starting amount),
 * `from=` (start month), `to=` (end month). Whenever any of them changes, the
 * pure `runBacktest` engine runs against the bundled dataset and the result
 * drives the panel. Commits write the new values back to the URL with
 * `pushState` so the browser Back button restores the previous run
 * (contracts/shareable-link.md history behavior).
 *
 * The hook is total — it never throws. Bad or missing values fall back to
 * friendly defaults so the panel can always render either a real chart or a
 * friendly "blocked run" message (FR-012).
 */

const MONTH_RE = /^\d{4}-\d{2}$/

const DEFAULT_AMOUNT = 10000
const DEFAULT_START_MONTH = '2000-01'
const DEFAULT_END_MONTH = DATA_END_MONTH

/** Read a positive-integer URL param, falling back to `fallback` when invalid. */
function readAmountParam(value: string | null): number {
  if (!value) return DEFAULT_AMOUNT
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_AMOUNT
  return Math.floor(n)
}

/** Read a 'YYYY-MM' URL param, falling back to `fallback` when malformed. */
function readMonthParam(value: string | null, fallback: string): string {
  if (!value || !MONTH_RE.test(value)) return fallback
  return value
}

/** Clamp a month into the bundled data range [DATA_START_MONTH..DATA_END_MONTH]. */
function clampMonth(month: string): string {
  if (month < DATA_START_MONTH) return DATA_START_MONTH
  if (month > DATA_END_MONTH) return DATA_END_MONTH
  return month
}

export interface UseBacktestResult {
  /** The currently-selected strategy, or null when none is selected. */
  strategyId: string | null
  /** The currently-applied starting amount (USD). */
  amount: number
  /** The currently-applied start month 'YYYY-MM'. */
  startMonth: string
  /** The currently-applied end month 'YYYY-MM'. */
  endMonth: string
  /** The bundled-data span — passed to RunControls so the month pickers clamp. */
  minMonth: string
  maxMonth: string
  /** The latest backtest result. `null` while no strategy is selected. */
  result: BacktestResult | null
  /** Commit new run values to URL + trigger a fresh compute. */
  commit: (next: { amount: number; startMonth: string; endMonth: string }) => void
  /** Reset to the defaults. */
  reset: () => void
  /** Mirror of setSelectedStrategy so the panel can render a strategy picker inline. */
  setSelectedStrategy: (id: string) => void
}

export function useBacktest(): UseBacktestResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const { selectedStrategyId, setSelectedStrategy } = useSelectedStrategy()

  const amount = readAmountParam(searchParams.get('a'))
  // Default start = 2000-01 (a clean, recognizable pre-crash start that the
  // bundled data fully covers), or the strategy's earliest start month —
  // whichever is later. We compute the effective start lazily from the
  // selected strategy so the run always has data.
  const rawStart = readMonthParam(searchParams.get('from'), DEFAULT_START_MONTH)
  const rawEnd = readMonthParam(searchParams.get('to'), DEFAULT_END_MONTH)

  const strategy = selectedStrategyId ? getStrategy(selectedStrategyId) : undefined
  const strategyStartFloor = strategy?.earliestStartMonth ?? DATA_START_MONTH
  const startMonth = clampMonth(rawStart < strategyStartFloor ? strategyStartFloor : rawStart)
  const endMonth = clampMonth(rawEnd)

  // Recompute whenever any input changes. The engine is a pure function over
  // the bundled dataset, so this is deterministic and fast (< 1s for any
  // realistic span — SC-002).
  const result = useMemo<BacktestResult | null>(() => {
    if (!strategy) return null
    return runBacktest(
      {
        strategyId: strategy.id,
        startAmount: amount,
        startMonth,
        endMonth,
      },
      RETURN_SERIES,
      strategy,
    )
  }, [strategy, amount, startMonth, endMonth])

  const commit = useCallback(
    (next: { amount: number; startMonth: string; endMonth: string }) => {
      const params = new URLSearchParams(searchParams)
      params.set('a', String(next.amount))
      params.set('from', next.startMonth)
      params.set('to', next.endMonth)
      setSearchParams(params, { replace: false }) // pushState — Back button works
    },
    [searchParams, setSearchParams],
  )

  const reset = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    params.set('a', String(DEFAULT_AMOUNT))
    params.set('from', DEFAULT_START_MONTH)
    params.set('to', DEFAULT_END_MONTH)
    setSearchParams(params, { replace: false })
  }, [searchParams, setSearchParams])

  // When the URL has no strategy selected, default the visualize view to a
  // sensible first strategy so the panel is never blank.
  useEffect(() => {
    if (!selectedStrategyId) {
      // Intentionally do NOT auto-set here — the panel renders a friendly
      // "pick a strategy" prompt when none is selected. Auto-selecting would
      // surprise users who clicked Visualize from a fresh page.
    }
  }, [selectedStrategyId])

  return {
    strategyId: selectedStrategyId,
    amount,
    startMonth,
    endMonth,
    minMonth: DATA_START_MONTH,
    maxMonth: DATA_END_MONTH,
    result,
    commit,
    reset,
    setSelectedStrategy,
  }
}
