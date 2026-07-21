import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VisualizePanel } from '@/features/visualize/VisualizePanel'
import { runBacktest } from '@/lib/backtest'
import { RETURN_SERIES } from '@/data/returns'
import { getStrategy } from '@/data/strategies'
import type { BacktestResult } from '@/lib/backtest'

/**
 * T029 — A run renders the growth chart and the four labeled metrics.
 *
 * T030 — Every chart is paired with a visually-hidden (sr-only) data table
 * for screen readers (FR-010). This is the canvas-chart a11y pattern from
 * research.md §R-5: the canvas is an opaque bitmap, so we mirror the charted
 * values in a parallel `<table class="sr-only">` so assistive tech reads the
 * same story a sighted user sees.
 *
 * The component tests use a real successful `runBacktest` result over the
 * bundled dataset so they exercise the whole pipeline (engine → metrics →
 * formatting → presentation) end-to-end, not just mocked props.
 */

function makeSuccessfulResult(): BacktestResult {
  const s = getStrategy('60-40')!
  return runBacktest(
    {
      strategyId: s.id,
      startAmount: 10000,
      startMonth: s.earliestStartMonth,
      endMonth: '2025-06',
    },
    RETURN_SERIES,
    s,
  )
}

function renderPanel({
  strategyId = '60-40',
  result = makeSuccessfulResult(),
}: { strategyId?: string | null; result?: BacktestResult | null } = {}) {
  const handlers = {
    onCommit: vi.fn(),
    onReset: vi.fn(),
    onSelectStrategy: vi.fn(),
  }
  const utils = render(
    <VisualizePanel
      strategyId={strategyId}
      amount={10000}
      startMonth="2000-01"
      endMonth="2025-06"
      minMonth="1990-07"
      maxMonth="2025-06"
      result={result}
      onCommit={handlers.onCommit}
      onReset={handlers.onReset}
      onSelectStrategy={handlers.onSelectStrategy}
    />,
  )
  return { ...utils, handlers }
}

describe('T029 — A successful run renders the growth chart + four labeled metrics', () => {
  it('renders exactly four metric cards, each with a label and a displayValue', () => {
    renderPanel()

    // The four metric keys are present as testids.
    const expectedKeys = ['total-growth', 'annualized-return', 'volatility', 'max-drawdown'] as const
    for (const key of expectedKeys) {
      const node = screen.getByTestId(`metric-${key}`)
      expect(node).toBeInTheDocument()
      expect(node.textContent).toMatch(/[+%]/) // has a formatted value
    }

    // Each metric has its plain-language label (the metric.label text).
    expect(screen.getByText('Total Growth')).toBeInTheDocument()
    expect(screen.getByText('Annualized Return')).toBeInTheDocument()
    expect(screen.getByText('Volatility')).toBeInTheDocument()
    expect(screen.getByText('Worst Drawdown')).toBeInTheDocument()
  })

  it('the worst-drawdown display value is non-positive (a drop or zero, never positive)', () => {
    renderPanel()
    const dd = screen.getByTestId('metric-max-drawdown')
    // The displayed value is a formatted percent; parse the sign.
    expect(dd.textContent).toMatch(/^-/) // begins with "-"
    expect(dd.textContent).not.toMatch(/^\+/)
  })

  it('renders the growth chart container', () => {
    renderPanel()
    // The growth chart card is present.
    expect(screen.getByText(/growth over time/i)).toBeInTheDocument()
    // The role="img" aria label pins the chart as an accessible image.
    expect(screen.getByRole('img', { name: /growth chart/i })).toBeInTheDocument()
  })

  it('renders the drawdown chart container', () => {
    renderPanel()
    expect(screen.getByText(/drawdown over time/i)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /drawdown chart/i })).toBeInTheDocument()
  })

  it('shows the methodology disclosure (DisclaimerCollapsible) reachable from the run output', () => {
    renderPanel()
    // The collapsible trigger button is rendered inside the run result block.
    expect(
      screen.getByRole('button', { name: /how these numbers are computed/i }),
    ).toBeInTheDocument()
  })
})

describe('T029 — Blocked run shows a friendly error (never a crash)', () => {
  it('renders the INVALID_AMOUNT error when the run was blocked for amount', () => {
    const s = getStrategy('60-40')!
    const blocked = runBacktest(
      { strategyId: s.id, startAmount: 0, startMonth: '2000-01', endMonth: '2025-06' },
      RETURN_SERIES,
      s,
    )
    renderPanel({ result: blocked })
    expect(screen.getByText(/enter a valid starting amount/i)).toBeInTheDocument()
    expect(screen.getByText(/greater than zero/i)).toBeInTheDocument()
  })

  it('renders the NO_DATA error when the run was blocked for range', () => {
    const s = getStrategy('60-40')!
    const blocked = runBacktest(
      { strategyId: s.id, startAmount: 10000, startMonth: '2030-01', endMonth: '2030-06' },
      RETURN_SERIES,
      s,
    )
    renderPanel({ result: blocked })
    expect(screen.getByText(/no data for that period/i)).toBeInTheDocument()
  })
})

describe('T029 — No strategy selected shows a strategy picker prompt', () => {
  it('renders the picker with all 6 strategies as buttons', () => {
    renderPanel({ strategyId: null, result: null })
    expect(screen.getByText(/pick a strategy to visualize/i)).toBeInTheDocument()
    // The picker uses <button> elements.
    const buttons = screen.getAllByRole('button')
    // 6 strategy buttons + no run controls yet
    expect(buttons.length).toBeGreaterThanOrEqual(6)
  })

  it('clicking a strategy in the picker calls onSelectStrategy', async () => {
    const { handlers } = renderPanel({ strategyId: null, result: null })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /60\/40 Balanced/i }))
    expect(handlers.onSelectStrategy).toHaveBeenCalledWith('60-40')
  })
})

describe('T030 — Every chart is paired with a visually-hidden data table (FR-010)', () => {
  it('the growth chart has a paired sr-only summary table', () => {
    renderPanel()
    const growthCaption = screen.queryByText('Growth chart data summary')
    expect(growthCaption).not.toBeNull()
    // The table caption is inside an sr-only <table>
    const table = growthCaption!.closest('table')
    expect(table).not.toBeNull()
    expect(table!.className).toMatch(/sr-only/)
    // The table has rows for starting, peak, trough, ending, total growth
    expect(table!.querySelectorAll('tbody tr').length).toBeGreaterThanOrEqual(4)
  })

  it('the drawdown chart has a paired sr-only summary table', () => {
    renderPanel()
    const ddCaption = screen.queryByText('Drawdown chart data summary')
    expect(ddCaption).not.toBeNull()
    const table = ddCaption!.closest('table')
    expect(table).not.toBeNull()
    expect(table!.className).toMatch(/sr-only/)
  })

  it('each sr-only table is not visible to sighted users (has the sr-only class)', () => {
    renderPanel()
    const tables = document.querySelectorAll('table.sr-only')
    // At least 2: one per chart. (MetricsPanel adds an sr-only <ol>, not a table.)
    expect(tables.length).toBeGreaterThanOrEqual(2)
    for (const t of tables) {
      expect(t.className).toMatch(/sr-only/)
    }
  })

  it('each chart container exposes an accessible name via role="img" + aria-label', () => {
    renderPanel()
    const imgs = screen.getAllByRole('img')
    const labels = imgs.map((el) => el.getAttribute('aria-label') ?? '')
    expect(labels.some((l) => /growth chart/i.test(l))).toBe(true)
    expect(labels.some((l) => /drawdown chart/i.test(l))).toBe(true)
  })
})

describe('T029 — Contextual crash labeling is shown when the period touches 2008 or 2020', () => {
  it('a period including 2008 shows the crash-context note', () => {
    const s = getStrategy('60-40')!
    const result = runBacktest(
      { strategyId: s.id, startAmount: 10000, startMonth: '2007-01', endMonth: '2010-12' },
      RETURN_SERIES,
      s,
    )
    renderPanel({ result })
    expect(screen.getByText(/known market crash/i)).toBeInTheDocument()
  })

  it('a period including 2020 shows the crash-context note', () => {
    const s = getStrategy('60-40')!
    const result = runBacktest(
      { strategyId: s.id, startAmount: 10000, startMonth: '2019-06', endMonth: '2020-12' },
      RETURN_SERIES,
      s,
    )
    renderPanel({ result })
    expect(screen.getByText(/known market crash/i)).toBeInTheDocument()
  })

  it('a period before the crashes does NOT show the crash-context note', () => {
    const s = getStrategy('60-40')!
    const result = runBacktest(
      { strategyId: s.id, startAmount: 10000, startMonth: '1995-01', endMonth: '1999-12' },
      RETURN_SERIES,
      s,
    )
    renderPanel({ result })
    expect(screen.queryByText(/known market crash/i)).not.toBeInTheDocument()
  })
})
