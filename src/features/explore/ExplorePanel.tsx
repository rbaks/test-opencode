import { StrategyCard } from '@/components/strategy/StrategyCard'
import { StrategyDetail } from '@/components/strategy/StrategyDetail'
import { EmptyState } from '@/components/states'
import { STRATEGIES, getStrategy } from '@/data/strategies'

interface ExplorePanelProps {
  selectedStrategyId: string | null
  onSelectStrategy: (id: string) => void
}

/**
 * User Story 1 — Explore & Understand the Strategy Library (T023).
 *
 * A responsive gallery of every strategy plus a detail view driven by the
 * selected strategy id. With no selection, a friendly prompt guides the first
 * pick (never a blank screen — FR-012). Selecting a card shows its full
 * allocation, "who it suits", and trade-offs.
 *
 * The panel is intentionally router-free: the App shell (T024) owns the `s=`
 * and `view=explore` URL params and passes the selection down as props, so this
 * component stays a pure, testable function of (selectedId, onSelect).
 */
export function ExplorePanel({ selectedStrategyId, onSelectStrategy }: ExplorePanelProps) {
  const selected = selectedStrategyId ? getStrategy(selectedStrategyId) : undefined

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Strategy library</h2>
        <p className="text-sm text-muted-foreground">
          Six well-known passive strategies across the risk spectrum — from calm and steady to
          growth-hungry. Pick one to see exactly what&apos;s in it and who it suits.
        </p>
      </section>

      <ul className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STRATEGIES.map((strategy) => (
          <li key={strategy.id} className="h-full">
            <StrategyCard
              strategy={strategy}
              selected={strategy.id === selectedStrategyId}
              onSelect={onSelectStrategy}
              className="h-full"
            />
          </li>
        ))}
      </ul>

      {selected ? (
        <StrategyDetail strategy={selected} data-testid="strategy-detail" />
      ) : (
        <EmptyState
          title="Pick a strategy to dive in"
          description="Select any card above to see its full allocation breakdown, who it suits, and its growth-versus-calmness trade-offs."
          className="mx-auto max-w-2xl"
        />
      )}
    </div>
  )
}
