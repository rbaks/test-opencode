import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { GlossaryTerm } from '@/components/GlossaryTerm'
import { AllocationDonut } from '@/components/strategy/AllocationDonut'
import { cn } from '@/lib/utils'
import type { Strategy } from '@/types'

interface StrategyDetailProps {
  strategy: Strategy
  className?: string
}

/**
 * The full detail view for one strategy (T022): what it holds, who it suits, and
 * the growth-versus-calmness trade-off — every piece in plain language. This is
 * the payoff of User Story 1: a beginner can understand one strategy fully,
 * with no account and no money entered.
 *
 * Financial terms are wrapped in GlossaryTerm so their on-demand definitions
 * appear on hover and keyboard focus (FR-003 term-coverage rule). The risk-tier
 * label is the primary glossaried term tested in T019.
 */
export function StrategyDetail({ strategy, className }: StrategyDetailProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">{strategy.name}</h2>
        <p className="text-sm text-muted-foreground">{strategy.shortDescription}</p>
        <div className="flex items-center gap-1.5 pt-1 text-sm">
          <span className="text-muted-foreground">Risk tier:</span>
          <GlossaryTerm term={strategy.riskTier} className="font-medium capitalize" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <section aria-labelledby="alloc-heading" className="space-y-3">
          <h3 id="alloc-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Asset <GlossaryTerm term="allocation" />
          </h3>
          <AllocationDonut allocations={strategy.allocations} />
        </section>

        <section aria-labelledby="suits-heading" className="space-y-1.5">
          <h3 id="suits-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Who this suits
          </h3>
          <p className="text-sm leading-relaxed">{strategy.whoItSuits}</p>
        </section>

        <section aria-labelledby="tradeoffs-heading" className="space-y-1.5">
          <h3 id="tradeoffs-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Trade-offs
          </h3>
          <p className="text-sm leading-relaxed">{strategy.tradeoffs}</p>
        </section>
      </CardContent>
    </Card>
  )
}
