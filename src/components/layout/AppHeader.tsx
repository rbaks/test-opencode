import { Button } from '@/components/ui/button'
import type { ViewKey } from '@/types'

interface ViewTab {
  key: ViewKey
  label: string
}

const TABS: ViewTab[] = [
  { key: 'explore', label: 'Explore' },
  { key: 'visualize', label: 'Visualize' },
  { key: 'compare', label: 'Compare' },
  { key: 'recommend', label: 'Recommend' },
]

interface AppHeaderProps {
  view: ViewKey
  onViewChange: (view: ViewKey) => void
}

/**
 * The persistent app header: a title plus a tabbed view switcher. The active
 * tab is marked with aria-current so screen readers and keyboard users can
 * follow it. Selecting a tab writes the choice to the `view` URL param (handled
 * by the shell), so the address bar always reflects the current panel.
 */
export function AppHeader({ view, onViewChange }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-bold tracking-tight">Passive Portfolio Visualizer</h1>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Understand passive investing
          </span>
        </div>
        <nav aria-label="Views" className="flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const active = tab.key === view
            return (
              <Button
                key={tab.key}
                variant={active ? 'default' : 'ghost'}
                size="sm"
                aria-current={active ? 'page' : undefined}
                onClick={() => onViewChange(tab.key)}
              >
                {tab.label}
              </Button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
