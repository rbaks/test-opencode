import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { STRATEGIES } from '@/data/strategies'
import { cn } from '@/lib/utils'

/**
 * StrategyMultiSelect (T045) — pick 2–3 strategies to compare.
 *
 * The comparison view needs 2–3 strategies (US3 / SC-003). The control is a
 * grid of toggle buttons (one per strategy); pressed toggles show as chips
 * above the grid and are removed by clicking them again. The "compare 2–3"
 * limit is enforced: once 3 are selected, every other toggle is disabled
 * until the user removes one — so a beginner cannot accidentally try to
 * overlay 6 lines.
 *
 * The component is fully controlled: the parent owns the selected ids and
 * passes them down, so it stays in sync with the `cmp=` URL param and the
 * comparison chart never desyncs from the address bar.
 *
 * shadcn note: there is no Toggle primitive installed in this project, so we
 * compose the existing shadcn `Button` with `aria-pressed` — functionally
 * identical to a Toggle for selection state, and stays inside the
 * "shadcn to the maximum extent" rule (no custom widget, no new dependency).
 */

/** Hard cap on simultaneous comparisons (US3 spec — 2–3 strategies). */
export const MAX_COMPARE = 3
/** Minimum comparisons before the chart becomes meaningful. */
export const MIN_COMPARE = 2

interface StrategyMultiSelectProps {
  /** Currently-selected strategy ids (parent-owned). */
  selected: string[]
  /** Called with the next selection whenever a toggle changes. */
  onChange: (next: string[]) => void
  /** Optional className for the outer container. */
  className?: string
}

export function StrategyMultiSelect({
  selected,
  onChange,
  className,
}: StrategyMultiSelectProps) {
  const selectedSet = new Set(selected)
  const atLimit = selected.length >= MAX_COMPARE

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selected.filter((s) => s !== id))
      return
    }
    if (atLimit) return // enforced cap — the toggle is also disabled
    // Preserve STRATEGIES order so chips + lines stay stable as the user toggles.
    const next = STRATEGIES.filter((s) => selectedSet.has(s.id) || s.id === id).map((s) => s.id)
    onChange(next)
  }

  return (
    <section
      className={cn('space-y-3', className)}
      aria-label="Pick strategies to compare"
      data-testid="strategy-multi-select"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Comparing</span>
        {selected.length === 0 && (
          <span className="text-xs text-muted-foreground">
            Pick at least two strategies below.
          </span>
        )}
        {selected.map((id) => {
          const strategy = STRATEGIES.find((s) => s.id === id)
          return (
            <Badge key={id} variant="secondary" className="gap-1">
              {strategy?.name ?? id}
              <button
                type="button"
                aria-label={`Remove ${strategy?.name ?? id} from the comparison`}
                onClick={() => toggle(id)}
                className="ml-0.5 rounded-full text-muted-foreground transition-colors hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          )
        })}
        <span className="ml-auto text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {selected.length}/{MAX_COMPARE} selected
        </span>
      </div>

      <ul
        className="grid list-none grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
        role="group"
        aria-label="Available strategies"
      >
        {STRATEGIES.map((s) => {
          const isSelected = selectedSet.has(s.id)
          const disabled = !isSelected && atLimit
          return (
            <li key={s.id}>
              <Button
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                aria-pressed={isSelected}
                aria-disabled={disabled || undefined}
                disabled={disabled}
                onClick={() => toggle(s.id)}
                className={cn(
                  'flex h-auto w-full flex-col items-start gap-0.5 p-3 text-left',
                  isSelected && 'ring-2 ring-ring ring-offset-1 ring-offset-background',
                )}
              >
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {s.shortDescription}
                </span>
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
