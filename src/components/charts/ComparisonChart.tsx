import { useEffect, useRef } from 'react'
import {
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts'
import type { BacktestRun, MetricKey } from '@/types'
import { formatCurrency, formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * ComparisonChart (T043) — TradingView Lightweight Charts v5 LineSeries overlay.
 *
 * Renders 2–3 strategies on one shared time axis so a beginner can see, at a
 * glance, which strategy grew more and which one dipped harder over the same
 * span. Distinct `--chart-N` colors per line (read from shadcn CSS variables
 * at runtime so the chart inherits the design tokens, FR-010).
 *
 * Alignment is the whole point of the comparison: every line is fed growth
 * series that all start at the same month (runComparison aligns them upstream
 * on the latest common start month — data-model.md edge case). The chart
 * itself never invents alignment: it plots exactly the months each run covers.
 *
 * Accessibility: every canvas chart is paired with a visually-hidden
 * (sr-only) data table mirroring key values (FR-010, R-5). For a comparison,
 * the table summarizes each strategy's start/end/peak/trough so a screen
 * reader gets the same story as a sighted user.
 */

/** One strategy's contribution to the comparison overlay. */
export interface ComparisonSeries {
  /** Stable id used as React key + the LineSeries order. */
  strategyId: string
  /** Display name shown in the legend and the sr-only summary. */
  strategyName: string
  /** The successful backtest run for this strategy (already aligned upstream). */
  run: BacktestRun
}

interface ComparisonChartProps {
  /** One LineSeries per entry, drawn in order with `--chart-N` colors. */
  series: ComparisonSeries[]
  /** The user's starting amount — labels the sr-only summary. */
  startAmount: number
  /** Optional className for the outer container. */
  className?: string
}

/** Palette of shadcn chart CSS vars, with sensible fallbacks for jsdom. */
const CHART_VARS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'] as const
const CHART_FALLBACKS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c'] as const

function readCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function colorFor(index: number): string {
  // Clamp to the last palette entry so a stray index never returns undefined.
  const safeIndex = Math.min(index, CHART_VARS.length - 1)
  const varName = CHART_VARS[safeIndex]!
  const fallback = CHART_FALLBACKS[safeIndex]!
  return readCssVar(varName, fallback)
}

/** Builds a one-line-per-strategy summary for the sr-only companion table. */
function buildSummaries(series: ComparisonSeries[], startAmount: number) {
  return series.map((s) => {
    const values = s.run.growthSeries
    if (values.length === 0) {
      return {
        strategyId: s.strategyId,
        strategyName: s.strategyName,
        startMonth: '',
        endMonth: '',
        start: startAmount,
        end: startAmount,
        peak: startAmount,
        peakMonth: '',
        trough: startAmount,
        troughMonth: '',
        totalReturn: 0,
        metrics: {} as Partial<Record<MetricKey, string>>,
      }
    }
    let peak = values[0]!
    let trough = values[0]!
    for (const p of values) {
      if (p.value > peak.value) peak = p
      if (p.value < trough.value) trough = p
    }
    const start = values[0]!
    const end = values[values.length - 1]!
    const totalReturn = end.value / startAmount - 1
    const metrics: Partial<Record<MetricKey, string>> = {}
    for (const m of s.run.metrics) metrics[m.key] = m.displayValue
    return {
      strategyId: s.strategyId,
      strategyName: s.strategyName,
      startMonth: start.month,
      endMonth: end.month,
      start: start.value,
      end: end.value,
      peak: peak.value,
      peakMonth: peak.month,
      trough: trough.value,
      troughMonth: trough.month,
      totalReturn,
      metrics,
    }
  })
}

export function ComparisonChart({ series, startAmount, className }: ComparisonChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  // Stable list of LineSeries instances keyed by strategyId so we can update
  // data without recreating the chart when the selection changes.
  const seriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const textColor = readCssVar('--foreground', '#0a0a0a')
    const background = readCssVar('--background', '#ffffff')
    const gridColor = readCssVar('--border', '#e5e7eb')

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { color: background },
        textColor,
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: false,
      },
      crosshair: { mode: 1 },
    })

    chartRef.current = chart

    // Capture the refs locally so the cleanup reads the instances that existed
    // when this effect ran, not whatever the ref points to by cleanup time.
    const seriesMap = seriesRefs.current
    return () => {
      chart.remove()
      chartRef.current = null
      seriesMap.clear()
    }
  }, [])

  // Reconcile the LineSeries set with the current `series` prop: add new
  // lines, remove stale ones, and feed data into the survivors. This is the
  // same lifecycle split as GrowthChart (create once, setData on change), so
  // toggling a chip does not recreate the whole chart (60fps, SC-006).
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const seriesMap = seriesRefs.current
    const wantedIds = new Set(series.map((s) => s.strategyId))

    // Remove lines for strategies no longer selected.
    for (const [id, line] of seriesMap.entries()) {
      if (!wantedIds.has(id)) {
        chart.removeSeries(line)
        seriesMap.delete(id)
      }
    }

    // Add or update lines for the current selection, preserving the visual
    // order of `series` so colors are stable (chart-1 → first selected).
    series.forEach((s, index) => {
      let line = seriesMap.get(s.strategyId)
      if (!line) {
        line = chart.addSeries(LineSeries, {
          color: colorFor(index),
          lineWidth: 2,
          crosshairMarkerVisible: true,
        })
        seriesMap.set(s.strategyId, line)
      } else {
        line.applyOptions({ color: colorFor(index) })
      }
      const data = s.run.growthSeries.map((p) => ({
        time: `${p.month}-01` as Time,
        value: p.value,
      }))
      line.setData(data)
    })

    chart.timeScale().fitContent()
  }, [series])

  const summaries = buildSummaries(series, startAmount)
  const spanStart = summaries[0]?.startMonth ?? ''
  const spanEnd = summaries[0]?.endMonth ?? ''

  return (
    <div className={cn('space-y-2', className)}>
      <div
        role="img"
        aria-label={`Comparison chart from ${spanStart ? formatMonth(spanStart) : ''} to ${
          spanEnd ? formatMonth(spanEnd) : ''
        }. ${summaries
          .map(
            (s) =>
              `${s.strategyName}: ending value ${formatCurrency(s.end)}, total growth ${
                s.totalReturn >= 0 ? '+' : ''
              }${(s.totalReturn * 100).toFixed(1)}%`,
          )
          .join('; ')}.`}
        className="h-[320px] w-full sm:h-[420px]"
      >
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Legend — visible labels so sighted users can tell lines apart without
          relying on color alone (FR-010, WCAG use-of-color rule). */}
      <ul
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs"
        data-testid="comparison-legend"
        aria-label="Comparison chart legend"
      >
        {series.map((s, index) => (
          <li key={s.strategyId} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colorFor(index) }}
            />
            <span className="font-medium">{s.strategyName}</span>
          </li>
        ))}
      </ul>

      {summaries.length > 0 && (
        <table className="sr-only">
          <caption>Comparison chart data summary</caption>
          <thead>
            <tr>
              <th scope="col">Strategy</th>
              <th scope="col">Starting value</th>
              <th scope="col">Peak value</th>
              <th scope="col">Trough value</th>
              <th scope="col">Ending value</th>
              <th scope="col">Total growth</th>
              <th scope="col">Worst drawdown</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.strategyId}>
                <th scope="row">{s.strategyName}</th>
                <td>{formatCurrency(s.start)}</td>
                <td>
                  {formatCurrency(s.peak)} ({formatMonth(s.peakMonth)})
                </td>
                <td>
                  {formatCurrency(s.trough)} ({formatMonth(s.troughMonth)})
                </td>
                <td>
                  {formatCurrency(s.end)} ({formatMonth(s.endMonth)})
                </td>
                <td>
                  {s.totalReturn >= 0 ? '+' : ''}
                  {(s.totalReturn * 100).toFixed(1)}%
                </td>
                <td>{s.metrics['max-drawdown'] ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
