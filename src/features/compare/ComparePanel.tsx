import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ComparisonChart, type ComparisonSeries } from '@/components/charts/ComparisonChart'
import { ComparisonTable } from '@/components/ComparisonTable'
import { DisclaimerCollapsible } from '@/components/Disclaimer'
import { EmptyState } from '@/components/states'
import { RunControls } from '@/features/visualize/RunControls'
import { StrategyMultiSelect, MIN_COMPARE } from './StrategyMultiSelect'
import { runComparison } from '@/lib/backtest'
import { RETURN_SERIES } from '@/data/returns'
import { getStrategy } from '@/data/strategies'
import { formatMonth } from '@/lib/format'

/**
 * ComparePanel (T046) — User Story 3.
 *
 * A user selects 2–3 strategies over the same amount and period and sees them
 * overlaid on one chart with an aligned metrics table, so the
 * growth-versus-calmness trade-off is obvious (SC-003, SC-005).
 *
 * The panel is a pure function of the props handed up by `useCompare`:
 *  - if fewer than 2 strategies are selected, a friendly prompt (never blank)
 *  - otherwise, the multi-select + shared RunControls + the overlaid chart +
 *    the aligned metrics table + the methodology disclosure + any alignment
 *    warning produced when the chosen span cannot be honored exactly
 *
 * Alignment is the whole point of the comparison (data-model.md edge case):
 * `runComparison` shifts every line forward to the latest common start month
 * and the panel says so plainly so a beginner understands why the chart
 * begins where it does (FR-011).
 */

interface ComparePanelProps {
  /** Currently-selected strategy ids (driven by the `cmp=` URL param). */
  selectedStrategyIds: string[]
  /** Currently-applied starting amount (USD). */
  amount: number
  /** Currently-applied start month 'YYYY-MM'. */
  startMonth: string
  /** Currently-applied end month 'YYYY-MM'. */
  endMonth: string
  /** Bundled-data span — passed to RunControls so the month pickers clamp. */
  minMonth: string
  maxMonth: string
  /** Called when the user adds/removes a strategy in the multi-select. */
  onChangeStrategies: (next: string[]) => void
  /** Commit new run values (amount / range) to URL + trigger a fresh compute. */
  onCommit: (next: { amount: number; startMonth: string; endMonth: string }) => void
  /** Reset to the defaults. */
  onReset: () => void
}

export function ComparePanel({
  selectedStrategyIds,
  amount,
  startMonth,
  endMonth,
  minMonth,
  maxMonth,
  onChangeStrategies,
  onCommit,
  onReset,
}: ComparePanelProps) {
  // Resolve ids → strategies. Unknown ids are silently dropped (a stale
  // `cmp=` link never breaks the panel — FR-012 graceful fallback).
  const strategies = useMemo(
    () =>
      selectedStrategyIds
        .map((id) => getStrategy(id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [selectedStrategyIds],
  )

  // Compute the aligned comparison plan whenever the inputs change. Pure +
  // deterministic — identical inputs produce byte-identical outputs.
  const plan = useMemo(
    () =>
      runComparison(
        strategies,
        { startAmount: amount, startMonth, endMonth },
        RETURN_SERIES,
      ),
    [strategies, amount, startMonth, endMonth],
  )

  // Build the chart + table inputs from the successful aligned runs. We look
  // up the strategy by id so the chart line order matches the selection
  // order (preserving visual stability as the user toggles chips).
  const chartSeries: ComparisonSeries[] = plan.runs
    .map((r) => {
      const s = getStrategy(r.strategyId)
      if (!s || !r.result.ok) return null
      return { strategyId: s.id, strategyName: s.name, run: r.result.run }
    })
    .filter((x): x is ComparisonSeries => x !== null)

  const tableStrategies = chartSeries.map((s) => ({
    strategyId: s.strategyId,
    strategyName: s.strategyName,
    run: s.run,
  }))

  const tooFewSelected = strategies.length < MIN_COMPARE

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Compare side by side</h2>
        <p className="text-sm text-muted-foreground">
          Pick two or three strategies, an amount, and a period. Every line is aligned on the same
          start month so you can read the growth-versus-calmness trade-off at a glance — dips
          included honestly.
        </p>
      </header>

      <StrategyMultiSelect selected={selectedStrategyIds} onChange={onChangeStrategies} />

      {tooFewSelected ? (
        <EmptyState
          title="Pick at least two strategies"
          description="The comparison needs two or three strategies overlaid on the same chart. Use the picker above to add them."
        />
      ) : (
        <>
          <RunControls
            initialAmount={amount}
            initialStartMonth={startMonth}
            initialEndMonth={endMonth}
            minMonth={minMonth}
            maxMonth={maxMonth}
            onRun={onCommit}
            onReset={onReset}
          />

          {plan.alignmentWarning.present && (
            <AlignmentNotice
              commonStartMonth={plan.commonStartMonth}
              shortenedFrom={plan.alignmentWarning.shortenedFrom}
              strategiesDiffer={plan.alignmentWarning.strategiesDiffer ?? false}
            />
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Growth over time — overlaid</CardTitle>
              <p className="text-xs text-muted-foreground">
                Month-end portfolio value for ${amount.toLocaleString()} invested in each strategy,
                held through {formatMonth(plan.commonEndMonth)}. Every line starts at the same
                month so the comparison is fair.
              </p>
            </CardHeader>
            <CardContent>
              <ComparisonChart series={chartSeries} startAmount={amount} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Aligned metrics</CardTitle>
              <p className="text-xs text-muted-foreground">
                The same four headline numbers for each strategy, computed identically across every
                column so a number means the same thing wherever it appears.
              </p>
            </CardHeader>
            <CardContent>
              <ComparisonTable strategies={tableStrategies} />
            </CardContent>
          </Card>

          <DisclaimerCollapsible />
        </>
      )}
    </div>
  )
}

/**
 * The plain-language alignment notice (T042 / FR-011 / data-model.md edge case).
 *
 * Two distinct causes (often both at once):
 *   - the selected strategies disagree on their earliest-data month, OR
 *   - the user's requested start predates the latest common start month.
 *
 * Either way the chart still covers the same span for every line — we just
 * say so plainly so a beginner can read why the chart begins where it does.
 */
function AlignmentNotice({
  commonStartMonth,
  shortenedFrom,
  strategiesDiffer,
}: {
  commonStartMonth: string
  shortenedFrom?: string
  strategiesDiffer: boolean
}) {
  const reason = strategiesDiffer
    ? 'The selected strategies start their data in different months, '
    : 'The chosen start month predates the available data, '
  const action = shortenedFrom
    ? `so every line was shifted forward from ${formatMonth(shortenedFrom)} to ${formatMonth(
        commonStartMonth,
      )}.`
    : `so every line starts at ${formatMonth(commonStartMonth)}.`

  return (
    <div
      role="status"
      aria-label="Alignment notice"
      className="rounded-md border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400"
      data-testid="alignment-notice"
    >
      <strong className="font-medium">Aligned to a common start:</strong> {reason}
      {action} The comparison is still fair — every line covers the exact same span, dips and all.
    </div>
  )
}
