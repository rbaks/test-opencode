import { DISCLAIMER_CORE_NOTICE, DATA_VINTAGE_LABEL } from '@/data/meta'
import { DisclaimerCollapsible } from '@/components/Disclaimer'

/**
 * The persistent, always-visible footer (FR-011). The core notice ("educational,
 * not financial advice; past performance does not guarantee future results")
 * plus the data source and vintage stays visible on every view by default — it
 * is never hidden behind a click or reduced to a popover. The detailed
 * methodology lives in the collapsible disclosure below it.
 */
export function AppFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto max-w-6xl space-y-3 px-4 py-4">
        <p className="text-xs font-medium text-foreground">
          {DISCLAIMER_CORE_NOTICE}{' '}
          <span className="font-normal text-muted-foreground">Data {DATA_VINTAGE_LABEL}.</span>
        </p>
        <DisclaimerCollapsible />
      </div>
    </footer>
  )
}
