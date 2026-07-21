import type { AssetCategoryId, ReturnSeries } from '@/types'
import rawData from './series.json'

/**
 * Bundled monthly total-return series for all 5 asset classes (T031).
 *
 * The data is a static JSON file imported at build time — no runtime network
 * fetch, so the app stays fully usable offline after first load (FR-012). Each
 * series runs from the asset class's `dataStartMonth` (1990-07) through the
 * vintage "as-of" month (currently 2025-06; see meta.ts). The series are
 * aligned: every asset class carries the exact same set of months in the same
 * order, so the backtest engine can index them by month-key without alignment
 * work of its own.
 *
 * Provenance: each series represents one asset class drawn from the Kenneth
 * French Data Library (equities) or FRED (Treasuries + gold). The current
 * bundled JSON is a synthetic-representative dataset produced by
 * `scripts/generate-returns.mjs` — same shape as the real public-domain
 * sources, with realistic drift/vol and the 2008 + 2020 crashes baked in so
 * the educational story (and FR-007's "show the dips honestly" rule) is
 * faithful. Swapping in real values later is a pure file replacement; nothing
 * else in the codebase changes. See DATA_SOURCES.md for the full methodology.
 */

const MONTH_RE = /^\d{4}-\d{2}$/

const KNOWN_ASSET_IDS: ReadonlySet<AssetCategoryId> = new Set([
  'us-total-equity',
  'intl-developed',
  'intl-emerging',
  'us-treasury-interm',
  'gold',
])

interface RawPoint {
  month: string
  return: number
}

interface RawSeries {
  assetId: string
  points: RawPoint[]
}

/**
 * Build-time + runtime integrity check (FR-014, T031). Verifies that every
 * series is well-formed: ascending months with no duplicates or gaps, every
 * return is a finite number inside the bounded [-1, 1] range, and the asset id
 * is one of the known categories. An invalid bundled dataset fails loudly here
 * — never silently ships.
 */
function assertSeriesIntegrity(seriesList: RawSeries[]): void {
  if (seriesList.length === 0) {
    throw new Error('Returns dataset is empty')
  }

  let referenceMonths: string[] | null = null

  for (const series of seriesList) {
    if (!KNOWN_ASSET_IDS.has(series.assetId as AssetCategoryId)) {
      throw new Error(`Unknown assetId in returns dataset: "${series.assetId}"`)
    }
    if (series.points.length === 0) {
      throw new Error(`Series "${series.assetId}" has no points`)
    }

    const months: string[] = []
    for (const point of series.points) {
      if (!MONTH_RE.test(point.month)) {
        throw new Error(`Series "${series.assetId}" has malformed month "${point.month}"`)
      }
      if (!Number.isFinite(point.return)) {
        throw new Error(
          `Series "${series.assetId}" has non-finite return for ${point.month}`,
        )
      }
      if (point.return < -1 || point.return > 1) {
        throw new Error(
          `Series "${series.assetId}" has out-of-range return ${point.return} for ${point.month}`,
        )
      }
      months.push(point.month)
    }

    // Strictly ascending, no duplicates.
    for (let i = 1; i < months.length; i++) {
      const prev = months[i - 1]
      const curr = months[i]
      if (prev !== undefined && curr !== undefined && curr <= prev) {
        throw new Error(
          `Series "${series.assetId}" months are not strictly ascending at index ${i}: ` +
            `"${prev}" → "${curr}"`,
        )
      }
    }

    // No gaps: every consecutive pair is exactly one calendar month apart.
    for (let i = 1; i < months.length; i++) {
      const prev = months[i - 1]
      const curr = months[i]
      if (prev !== undefined && curr !== undefined && monthDelta(prev, curr) !== 1) {
        throw new Error(
          `Series "${series.assetId}" has a gap between "${prev}" and "${curr}"`,
        )
      }
    }

    // Cross-series alignment: every series must cover the exact same months.
    if (referenceMonths === null) {
      referenceMonths = months
    } else if (months.join(',') !== referenceMonths.join(',')) {
      throw new Error(`Series "${series.assetId}" months do not align with the first series`)
    }
  }
}

/** Returns the number of calendar months from `a` to `b` (positive when b > a). */
function monthDelta(a: string, b: string): number {
  const ay = Number(a.slice(0, 4))
  const am = Number(a.slice(5, 7))
  const by = Number(b.slice(0, 4))
  const bm = Number(b.slice(5, 7))
  return (by - ay) * 12 + (bm - am)
}

assertSeriesIntegrity(rawData as RawSeries[])

/** The typed, validated bundled series, keyed by asset id. */
export const RETURN_SERIES: Record<AssetCategoryId, ReturnSeries> = (() => {
  const map = {} as Record<AssetCategoryId, ReturnSeries>
  for (const series of rawData as RawSeries[]) {
    map[series.assetId as AssetCategoryId] = {
      assetId: series.assetId as AssetCategoryId,
      points: series.points.map((p) => ({ month: p.month, return: p.return })),
    }
  }
  return map
})()

/** Lookup of monthly return by (assetId, month) — returns undefined if missing. */
export function returnForMonth(assetId: AssetCategoryId, month: string): number | undefined {
  const series = RETURN_SERIES[assetId]
  if (!series) return undefined
  // Binary search — series is sorted ascending by month.
  let lo = 0
  let hi = series.points.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const point = series.points[mid]
    if (!point) break
    const cmp = point.month.localeCompare(month)
    if (cmp === 0) return point.return
    if (cmp < 0) lo = mid + 1
    else hi = mid - 1
  }
  return undefined
}

const FIRST_SERIES: RawSeries = (rawData as RawSeries[])[0]!

/** The first (earliest) month covered by every bundled series. */
export const DATA_START_MONTH: string = FIRST_SERIES.points[0]!.month

/** The last (latest) month covered by every bundled series. */
export const DATA_END_MONTH: string = (() => {
  const points = FIRST_SERIES.points
  return points[points.length - 1]!.month
})()

/** Sorted list of every month covered by the bundled data (ascending). */
export const ALL_MONTHS: readonly string[] = FIRST_SERIES.points.map((p) => p.month)

/**
 * The latest common start month across a set of asset ids (the latest month
 * that all of them have data for). Used by the comparison feature to align
 * strategies over the same span (research.md §R-3, data-model.md edge case).
 */
export function latestCommonStartMonth(assetIds: readonly AssetCategoryId[]): string {
  // All bundled series share the same span, so the latest common start is
  // simply the earliest data point available across the requested ids — but
  // we compute it honestly from the data rather than assuming alignment.
  let latest = DATA_START_MONTH
  for (const id of assetIds) {
    const start = RETURN_SERIES[id]?.points[0]?.month
    if (start && start > latest) latest = start
  }
  return latest
}
