import { useId, type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { lookupGlossary } from '@/data/glossary'
import { cn } from '@/lib/utils'

interface GlossaryTermProps {
  /** The financial term to define (matched against the glossary, case-insensitive). */
  term: string
  /** Optional display text; defaults to the term itself. */
  children?: ReactNode
  className?: string
}

/**
 * Wraps a financial term in an on-demand definition (FR-003). The definition
 * appears in a Tooltip on hover AND on keyboard focus, so keyboard-only users
 * get the same help. Every financial term rendered in the app must be wrapped
 * by this component (or otherwise defined inline); the glossary is the single
 * source of truth for the term inventory.
 *
 * If a term has no glossary entry, it renders as plain text (the term-coverage
 * audit in Phase 7 catches any such gap so zero terms are left undefined).
 */
export function GlossaryTerm({ term, children, className }: GlossaryTermProps) {
  const entry = lookupGlossary(term)
  const contentId = useId()
  const display = children ?? term

  if (!entry) {
    return <>{display}</>
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            aria-describedby={contentId}
            className={cn(
              'cursor-help underline decoration-dotted decoration-muted-foreground/60 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm',
              className,
            )}
          >
            {display}
          </span>
        </TooltipTrigger>
        <TooltipContent id={contentId} className="max-w-xs">
          <span className="font-medium">{entry.term}: </span>
          {entry.definition}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
