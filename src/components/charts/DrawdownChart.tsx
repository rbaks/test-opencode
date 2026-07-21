import { useEffect, useRef } from 'react'
import {
  BaselineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts'
import type { GrowthPoint } from '@/types'
import { formatCurrency, formatMonth, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * DrawdownChart (T035.5) — TradingView Lightweight Charts v5 BaselineSeries.
 *
 * Renders the portfolio's drawdown over time: the percentage drop from the
 * running peak at each month. The BaselineSeries is purpose-built for this —
 * `baseValue.price = 0` draws a zero line, and the two-color fill (green
 * above, red below) makes the underwater periods visually unmistakable.
 *
 * A drawdown series is always ≤ 0 (a portfolio cannot be "below" zero drawdown
 * — the worst case is flat at 0, meaning "at a fresh high"). The 2008 and 2020
 * crashes show up as deep red troughs, never softened (FR-007).
 *
 * Implementation notes mirror GrowthChart (T035): hand-rolled useRef/useEffect,
 * autoSize, dispose on cleanup, shadcn CSS vars for theming. A sr-only table
 * summarizes the worst drawdown for screen readers (FR-010).
 */

interface DrawdownChartProps {
  /** Month-end portfolio values — drawdowns are derived from these. */
  growthSeries: GrowthPoint[]
  /** Optional className for the outer container. */
  className?: string
}

function readCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

/** Computes a drawdown series (running peak-to-trough percentage) from values. */
function computeDrawdownSeries(growthSeries: GrowthPoint[]) {
  let peak = -Infinity
  const out: { month: string; drawdown: number }[] = []
  for (const point of growthSeries) {
    if (point.value > peak) peak = point.value
    const dd = peak > 0 ? point.value / peak - 1 : 0
    out.push({ month: point.month, drawdown: dd })
  }
  return out
}

export function DrawdownChart({ growthSeries, className }: DrawdownChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Baseline'> | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const textColor = readCssVar('--foreground', '#0a0a0a')
    const background = readCssVar('--background', '#ffffff')
    const gridColor = readCssVar('--border', '#e5e7eb')
    const upColor = readCssVar('--chart-2', '#16a34a')
    const downColor = readCssVar('--destructive', '#dc2626')

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

    const series = chart.addSeries(BaselineSeries, {
      baseValue: { type: 'price', price: 0 },
      topLineColor: upColor,
      topFillColor1: `${upColor}33`,
      topFillColor2: `${upColor}05`,
      bottomLineColor: downColor,
      bottomFillColor1: `${downColor}05`,
      bottomFillColor2: `${downColor}33`,
      lineWidth: 2,
      priceFormat: { type: 'percent', precision: 1, minMove: 0.1 },
    })

    chartRef.current = chart
    seriesRef.current = series

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  useEffect(() => {
    const series = seriesRef.current
    const chart = chartRef.current
    if (!series || !chart) return

    const drawdowns = computeDrawdownSeries(growthSeries)
    const data = drawdowns.map((d) => ({
      time: `${d.month}-01` as Time,
      value: d.drawdown * 100, // BaselineSeries + priceFormat: percent → 0..-X
    }))
    series.setData(data)
    chart.timeScale().fitContent()
  }, [growthSeries])

  const drawdowns = computeDrawdownSeries(growthSeries)
  const worst = drawdowns.reduce(
    (acc, d) => (d.drawdown < acc.drawdown ? d : acc),
    drawdowns[0] ?? { month: '', drawdown: 0 },
  )

  return (
    <div className={cn('space-y-2', className)}>
      <div
        role="img"
        aria-label={`Drawdown chart. Worst drawdown ${formatPercent(worst.drawdown)} in ${formatMonth(
          worst.month,
        )}.`}
        className="h-[240px] w-full sm:h-[300px]"
      >
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {drawdowns.length > 0 && (
        <table className="sr-only">
          <caption>Drawdown chart data summary</caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Value</th>
              <th scope="col">Month</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Worst peak-to-trough drop</th>
              <td>{formatPercent(worst.drawdown)}</td>
              <td>{formatMonth(worst.month)}</td>
            </tr>
            <tr>
              <th scope="row">Peak portfolio value</th>
              <td>{formatCurrency(Math.max(...growthSeries.map((p) => p.value)))}</td>
              <td>{formatMonth(growthSeries.reduce((a, b) => (b.value > a.value ? b : a)).month)}</td>
            </tr>
            <tr>
              <th scope="row">Trough portfolio value</th>
              <td>{formatCurrency(Math.min(...growthSeries.map((p) => p.value)))}</td>
              <td>{formatMonth(growthSeries.reduce((a, b) => (b.value < a.value ? b : a)).month)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
