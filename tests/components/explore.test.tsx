import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ExplorePanel } from '@/features/explore/ExplorePanel'
import { STRATEGIES } from '@/data/strategies'
import { getAssetClass } from '@/data/asset-classes'

/**
 * A tiny stateful wrapper that mirrors how the App shell drives ExplorePanel
 * (selected id + a setter). Keeps the component itself router-free so it can be
 * tested in isolation while still exercising the real click → select flow.
 */
function ExploreHarness({ initialSelected = null as string | null }) {
  const [selected, setSelected] = useState<string | null>(initialSelected)
  return <ExplorePanel selectedStrategyId={selected} onSelectStrategy={setSelected} />
}

describe('T017 — Explore gallery renders all 6 strategy cards', () => {
  it('shows every strategy name and short description', () => {
    render(<ExploreHarness />)

    for (const strategy of STRATEGIES) {
      expect(screen.getByText(strategy.name)).toBeInTheDocument()
      expect(screen.getByText(strategy.shortDescription)).toBeInTheDocument()
    }
  })

  it('renders exactly 6 selectable strategy cards', () => {
    render(<ExploreHarness />)
    for (const strategy of STRATEGIES) {
      expect(
        screen.getByRole('button', { name: (n) => n.includes(strategy.name) }),
      ).toBeInTheDocument()
    }
    // Each card is a button; with no detail shown yet there are exactly 6.
    expect(screen.getAllByRole('button')).toHaveLength(6)
  })
})

describe('T018 — Selecting a strategy renders the detail view', () => {
  it('shows the allocation breakdown, who-it-suits, and trade-offs after a click', async () => {
    const user = userEvent.setup()
    render(<ExploreHarness />)

    // Pick "60/40 Balanced" — its allocation has exactly two asset classes.
    const sixtyForty = STRATEGIES.find((s) => s.id === '60-40')!
    await user.click(screen.getByRole('button', { name: /60\/40 Balanced/i }))

    // Allocation breakdown: each asset class name + its percentage appears.
    for (const alloc of sixtyForty.allocations) {
      const asset = getAssetClass(alloc.assetId)
      expect(screen.getByText(asset.name)).toBeInTheDocument()
      const pct = Math.round(alloc.weight * 100)
      expect(screen.getByText(`${pct}%`)).toBeInTheDocument()
    }

    // "Who it suits" guidance.
    expect(screen.getByText(/who this suits/i)).toBeInTheDocument()
    expect(screen.getByText(sixtyForty.whoItSuits)).toBeInTheDocument()

    // Growth-vs-calmness trade-off.
    expect(screen.getByText(/trade-?offs/i)).toBeInTheDocument()
    expect(screen.getByText(sixtyForty.tradeoffs)).toBeInTheDocument()
  })
})

describe('T019 — A glossary term shows its plain-language definition on focus', () => {
  it('reveals the definition when a glossaried term receives keyboard focus', async () => {
    render(<ExploreHarness initialSelected="60-40" />)

    // The risk-tier label is wrapped in a GlossaryTerm: a focusable span.
    const sixtyForty = STRATEGIES.find((s) => s.id === '60-40')!
    const tierTerm = screen.getByText(sixtyForty.riskTier)
    expect(tierTerm).toHaveAttribute('tabindex', '0')

    // Keyboard-focus it (no pointer events — Radix Tooltip closes on pointerdown,
    // but opens on pure keyboard focus, which is what this test verifies).
    fireEvent.focus(tierTerm)

    // The plain-language definition appears as a tooltip.
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveTextContent(/risk tier/i)
  })
})
