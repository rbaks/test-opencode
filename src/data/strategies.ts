import type { Strategy } from '@/types'
import { latestDataStartMonth } from './asset-classes'

/**
 * The 6 predefined strategy recipes — covering the risk spectrum from
 * conservative to aggressive (FR-001: 5–7 archetypes). Each is a named
 * portfolio "recipe": the % of each asset class, plus plain-language guidance
 * on who it suits and its growth-versus-calmness trade-off.
 *
 * Every strategy's fixed-income allocation uses `us-treasury-interm` — the
 * documented proxy for the bond sleeve (research.md §R-2, DATA_SOURCES.md).
 * This is labeled plainly in the UI and disclaimer, never a silent swap.
 *
 * `earliestStartMonth` is derived (not hand-typed): the latest
 * `dataStartMonth` across the strategy's components, computed via
 * `latestDataStartMonth` so a strategy can never silently start before its
 * latest-arriving ingredient.
 */

function makeStrategy(s: Omit<Strategy, 'earliestStartMonth'>): Strategy {
  return {
    ...s,
    earliestStartMonth: latestDataStartMonth(s.allocations.map((a) => a.assetId)),
  }
}

export const STRATEGIES: Strategy[] = [
  makeStrategy({
    id: 'conservative-income',
    name: 'Conservative Income',
    shortDescription: 'Mostly bonds, a little stock — built to stay steady and avoid big drops.',
    whoItSuits:
      'Investors who will need the money within about 5 years, or who genuinely cannot stomach seeing their balance fall — stability matters more than growth here.',
    tradeoffs:
      'Calmest ride of the lineup: the smallest drops when markets panic. The cost is slow growth that may barely beat inflation over long stretches.',
    riskTier: 'conservative',
    allocations: [
      { assetId: 'us-total-equity', weight: 0.2 },
      { assetId: 'us-treasury-interm', weight: 0.8 },
    ],
  }),
  makeStrategy({
    id: '60-40',
    name: '60/40 Balanced',
    shortDescription: 'The classic mix: 60% stocks for growth, 40% bonds to soften the blows.',
    whoItSuits:
      'Investors with a 5–15 year horizon who want meaningful growth but can accept moderate drops along the way — the long-running "set and forget" benchmark.',
    tradeoffs:
      'Captures most of the stock market’s long-term growth while bonds cushion the worst dips. In rare stretches both fall together, so it is not drop-proof.',
    riskTier: 'balanced',
    allocations: [
      { assetId: 'us-total-equity', weight: 0.6 },
      { assetId: 'us-treasury-interm', weight: 0.4 },
    ],
  }),
  makeStrategy({
    id: 'three-fund',
    name: '3-Fund Portfolio',
    shortDescription:
      'US stocks, international stocks, and bonds — broad diversification at low cost.',
    whoItSuits:
      'Investors with a 5–15+ year horizon who want simple, broad diversification across the whole world without picking winners.',
    tradeoffs:
      'Spreads risk across US, international, and bonds so no single country drags you down. Slightly lower peak growth than an all-stock mix because bonds temper the upside.',
    riskTier: 'balanced',
    allocations: [
      { assetId: 'us-total-equity', weight: 0.5 },
      { assetId: 'intl-developed', weight: 0.2 },
      { assetId: 'us-treasury-interm', weight: 0.3 },
    ],
  }),
  makeStrategy({
    id: 'all-weather',
    name: 'All-Weather (simplified)',
    shortDescription:
      'Stocks, bonds, and gold spread to weather many different economic conditions.',
    whoItSuits:
      'Investors with a medium-to-long horizon who want a smoother ride across recessions, inflation, and market panics — diversification is the whole point.',
    tradeoffs:
      'Designed to hold up when stocks alone struggle (gold and bonds often zig when stocks zag). The steadier ride caps the very high-growth years an all-stock mix can have.',
    riskTier: 'balanced',
    allocations: [
      { assetId: 'us-total-equity', weight: 0.3 },
      { assetId: 'intl-developed', weight: 0.15 },
      { assetId: 'us-treasury-interm', weight: 0.4 },
      { assetId: 'gold', weight: 0.15 },
    ],
  }),
  makeStrategy({
    id: 'growth-tilt',
    name: 'Growth Tilt',
    shortDescription: 'Stock-heavy with emerging markets — chasing higher long-term growth.',
    whoItSuits:
      'Investors with a horizon well beyond 15 years who can ride out large drops in exchange for the highest realistic long-term growth.',
    tradeoffs:
      'Highest expected growth of the diversified mixes, led by emerging markets. Expect the steepest drops and longer waits for recovery when markets turn.',
    riskTier: 'aggressive',
    allocations: [
      { assetId: 'us-total-equity', weight: 0.5 },
      { assetId: 'intl-developed', weight: 0.25 },
      { assetId: 'intl-emerging', weight: 0.15 },
      { assetId: 'us-treasury-interm', weight: 0.1 },
    ],
  }),
  makeStrategy({
    id: 'all-equity',
    name: 'All-Equity (Global)',
    shortDescription: '100% stocks across the globe — maximum long-term growth, maximum bumpiness.',
    whoItSuits:
      'Investors with a horizon well beyond 15 years who need maximum growth and can tolerate the full force of market crashes without selling in fear.',
    tradeoffs:
      'The most growth over long decades, because every dollar is working in stocks. Also the wildest drops — in a bad crash it can lose far more than any other mix here.',
    riskTier: 'aggressive',
    allocations: [
      { assetId: 'us-total-equity', weight: 0.55 },
      { assetId: 'intl-developed', weight: 0.3 },
      { assetId: 'intl-emerging', weight: 0.15 },
    ],
  }),
]

const STRATEGY_MAP: ReadonlyMap<string, Strategy> = new Map(STRATEGIES.map((s) => [s.id, s]))

export function getStrategy(id: string): Strategy | undefined {
  return STRATEGY_MAP.get(id)
}

export const DEFAULT_STRATEGY_ID = STRATEGIES[0]?.id ?? ''
