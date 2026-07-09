import type { RiskComfort, ShareableState, TimeHorizon, ViewKey } from '@/types'

/**
 * Pure encode/decode for shareable link state (contracts/shareable-link.md).
 *
 * The URL *is* the storage: when a user picks a strategy, amount, date range,
 * comparison set, or quiz answers, those choices are written into the web
 * address as flat short-key query params. Opening the link reproduces the view
 * with no server and no database.
 *
 * Contract guarantees:
 * - `encodeState` is total on valid state (never throws).
 * - `decodeState` is total on EVERY input (never throws; invalid/unknown values
 *   are silently dropped, falling back to the default state). This is what makes
 *   arbitrary links safe to open (FR-012).
 * - `decodeState(encodeState(state))` deep-equals `state` for every valid state.
 */

const SLUG_RE = /^[a-z0-9-]+$/ // URL-safe strategy slug
const MONTH_RE = /^\d{4}-\d{2}$/ // YYYY-MM

const VIEWS: ReadonlySet<ViewKey> = new Set(['explore', 'visualize', 'compare', 'recommend'])
const HORIZONS: ReadonlySet<TimeHorizon> = new Set(['short', 'medium', 'long'])
const RISKS: ReadonlySet<RiskComfort> = new Set(['low', 'medium', 'high'])

function isValidMonth(value: string): boolean {
  if (!MONTH_RE.test(value)) return false
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  return year >= 1900 && year <= 2100 && month >= 1 && month <= 12
}

function isPositiveInt(value: string): boolean {
  return /^\d+$/.test(value) && Number(value) > 0
}

/** Encodes shareable state → a query string WITHOUT the leading '?'. */
export function encodeState(state: ShareableState): string {
  const params = new URLSearchParams()

  if (state.strategyId && SLUG_RE.test(state.strategyId)) {
    params.set('s', state.strategyId)
  }
  if (
    typeof state.amount === 'number' &&
    Number.isFinite(state.amount) &&
    state.amount > 0 &&
    Number.isInteger(state.amount)
  ) {
    params.set('a', String(state.amount))
  }
  if (state.from && isValidMonth(state.from)) {
    params.set('from', state.from)
  }
  if (state.to && isValidMonth(state.to)) {
    params.set('to', state.to)
  }
  if (Array.isArray(state.compare) && state.compare.length > 0) {
    const valid = state.compare.filter((s) => SLUG_RE.test(s))
    if (valid.length > 0) {
      params.set('cmp', valid.slice(0, 3).join(','))
    }
  }
  if (state.view && VIEWS.has(state.view)) {
    params.set('view', state.view)
  }
  if (state.quiz && HORIZONS.has(state.quiz.timeHorizon) && RISKS.has(state.quiz.riskComfort)) {
    params.set('quiz', `${state.quiz.timeHorizon}.${state.quiz.riskComfort}`)
  }

  return params.toString()
}

/**
 * Decodes a query string (with or without a leading '?') → shareable state.
 * Total: never throws; unrecognized/invalid values are silently dropped.
 */
export function decodeState(query: string): ShareableState {
  const state: ShareableState = {}
  if (!query) return state

  const cleaned = query.startsWith('?') ? query.slice(1) : query
  const params = new URLSearchParams(cleaned)

  const s = params.get('s')
  if (s && SLUG_RE.test(s)) {
    state.strategyId = s
  }

  const a = params.get('a')
  if (a && isPositiveInt(a)) {
    state.amount = Number(a)
  }

  const from = params.get('from')
  if (from && isValidMonth(from)) {
    state.from = from
  }

  const to = params.get('to')
  if (to && isValidMonth(to)) {
    state.to = to
  }

  const cmp = params.get('cmp')
  if (cmp) {
    const ids = cmp
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && SLUG_RE.test(c))
    if (ids.length > 0) {
      state.compare = Array.from(new Set(ids)).slice(0, 3)
    }
  }

  const view = params.get('view')
  if (view && VIEWS.has(view as ViewKey)) {
    state.view = view as ViewKey
  }

  const quiz = params.get('quiz')
  if (quiz) {
    const parts = quiz.split('.')
    if (parts.length === 2) {
      const [horizon, risk] = parts
      if (HORIZONS.has(horizon as TimeHorizon) && RISKS.has(risk as RiskComfort)) {
        state.quiz = {
          timeHorizon: horizon as TimeHorizon,
          riskComfort: risk as RiskComfort,
        }
      }
    }
  }

  return state
}

/** Convenience: builds a full shareable URL from state + the current origin. */
export function buildShareUrl(state: ShareableState): string {
  const encoded = encodeState(state)
  const { origin, pathname } =
    typeof window !== 'undefined' && window.location
      ? window.location
      : { origin: '', pathname: '/' }
  return encoded ? `${origin}${pathname}?${encoded}` : `${origin}${pathname}`
}
