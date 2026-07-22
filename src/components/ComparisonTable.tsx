import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GlossaryTerm } from '@/components/GlossaryTerm'
import { cn } from '@/lib/utils'
import type { BacktestRun, Metric, MetricKey } from '@/types'

/**
 * ComparisonTable (T044) — the aligned metrics table for User Story 3.
 *
 * Rows are the four headline metrics (Total Growth, Annualized Return,
 * Volatility, Worst Drawdown — FR-005); columns are the selected strategies.
 * The same metric in the same row means the same thing across every column,
 * which is what makes the growth-versus-calmness trade-off legible at a glance
 * (SC-003, SC-005).
 *
 * The table reuses the exact `Metric` objects produced by `computeMetrics`
 * (already formatted as `displayValue`), so a number never appears bare —
 * every column header carries the strategy name and every row header is a
 * GlossaryTerm with a plain-language definition (FR-003).
 */

/** Fixed row order so the same metric always sits in the same row. */
const METRIC_ORDER: MetricKey[] = [
  'total-growth',
  'annualized-return',
  'volatility',
  'max-drawdown',
]

/** Maps a metric key to its glossary term (the row header is a GlossaryTerm). */
const METRIC_TERM: Record<MetricKey, string> = {
  'total-growth': 'total growth',
  'annualized-return': 'annualized return',
  volatility: 'volatility',
  'max-drawdown': 'max drawdown',
}

/** The friendly label shown for each metric row. */
const METRIC_LABEL: Record<MetricKey, string> = {
  'total-growth': 'Total Growth',
  'annualized-return': 'Annualized Return',
  volatility: 'Volatility',
  'max-drawdown': 'Worst Drawdown',
}

export interface ComparisonTableStrategy {
  strategyId: string
  strategyName: string
  run: BacktestRun
}

interface ComparisonTableProps {
  /** One column per strategy, in selection order (matches the chart's lines). */
  strategies: ComparisonTableStrategy[]
  /** Optional className for the outer container. */
  className?: string
}

/** Index a run's metrics by key for O(1) column lookup. */
function indexMetrics(run: BacktestRun): Partial<Record<MetricKey, Metric>> {
  const out: Partial<Record<MetricKey, Metric>> = {}
  for (const m of run.metrics) out[m.key] = m
  return out
}

export function ComparisonTable({ strategies, className }: ComparisonTableProps) {
  if (strategies.length === 0) return null

  const indexed = strategies.map((s) => ({
    ...s,
    metrics: indexMetrics(s.run),
  }))

  return (
    <section
      className={cn('space-y-2', className)}
      aria-label="Aligned metrics comparison"
      data-testid="comparison-table"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-[34%]">
              Metric
            </TableHead>
            {indexed.map((s) => (
              <TableHead key={s.strategyId} scope="col" className="text-left">
                {s.strategyName}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {METRIC_ORDER.map((key) => (
            <TableRow key={key}>
              <TableHead scope="row" className="font-medium text-foreground">
                <GlossaryTerm term={METRIC_TERM[key]}>{METRIC_LABEL[key]}</GlossaryTerm>
              </TableHead>
              {indexed.map((s) => {
                const metric = s.metrics[key]
                const display = metric?.displayValue ?? '—'
                const isNegative =
                  metric &&
                  (key === 'total-growth' ||
                    key === 'annualized-return' ||
                    key === 'max-drawdown') &&
                  metric.value < 0
                return (
                  <TableCell
                    key={s.strategyId}
                    className={isNegative ? 'text-destructive' : undefined}
                    data-testid={`cell-${key}-${s.strategyId}`}
                  >
                    {display}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
