---
type: entity
title: "TradingView Lightweight Charts (v5)"
tags: [charting, react, frontend, a11y, canvas]
sources: [[../../raw/passive-portfolio-visualizer-research.md#r-5]]
related:
  - [[../summaries/passive-portfolio-visualizer-research.md]]
status: stable
updated: 2026-07-10
---

# TradingView Lightweight Charts (v5)

**What:** `lightweight-charts` — an axis-based / time-series charting library
by TradingView. **v5.2.0**, **Apache-2.0**, ~30 KB gzipped. It is the
mandated charting library in this project's constitution for "any data
visualization plotting series over an axis" (price, time-series, financial,
candlestick, line, area, histogram, bar).

> Pie/donut and other **categorical** charts are **not** covered by the mandate
> (no axis, no time dimension) and the library has no pie/donut series — so
> those legitimately use shadcn/ui `chart` (Recharts) instead.

## v5 API gotcha (breaks old tutorials)

v5 changed the series API:

```ts
// v5 (correct) — import the series definition, pass to addSeries
import { createChart, LineSeries, AreaSeries, BaselineSeries } from 'lightweight-charts';
const chart = createChart(el, { autoSize: true });
const series = chart.addSeries(LineSeries, { color: '...' });

// v3/v4 (OLD — does NOT work in v5)
const series = chart.addLineSeries({ color: '...' });
```

Old tutorials showing `addLineSeries(...)` / `addAreaSeries(...)` must be
updated.

## React integration (no official adapter)

Hand-rolled `useRef` + `useEffect`:

- Create the chart once; set `autoSize: true` (library runs its own
  `ResizeObserver`).
- Feed data via `series.setData(...)`.
- **Dispose with `chart.remove()`** in the effect cleanup to prevent canvas
  leaks.

## Series-per-need mapping

| Need | Series |
|---|---|
| Growth curve | `AreaSeries` (or `LineSeries`) |
| Comparison overlay (2–3 lines) | multiple `LineSeries` sharing the time axis, distinct `--chart-N` colors |
| Drawdown curve | `BaselineSeries` (`baseValue.price = 0`) — two-color fill above/below, purpose-built for "green above / red below" |

## Time format

ISO date string (`'2024-01-01'`) for monthly data. Date-only data is
timezone-safe. **Data must be sorted ascending; duplicate timestamps throw.**

## Theming to design tokens

Read shadcn CSS variables at runtime:

```ts
getComputedStyle(document.documentElement).getPropertyValue('--token')
```

Wrap HSL-component tokens with `hsl(...)`, then pass into `layout.background`,
`layout.textColor`, `grid.vertLines.color`, `grid.horzLines.color`,
`crosshair`, and per-series `color`. On theme change, re-apply with
`chart.applyOptions(...)`.

**Attribution:** Apache-2.0 requires crediting TradingView; the default
`layout.attributionLogo` satisfies this.

## Accessibility — the canvas caveat (WCAG 2.1 AA)

Lightweight Charts renders to `<canvas>` — an opaque bitmap to assistive tech.
Every chart MUST be paired with a **visually-hidden (`sr-only`) data table /
summary** mirroring the charted values (start, end, peak, trough, trend), plus
`role="img"` + `aria-label` on the container. This is mandatory, per-chart
work — not an afterthought.
