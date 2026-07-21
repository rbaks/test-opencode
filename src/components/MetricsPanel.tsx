import type { Metric, MetricKey } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { GlossaryTerm } from '@/components/GlossaryTerm'
import { cn } from '@/lib/utils'

/**
 * MetricsPanel (T036) — the four headline numbers for a single backtest run.
 *
 * Every metric is shown as its own card: a plain-language label, the computed
 * value formatted for humans, and an on-demand definition (FR-005/FR-003). A
 * bare number is never shown without context — a beginner always sees what the
 * number means, either inline (the label) or on hover/focus (the definition).
 *
 * The labels and definitions live in the metric objects produced by
 * `computeMetrics` (src/lib/metrics.ts), so the panel is a pure presentation
 * component. It renders the same four cards in the same order for every run,
 * which is what makes a side-by-side comparison legible later (US3).
 */

/** Maps each metric key to the glossary term used for its label tooltip. */
const METRIC_TERM: Record<MetricKey, string> = {
  'total-growth': 'total growth',
  'annualized-return': 'annualized return',
  volatility: 'volatility',
  'max-drawdown': 'max drawdown',
}

/** A single metric card: label, big formatted value, on-demand definition. */
function MetricCard({ metric }: { metric: Metric }) {
  const isNegative =
    (metric.key === 'total-growth' ||
      metric.key === 'annualized-return' ||
      metric.key === 'max-drawdown') &&
    metric.value < 0
  const isWarning = metric.key === 'max-drawdown' && metric.value < 0
  return (
    <Card className="h-full">
      <CardHeader className="space-y-0 pb-2">
        <div className="text-sm font-medium text-muted-foreground">
          <GlossaryTerm term={METRIC_TERM[metric.key]}>{metric.label}</GlossaryTerm>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div
          className={cn(
            'text-3xl font-semibold tracking-tight tabular-nums',
            isNegative && 'text-destructive',
          )}
          data-testid={`metric-${metric.key}`}
          aria-label={`${metric.label}: ${metric.displayValue}`}
        >
          {metric.displayValue}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{metric.definition}</p>
        {isWarning && (
          <p className="text-xs font-medium text-muted-foreground">
            Peak-to-trough, not a total loss.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface MetricsPanelProps {
  metrics: Metric[]
  className?: string
}

export function MetricsPanel({ metrics, className }: MetricsPanelProps) {
  return (
    <section
      className={cn('space-y-3', className)}
      aria-label="Headline metrics"
      data-testid="metrics-panel"
    >
      <h3 className="text-sm font-semibold text-muted-foreground">
        The four headline numbers
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.key} metric={m} />
        ))}
      </div>
      {/* sr-only ordered list so a screen reader gets a stable, sequential readout */}
      <ol className="sr-only">
        {metrics.map((m) => (
          <li key={m.key}>
            {m.label}: {m.displayValue}. {m.definition}
          </li>
        ))}
      </ol>
    </section>
  )
}
