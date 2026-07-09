import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { GlossaryTerm } from '@/components/GlossaryTerm'
import { DATA_REFRESH_CADENCE, DATA_SOURCE_SUMMARY, DATA_VINTAGE_LABEL } from '@/data/meta'

/**
 * The collapsible "how these numbers are computed" disclosure (FR-011). The
 * always-visible core notice lives in AppFooter; this is the detailed,
 * optional-on-demand methodology that discloses every material limitation:
 * rebalancing frequency, the bond proxy, the data source/vintage/refresh
 * cadence, and the comparison alignment rule.
 *
 * Rendered inside the footer and reusable from any output that affects the
 * numbers (each growth chart, metric panel, comparison, recommendation).
 */
export function DisclaimerCollapsible() {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          How these numbers are computed
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="text-xs leading-relaxed text-muted-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0">
        <div className="mt-2 space-y-2">
          <p>
            <strong className="font-medium text-foreground">Methodology:</strong> Backtests use
            monthly <GlossaryTerm term="total return">total returns</GlossaryTerm> with{' '}
            <GlossaryTerm term="monthly rebalance">monthly rebalancing</GlossaryTerm> back to each
            strategy’s target mix. Growth,{' '}
            <GlossaryTerm term="CAGR">annualized return</GlossaryTerm>,{' '}
            <GlossaryTerm term="volatility" />, and{' '}
            <GlossaryTerm term="max drawdown">worst drawdown</GlossaryTerm> are computed identically
            across every view so a number means the same thing wherever it appears.
          </p>
          <p>
            <strong className="font-medium text-foreground">Known limitation:</strong> There is no
            free public dataset for the whole bond market, so the bond portion uses{' '}
            <GlossaryTerm term="intermediate-treasury proxy">
              roughly-five-year US Treasuries
            </GlossaryTerm>{' '}
            as a labeled stand-in. This is stated openly, never hidden.
          </p>
          <p>
            <strong className="font-medium text-foreground">Data:</strong> {DATA_SOURCE_SUMMARY},{' '}
            {DATA_VINTAGE_LABEL}, {DATA_REFRESH_CADENCE}. See the full methodology in{' '}
            <code>src/data/DATA_SOURCES.md</code>.
          </p>
          <p>
            <strong className="font-medium text-foreground">Comparison alignment:</strong> When
            strategies start in different months, they are aligned on the latest common start month
            so every line covers the same span — and the comparison says so plainly.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** A compact, always-visible disclosure strip used by the footer. */
export function DisclaimerNotice() {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Separator orientation="vertical" className="hidden h-3 sm:block" />
      <DisclaimerCollapsible />
    </div>
  )
}
