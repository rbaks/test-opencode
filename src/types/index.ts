/**
 * Shared TypeScript types for the Passive Portfolio Visualizer.
 *
 * These describe every piece of data the app works with. There is no database —
 * the bundled market history ships as static JSON and the user's choices are
 * encoded into the URL. See specs/001-passive-portfolio-visualizer/data-model.md
 * for the full entity rationale.
 */

/** The 5 market slices the app has bundled history for (the "ingredients"). */
export type AssetCategoryId =
  | 'us-total-equity' // US total stock market (Fama–French market factor)
  | 'intl-developed' // International developed markets ex-US
  | 'intl-emerging' // Emerging markets
  | 'us-treasury-interm' // US intermediate Treasuries (derived from FRED GS5)
  | 'gold' // Gold (FRED London PM fix)

/** Broad category of an asset class — used for grouping and color cues. */
export type AssetCategory = 'equity' | 'fixed-income' | 'commodity'

/** One market slice the app has bundled history for. */
export interface AssetClass {
  id: AssetCategoryId
  name: string // Plain-language: "US total stock market"
  category: AssetCategory
  dataSource: string // Human-readable source + series id
  proxyNote?: string // Present when this is a documented proxy
  glossary: string // One-line beginner definition (FR-003)
  dataStartMonth: string // 'YYYY-MM' — earliest available month
}

/** A single month's total return for one asset class (decimal, e.g. 0.012 = +1.2%). */
export interface ReturnPoint {
  month: string // 'YYYY-MM' (month-start)
  return: number // Monthly total return as a decimal
}

/** The bundled monthly performance history for one asset class. */
export interface ReturnSeries {
  assetId: AssetCategoryId
  points: ReturnPoint[] // Sorted ascending by month; no duplicates
}

/** One line of a strategy's recipe: "this asset class makes up this percentage." */
export interface Allocation {
  assetId: AssetCategoryId
  weight: number // 0..1 (e.g. 0.6 = 60%)
}

/** Risk tier — used for the recommendation mapping and gallery badges. */
export type RiskTier = 'conservative' | 'balanced' | 'aggressive'

/** A named, predefined portfolio recipe (the unit of explore + compare). */
export interface Strategy {
  id: string // URL-safe slug, e.g. '60-40'
  name: string // Display name: "60/40 Balanced"
  shortDescription: string // One-line summary for the gallery card
  whoItSuits: string // Plain-language "who this suits" guidance
  tradeoffs: string // Plain-language growth-vs-calmness trade-off
  riskTier: RiskTier
  allocations: Allocation[] // The recipe (weights sum to 1.0)
  earliestStartMonth: string // 'YYYY-MM' — max of component dataStartMonth
}

/** Input for a single backtest run. */
export interface BacktestRunInput {
  strategyId: string
  startAmount: number // > 0 (USD); zero/negative is blocked
  startMonth: string // 'YYYY-MM'
  endMonth: string // 'YYYY-MM', >= startMonth
}

/** One month-end portfolio value in a growth series. */
export interface GrowthPoint {
  month: string // 'YYYY-MM'
  value: number // Portfolio value in USD at month-end
}

/** The four headline numbers shown for any run (FR-005). */
export type MetricKey = 'total-growth' | 'annualized-return' | 'volatility' | 'max-drawdown'

export interface Metric {
  key: MetricKey
  label: string // Plain-language: "Total Growth"
  value: number // The computed figure (decimal, e.g. 0.42 = 42%)
  displayValue: string // Formatted for humans: "+42.0%"
  definition: string // One-line beginner definition (FR-003/FR-005)
}

/** A plain-language warning produced when a run is adjusted, never silently. */
export type RunWarningCode = 'shortened-to-data'

export interface RunWarning {
  code: RunWarningCode
  message: string // Plain-language, shown to the user
}

/** A structured validation error — the run is blocked, never computed with bad input. */
export type BacktestErrorCode = 'INVALID_AMOUNT' | 'INVALID_RANGE' | 'NO_DATA'

export interface BacktestError {
  code: BacktestErrorCode
  message: string
}

/** A completed simulation: input + growth series + metrics + range used + warnings. */
export interface BacktestRun extends BacktestRunInput {
  growthSeries: GrowthPoint[] // Month-end values, start..end (post-rebalance)
  metrics: Metric[] // The four headline numbers
  dataRangeUsed: {
    // What was actually computed (may differ from input)
    startMonth: string // Adjusted to latest-common-start if needed
    endMonth: string
  }
  warnings: RunWarning[] // e.g. "shortened to available data"
}

/** Personalization-quiz answers (held in memory only; encoded into the URL). */
export type TimeHorizon = 'short' | 'medium' | 'long' // <5y / 5–15y / >15y
export type RiskComfort = 'low' | 'medium' | 'high' // How much drop the user can stomach

export interface UserPreferenceSet {
  timeHorizon: TimeHorizon
  riskComfort: RiskComfort
}

/** Which feature panel is active. Defaults to 'explore'. */
export type ViewKey = 'explore' | 'visualize' | 'compare' | 'recommend'

/** The state encoded into a shareable link (the URL *is* the storage). */
export interface ShareableState {
  strategyId?: string
  amount?: number
  from?: string // 'YYYY-MM'
  to?: string // 'YYYY-MM'
  compare?: string[] // 0..3 strategy ids
  view?: ViewKey
  quiz?: UserPreferenceSet
}
