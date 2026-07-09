import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RiskTier, Strategy } from '@/types'

interface StrategyCardProps {
  strategy: Strategy
  selected?: boolean
  onSelect: (id: string) => void
  className?: string
}

/**
 * Map a strategy's risk tier to a visible badge label + styling. The label text
 * itself is a glossary term and is wrapped with GlossaryTerm inside StrategyDetail
 * (where there is room for a tooltip); here in the gallery it is a quick at-a-glance
 * cue only.
 */
const TIER_BADGE: Record<RiskTier, { label: string; className: string }> = {
  conservative: { label: 'Conservative', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  balanced: { label: 'Balanced', className: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  aggressive: { label: 'Aggressive', className: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400' },
}

/**
 * One gallery tile: a strategy's name, one-line summary, and risk-tier badge.
 * The whole card is a single button so a beginner can click anywhere to open the
 * detail view (T020). Keyboard and screen-reader users get one focusable control
 * per card with the strategy name in its accessible name.
 */
export function StrategyCard({ strategy, selected, onSelect, className }: StrategyCardProps) {
  const tier = TIER_BADGE[strategy.riskTier]
  return (
    <button
      type="button"
      onClick={() => onSelect(strategy.id)}
      aria-pressed={selected}
      aria-label={`View details for ${strategy.name}`}
      className={cn(
        'group flex h-full w-full flex-col gap-3 rounded-lg border bg-card p-5 text-left shadow-sm transition-all',
        'hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected && 'border-primary ring-1 ring-primary',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-base font-semibold leading-tight tracking-tight">
          {strategy.name}
        </span>
        <Badge variant="outline" className={cn('shrink-0 capitalize', tier.className)}>
          {tier.label}
        </Badge>
      </div>
      <span className="text-sm text-muted-foreground">{strategy.shortDescription}</span>
      <span className="mt-auto text-sm font-medium text-primary opacity-80 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        View details
      </span>
    </button>
  )
}
