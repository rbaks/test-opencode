import { useEffect, useRef } from 'react'
import {
  AreaSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts'
import type { GrowthPoint } from '@/types'
import { formatCurrency, formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * GrowthChart (T035) — TradingView Lightweight Charts v5 AreaSeries wrapper.
 *
 * Renders a single strategy's month-end portfolio value over time. The area
 * fill visually communicates the cumulative balance (where the money went),
 * and the dips — including the 2008 and 2020 crashes — show up honestly with
 * no smoothing (FR-007).
 *
 * Implementation notes (research.md §R-5):
 * - Hand-rolled React wrapper: `useRef` for the chart container, `useEffect`
 *   for create/setData/dispose. No official React adapter exists.
 * - `autoSize: true` lets the library handle resize via its own
 *   `ResizeObserver`, so we don't manage width/height in React state.
 * - Cleanup disposes the chart (`chart.remove()`) to prevent canvas leaks.
 * - Theming reads shadcn CSS variables at runtime so the chart inherits the
 *   design tokens; falls back to sensible defaults when the variables are not
 *   present (e.g. jsdom in tests).
 *
 * Accessibility: every canvas chart is paired with a visually-hidden (`sr-only`)
 * data table mirroring key values (FR-010, R-5). The table summarizes — not
 * every month, but the start/end/peak/trough — so a screen reader gets the
 * same story as a sighted user without an overwhelming recitation.
 */

interface GrowthChartProps {
  /** Month-end portfolio values, one GrowthPoint per month in the run's range. */
  growthSeries: GrowthPoint[]
  /** The user's starting amount — used to label the sr-only summary. */
  startAmount: number
  /** Optional className for the outer container. */
  className?: string
}

function readCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

/** Picks a representative summary for the sr-only companion table. */
function buildSummary(growthSeries: GrowthPoint[], startAmount: number) {
  if (growthSeries.length === 0) return null
  const values = growthSeries.map((p) => p.value)
  const start = values[0]!
  const end = values[values.length - 1]!
  let peak = growthSeries[0]!
  let trough = growthSeries[0]!
  for (const p of growthSeries) {
    if (p.value > peak.value) peak = p
    if (p.value < trough.value) trough = p
  }
  const totalReturn = end / startAmount - 1
  return {
    startMonth: growthSeries[0]!.month,
    endMonth: growthSeries[growthSeries.length - 1]!.month,
    start,
    end,
    peak: peak.value,
    peakMonth: peak.month,
    trough: trough.value,
    troughMonth: trough.month,
    totalReturn,
  }
}

export function GrowthChart({ growthSeries, startAmount, className }: GrowthChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const textColor = readCssVar('--foreground', '#0a0a0a')
    const background = readCssVar('--background', '#ffffff')
    const gridColor = readCssVar('--border', '#e5e7eb')
    const accent = readCssVar('--chart-1', '#2563eb')

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

    const series = chart.addSeries(AreaSeries, {
      lineColor: accent,
      topColor: `${accent}33`,
      bottomColor: `${accent}05`,
      lineWidth: 2,
    })

    chartRef.current = chart
    seriesRef.current = series

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  // Feed data into the series whenever it changes (separate from chart
  // lifecycle so we don't recreate the chart on every run).
  useEffect(() => {
    const series = seriesRef.current
    const chart = chartRef.current
    if (!series || !chart) return

    const data = growthSeries.map((p) => ({
      // Lightweight Charts accepts 'YYYY-MM-DD' ISO strings as Time for
      // date-only data (no timezone math — research.md §R-5).
      time: `${p.month}-01` as Time,
      value: p.value,
    }))
    series.setData(data)
    chart.timeScale().fitContent()
  }, [growthSeries])

  const summary = buildSummary(growthSeries, startAmount)

  return (
    <div className={cn('space-y-2', className)}>
      <div
        role="img"
        aria-label={`Growth chart from ${summary ? formatMonth(summary.startMonth) : ''} to ${
          summary ? formatMonth(summary.endMonth) : ''
        }. Starting amount ${formatCurrency(startAmount)}; ending value ${
          summary ? formatCurrency(summary.end) : ''
        }; total growth ${
          summary ? `${summary.totalReturn >= 0 ? '+' : ''}${(summary.totalReturn * 100).toFixed(1)}%` : ''
        }.`}
        className="h-[280px] w-full sm:h-[360px]"
      >
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {summary && (
        <table className="sr-only">
          <caption>Growth chart data summary</caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Value</th>
              <th scope="col">Month</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Starting value</th>
              <td>{formatCurrency(startAmount)}</td>
              <td>{formatMonth(summary.startMonth)}</td>
            </tr>
            <tr>
              <th scope="row">Peak value</th>
              <td>{formatCurrency(summary.peak)}</td>
              <td>{formatMonth(summary.peakMonth)}</td>
            </tr>
            <tr>
              <th scope="row">Trough value</th>
              <td>{formatCurrency(summary.trough)}</td>
              <td>{formatMonth(summary.troughMonth)}</td>
            </tr>
            <tr>
              <th scope="row">Ending value</th>
              <td>{formatCurrency(summary.end)}</td>
              <td>{formatMonth(summary.endMonth)}</td>
            </tr>
            <tr>
              <th scope="row">Total growth</th>
              <td>
                {summary.totalReturn >= 0 ? '+' : ''}
                {(summary.totalReturn * 100).toFixed(1)}%
              </td>
              <td>{formatMonth(summary.startMonth)} to {formatMonth(summary.endMonth)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
