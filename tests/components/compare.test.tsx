import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComparePanel } from '@/features/compare/ComparePanel'
import { STRATEGIES, getStrategy } from '@/data/strategies'
import { DATA_START_MONTH, DATA_END_MONTH } from '@/data/returns'

/**
 * T041 — ComparePanel renders one line per selected strategy on an overlaid
 * chart plus an aligned metrics table (US3 / SC-003, SC-005).
 *
 * T042 — A plain-language alignment warning is shown when the chosen span
 * cannot be honored exactly (strategies differ in their earliest-data month,
 * or the user's requested start predates the latest common start).
 *
 * The canvas chart cannot be inspected pixel-by-pixel in jsdom, so we assert
 * on the chart's companion surfaces: the visible color legend (one chip per
 * line), the sr-only summary table (one row per line), and the aligned
 * metrics table (one column per strategy). These together prove the panel
 * feeds the chart one LineSeries per selected strategy.
 */

const TWO = ['60-40', 'all-equity']
const THREE = ['60-40', 'all-weather', 'all-equity']

function renderPanel({
  selectedStrategyIds = TWO,
  amount = 10000,
  startMonth = '2000-01',
  endMonth = DATA_END_MONTH,
  onChangeStrategies = vi.fn(),
  onCommit = vi.fn(),
  onReset = vi.fn(),
}: {
  selectedStrategyIds?: string[]
  amount?: number
  startMonth?: string
  endMonth?: string
  onChangeStrategies?: ReturnType<typeof vi.fn>
  onCommit?: ReturnType<typeof vi.fn>
  onReset?: ReturnType<typeof vi.fn>
} = {}) {
  const handlers = { onChangeStrategies, onCommit, onReset }
  render(
    <ComparePanel
      selectedStrategyIds={selectedStrategyIds}
      amount={amount}
      startMonth={startMonth}
      endMonth={endMonth}
      minMonth={DATA_START_MONTH}
      maxMonth={DATA_END_MONTH}
      onChangeStrategies={handlers.onChangeStrategies}
      onCommit={handlers.onCommit}
      onReset={handlers.onReset}
    />,
  )
  return { handlers }
}

describe('T041 — ComparePanel renders one line per strategy + aligned metrics table', () => {
  it('renders one legend chip and one sr-only summary row per selected strategy', () => {
    renderPanel({ selectedStrategyIds: TWO })

    // The visible color legend lists every selected strategy by name —
    // this is how a sighted user tells the overlaid lines apart (FR-010).
    const legend = screen.getByTestId('comparison-legend')
    for (const id of TWO) {
      const s = getStrategy(id)!
      expect(legend).toHaveTextContent(s.name)
    }

    // The sr-only summary table has one <tr> per selected strategy inside
    // <tbody> — this is how a screen reader reads the same chart.
    const caption = screen.getByText('Comparison chart data summary')
    const table = caption.closest('table')!
    const rows = table.querySelectorAll('tbody tr')
    expect(rows.length).toBe(TWO.length)
  })

  it('renders the aligned metrics table with one column per strategy and all four metric rows', () => {
    renderPanel({ selectedStrategyIds: THREE })

    const table = screen.getByTestId('comparison-table')
    // Header row has one <th> per selected strategy (after the Metric label column).
    const headerCells = table.querySelectorAll('thead tr th')
    // 1 label column + 3 strategy columns = 4 header cells
    expect(headerCells.length).toBe(1 + THREE.length)
    for (const id of THREE) {
      const s = getStrategy(id)!
      expect(screen.getByRole('columnheader', { name: s.name })).toBeInTheDocument()
    }

    // All four metric rows are present (Total Growth, Annualized Return,
    // Volatility, Worst Drawdown — FR-005).
    expect(screen.getByText('Total Growth')).toBeInTheDocument()
    expect(screen.getByText('Annualized Return')).toBeInTheDocument()
    expect(screen.getByText('Volatility')).toBeInTheDocument()
    expect(screen.getByText('Worst Drawdown')).toBeInTheDocument()
  })

  it('renders the comparison chart accessible name + sr-only caption', () => {
    renderPanel({ selectedStrategyIds: TWO })
    // role="img" with an aria-label mentioning "Comparison chart"
    expect(screen.getByRole('img', { name: /comparison chart/i })).toBeInTheDocument()
    expect(screen.getByText('Comparison chart data summary')).toBeInTheDocument()
  })

  it('shows the methodology disclosure (DisclaimerCollapsible) reachable from the comparison', () => {
    renderPanel({ selectedStrategyIds: TWO })
    expect(
      screen.getByRole('button', { name: /how these numbers are computed/i }),
    ).toBeInTheDocument()
  })

  it('shows a friendly prompt (not a crash) when fewer than 2 strategies are selected', () => {
    renderPanel({ selectedStrategyIds: ['60-40'] })
    // A friendly prompt — never a blank screen or a half-rendered chart.
    expect(screen.getByText(/pick at least two strategies/i)).toBeInTheDocument()
  })

  it('calls onChangeStrategies when a strategy toggle is clicked', async () => {
    const onChangeStrategies = vi.fn()
    const user = userEvent.setup()
    renderPanel({ selectedStrategyIds: [], onChangeStrategies })
    const conservative = STRATEGIES.find((s) => s.id === 'conservative-income')!
    await user.click(screen.getByRole('button', { name: new RegExp(conservative.name) }))
    expect(onChangeStrategies).toHaveBeenCalledWith(['conservative-income'])
  })
})

describe('T042 — A plain-language alignment warning is shown when the span cannot be honored', () => {
  it('shows the alignment notice when the user start predates the latest common start', () => {
    // The bundled data starts well before 2000-01, so a normal pick does not
    // trigger a warning. We force one by requesting a start month earlier
    // than the bundled data span — the comparison must shift forward to the
    // data start and say so plainly.
    renderPanel({
      selectedStrategyIds: TWO,
      startMonth: '1980-01', // before DATA_START_MONTH
    })

    // A visible, friendly notice explaining the shift — never a silent fix.
    const notice = screen.getByRole('status', { name: /alignment notice/i })
    expect(notice.textContent).toMatch(/align/i)
    // The notice references the aligned start month so a beginner can read it.
    expect(notice.textContent).toMatch(/1990/) // DATA_START_MONTH is 1990-07
  })

  it('does NOT show the alignment notice when the requested span matches the data span', () => {
    renderPanel({
      selectedStrategyIds: TWO,
      startMonth: '2000-01', // a normal, in-range start
    })
    expect(screen.queryByRole('status', { name: /alignment notice/i })).not.toBeInTheDocument()
  })
})
