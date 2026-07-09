import { useSearchParams } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppFooter } from '@/components/layout/AppFooter'
import { EmptyState } from '@/components/states'
import type { ViewKey } from '@/types'

const DEFAULT_VIEW: ViewKey = 'explore'

function resolveView(value: string | null): ViewKey {
  if (
    value === 'explore' ||
    value === 'visualize' ||
    value === 'compare' ||
    value === 'recommend'
  ) {
    return value
  }
  return DEFAULT_VIEW
}

/**
 * Placeholder panels for views not yet implemented. Each user story (Phases
 * 3–6) replaces its placeholder by wiring its feature panel into the shell.
 */
function PanelPlaceholder({ title, hint }: { title: string; hint: string }) {
  return <EmptyState title={title} description={hint} className="mx-auto max-w-2xl" />
}

function renderPanel(view: ViewKey) {
  switch (view) {
    case 'explore':
      return (
        <PanelPlaceholder
          title="Strategy library coming soon"
          hint="A gallery of six named strategies with plain-language breakdowns — the explore view lands next."
        />
      )
    case 'visualize':
      return (
        <PanelPlaceholder
          title="Backtest view coming soon"
          hint="Pick a strategy, an amount, and a period to see real historical growth and the four headline numbers."
        />
      )
    case 'compare':
      return (
        <PanelPlaceholder
          title="Comparison view coming soon"
          hint="Overlay two or three strategies on one chart with an aligned metrics table."
        />
      )
    case 'recommend':
      return (
        <PanelPlaceholder
          title="Recommendation view coming soon"
          hint="Answer two questions to get one recommended strategy with a plain-language why and a shareable link."
        />
      )
  }
}

export default function App() {
  const [searchParams, setSearchParams] = useSearchParams()
  const view = resolveView(searchParams.get('view'))

  const handleViewChange = (next: ViewKey) => {
    const params = new URLSearchParams(searchParams)
    params.set('view', next)
    setSearchParams(params, { replace: false })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader view={view} onViewChange={handleViewChange} />
      <main id="main" className="container mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {renderPanel(view)}
      </main>
      <AppFooter />
    </div>
  )
}
