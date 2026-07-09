import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getStrategy } from '@/data/strategies'

/**
 * Reads and writes the `s=` (selected strategy) URL param (contracts/shareable-link.md).
 *
 * The selection only ever resolves to a *real* strategy: a stale or unknown id
 * baked into a shared link silently falls back to no selection (FR-012 graceful
 * fallback) rather than throwing or rendering a broken detail view. This is the
 * hook the App shell uses to drive ExplorePanel, keeping the panel itself a pure
 * function of (selectedId, onSelect) with no router knowledge.
 */
export function useSelectedStrategy() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawId = searchParams.get('s')
  const selectedStrategyId = rawId && getStrategy(rawId) ? rawId : null

  const setSelectedStrategy = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams)
      params.set('s', id)
      // pushState (replace: false) so the browser Back button restores the
      // previous selection (contracts/shareable-link.md history behavior).
      setSearchParams(params, { replace: false })
    },
    [searchParams, setSearchParams],
  )

  return { selectedStrategyId, setSelectedStrategy } as const
}
