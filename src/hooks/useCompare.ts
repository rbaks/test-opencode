import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { STRATEGIES, getStrategy } from '@/data/strategies'

/**
 * useCompare (T047) — reads/writes the `cmp=` URL param.
 *
 * The `cmp=` param encodes the comparison set as comma-separated strategy
 * slugs (contracts/shareable-link.md). The hook resolves each slug against
 * the bundled strategy library so a stale or unknown id in a shared link
 * is silently dropped (FR-012 graceful fallback) rather than breaking the
 * comparison or rendering a half-rendered chart.
 *
 * The shared amount / period (`a=`, `from=`, `to=`) is owned by `useBacktest`
 * — the compare view reuses those values so a user who tuned a run in
 * Visualize sees the same span when they switch to Compare.
 */

/** Stable canonical order: the order strategies appear in the STRATEGIES list.
 * Used so chips + chart lines stay in the same order regardless of how the
 * ids were ordered in the URL (visual stability as the user toggles chips). */
const ORDER_INDEX: ReadonlyMap<string, number> = new Map(
  STRATEGIES.map((s, i) => [s.id, i]),
)

function compareStrategyOrder(a: string, b: string): number {
  const ia = ORDER_INDEX.get(a) ?? Number.MAX_SAFE_INTEGER
  const ib = ORDER_INDEX.get(b) ?? Number.MAX_SAFE_INTEGER
  return ia - ib
}

export function useCompare() {
  const [searchParams, setSearchParams] = useSearchParams()

  const rawCmp = searchParams.get('cmp') ?? ''
  // Filter to known strategy ids, dedupe, cap at 3 — defensive on every read
  // so a malformed link never produces an invalid selection.
  const selectedStrategyIds: string[] = (() => {
    const ids = rawCmp
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    const valid: string[] = []
    const seen = new Set<string>()
    for (const id of ids) {
      if (seen.has(id)) continue
      if (!getStrategy(id)) continue
      seen.add(id)
      valid.push(id)
      if (valid.length >= 3) break
    }
    // Preserve the canonical STRATEGIES order so chips + chart lines stay
    // stable regardless of how the ids were ordered in the URL.
    return valid.sort(compareStrategyOrder)
  })()

  const setSelectedStrategyIds = useCallback(
    (next: string[]) => {
      const params = new URLSearchParams(searchParams)
      // Dedupe + cap at 3 + preserve canonical order.
      const unique = Array.from(new Set(next)).slice(0, 3)
      unique.sort(compareStrategyOrder)
      if (unique.length === 0) {
        params.delete('cmp')
      } else {
        params.set('cmp', unique.join(','))
      }
      // pushState (replace: false) so the browser Back button restores the
      // previous selection (contracts/shareable-link.md history behavior).
      setSearchParams(params, { replace: false })
    },
    [searchParams, setSearchParams],
  )

  return { selectedStrategyIds, setSelectedStrategyIds } as const
}
