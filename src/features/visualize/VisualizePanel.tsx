import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GlossaryTerm } from '@/components/GlossaryTerm'
import { GrowthChart } from '@/components/charts/GrowthChart'
import { DrawdownChart } from '@/components/charts/DrawdownChart'
import { MetricsPanel } from '@/components/MetricsPanel'
import { DisclaimerCollapsible } from '@/components/Disclaimer'
import { EmptyState, ErrorState } from '@/components/states'
import { RunControls } from './RunControls'
import { STRATEGIES, getStrategy } from '@/data/strategies'
import { formatMonth } from '@/lib/format'
import type { BacktestResult } from '@/lib/backtest'
import type { Strategy } from '@/types'

/**
 * VisualizePanel (T038) — User Story 2.
 *
 * A user picks a strategy, enters a starting amount and historical period, and
 * sees a growth-over-time chart (with the scary dips shown honestly) plus the
 * four headline numbers — total growth, annualized return, volatility, and
 * worst drawdown — each with a plain-language label (SC-002, FR-005, FR-007).
 *
 * The panel is a pure function of the props handed up by `useBacktest`:
 *  - if no strategy is selected, a friendly prompt + strategy picker
 *  - if the run is blocked (bad amount / range / no data), a friendly error
 *    message naming the problem and how to fix it (never a raw crash, FR-012)
 *  - if the run succeeded, the growth chart, drawdown chart, four metric
 *    cards, methodology disclosure, and any range-adjustment warning
 *
 * Every chart is paired with a visually-hidden sr-only data table for screen
 * readers (FR-010) — implemented inside each chart wrapper component.
 */

interface VisualizePanelProps {
  strategyId: string | null
  amount: number
  startMonth: string
  endMonth: string
  minMonth: string
  maxMonth: string
  result: BacktestResult | null
  onCommit: (next: { amount: number; startMonth: string; endMonth: string }) => void
  onReset: () => void
  onSelectStrategy: (id: string) => void
}

export function VisualizePanel({
  strategyId,
  amount,
  startMonth,
  endMonth,
  minMonth,
  maxMonth,
  result,
  onCommit,
  onReset,
  onSelectStrategy,
}: VisualizePanelProps) {
  const strategy = strategyId ? getStrategy(strategyId) : undefined

  if (!strategy) {
    return <StrategyPicker onSelectStrategy={onSelectStrategy} />
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">See how it performed</h2>
        <p className="text-sm text-muted-foreground">
          Pick a strategy, an amount, and a historical period. The growth chart and the four
          headline numbers update within a second — including the real dips.
        </p>
      </header>

      <StrategySummaryCard strategy={strategy} />

      <RunControls
        initialAmount={amount}
        initialStartMonth={startMonth}
        initialEndMonth={endMonth}
        minMonth={minMonth}
        maxMonth={maxMonth}
        onRun={onCommit}
        onReset={onReset}
      />

      <RunResult result={result} />
    </div>
  )
}

/** Friendly "no strategy selected" panel with a clickable picker. */
function StrategyPicker({
  onSelectStrategy,
}: {
  onSelectStrategy: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <EmptyState
        title="Pick a strategy to visualize"
        description="Select a strategy below to run a real backtest over historical data — the dips are shown honestly."
      />
      <ul className="grid list-none grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {STRATEGIES.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelectStrategy(s.id)}
              className="w-full rounded-md border bg-card p-4 text-left transition-colors hover:bg-accent"
            >
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.shortDescription}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The selected strategy's name + risk tier + allocation, for context. */
function StrategySummaryCard({ strategy }: { strategy: Strategy }) {
  return (
    <Card>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">{strategy.name}</CardTitle>
          <Badge variant="secondary" className="capitalize">
            <GlossaryTerm term="risk tier">{strategy.riskTier}</GlossaryTerm>
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{strategy.shortDescription}</p>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Allocation:</span>{' '}
        {strategy.allocations
          .map((a) => `${Math.round(a.weight * 100)}% ${a.assetId}`)
          .join(' · ')}
      </CardContent>
    </Card>
  )
}

/** The chart + metrics + warnings, depending on the run's outcome. */
function RunResult({ result }: { result: BacktestResult | null }) {
  if (!result) {
    return (
      <EmptyState
        title="Run a backtest"
        description="Enter an amount and a period above, then click Run backtest to see the results."
      />
    )
  }

  if (!result.ok) {
    return (
      <ErrorState
        title={errorTitle(result.error.code)}
        description={result.error.message}
      />
    )
  }

  const { run } = result
  const shortened = run.warnings.some((w) => w.code === 'shortened-to-data')
  const includesKnownCrash = includesHistoricalCrash(run.dataRangeUsed.startMonth, run.dataRangeUsed.endMonth)

  return (
    <div className="space-y-6" data-testid="run-result">
      {shortened && (
        <div
          className="rounded-md border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400"
          role="status"
        >
          <strong className="font-medium">Adjusted range:</strong> The chosen start month predates
          this strategy&apos;s data, so the run was shortened to{' '}
          {formatMonth(run.dataRangeUsed.startMonth)} onward.
        </div>
      )}

      {includesKnownCrash && (
        <div
          className="rounded-md border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground"
          role="note"
        >
          The chosen period includes a known market crash (2008 financial crisis or the 2020
          COVID-19 drop). The dips you see are real — drawn from the actual monthly returns for
          those months, never smoothed. A <GlossaryTerm term="drawdown">drawdown</GlossaryTerm> is
          measured peak-to-trough, not as a total loss: a{' '}
          {run.metrics.find((m) => m.key === 'max-drawdown')?.displayValue} worst drop means the
          portfolio fell that far from a previous high before any recovery. These are historical
          figures, not a prediction (FR-007).
        </div>
      )}

      <MetricsPanel metrics={run.metrics} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Growth over time</CardTitle>
          <p className="text-xs text-muted-foreground">
            Month-end portfolio value for ${run.startAmount.toLocaleString()} invested in{' '}
            {formatMonth(run.dataRangeUsed.startMonth)}, held through{' '}
            {formatMonth(run.dataRangeUsed.endMonth)}. The area fill highlights where the money
            went; dips are shown honestly.
          </p>
        </CardHeader>
        <CardContent>
          <GrowthChart
            growthSeries={run.growthSeries}
            startAmount={run.startAmount}
            data-testid="growth-chart"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Drawdown over time</CardTitle>
          <p className="text-xs text-muted-foreground">
            How far the portfolio was below its previous peak at each month. The deepest trough is
            the worst drawdown above. Zero means the portfolio was at a fresh high.
          </p>
        </CardHeader>
        <CardContent>
          <DrawdownChart growthSeries={run.growthSeries} data-testid="drawdown-chart" />
        </CardContent>
      </Card>

      <DisclaimerCollapsible />
    </div>
  )
}

function errorTitle(code: 'INVALID_AMOUNT' | 'INVALID_RANGE' | 'NO_DATA'): string {
  switch (code) {
    case 'INVALID_AMOUNT':
      return 'Enter a valid starting amount'
    case 'INVALID_RANGE':
      return 'Fix the date range'
    case 'NO_DATA':
      return 'No data for that period'
  }
}

/** True when the run's span touches a known historical crash window. */
function includesHistoricalCrash(startMonth: string, endMonth: string): boolean {
  const GFC = ['2008-09', '2009-03'] // Global Financial Crisis trough window
  const COVID = ['2020-02', '2020-04'] // COVID-19 drop
  return (
    spansOverlap(startMonth, endMonth, GFC[0]!, GFC[1]!) ||
    spansOverlap(startMonth, endMonth, COVID[0]!, COVID[1]!)
  )
}

function spansOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd
}
