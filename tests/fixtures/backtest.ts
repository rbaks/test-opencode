import type { AssetCategoryId, ReturnSeries, Strategy } from '@/types'

/**
 * Tiny synthetic fixtures for backtest/metrics unit tests.
 *
 * The full bundled series (src/data/returns) covers 420 months × 5 asset
 * classes — great for the honesty/integration tests but far too large to
 * hand-verify. These tiny series are deterministic and small enough that a
 * reviewer can compute the expected growth by hand:
 *
 *   month   asset-A return   asset-B return
 *   2024-01    +10%             +0%
 *   2024-02    -50%             +0%
 *   2024-03    +20%             +0%
 *
 * A strategy weighted 60% A / 40% B therefore has monthly portfolio returns
 * of `+6%`, `-30%`, `+12%`. Starting at $1000:
 *   end of 2024-01: $1000 × 1.06 = $1060
 *   end of 2024-02: $1060 × 0.70 = $742
 *   end of 2024-03: $742 × 1.12 = $831.04
 *
 * Total growth = (831.04 / 1000) - 1 = -0.16896  (a loss)
 * Max drawdown = 1 - 742/1060 = -0.30  (30% peak-to-trough)
 *
 * The integration tests in backtest.test.ts also exercise the REAL bundled
 * series to assert that 2008/2020 dips appear honestly (FR-007).
 */

export const FIXTURE_ASSET_IDS: AssetCategoryId[] = ['us-total-equity', 'us-treasury-interm']

/** Synthetic 60/40 strategy on the two fixture asset classes. */
export const FIXTURE_STRATEGY: Strategy = {
  id: 'fixture-60-40',
  name: 'Fixture 60/40',
  shortDescription: 'Tiny fixture strategy.',
  whoItSuits: 'Tests only.',
  tradeoffs: 'Tests only.',
  riskTier: 'balanced',
  earliestStartMonth: '2024-01',
  allocations: [
    { assetId: 'us-total-equity', weight: 0.6 },
    { assetId: 'us-treasury-interm', weight: 0.4 },
  ],
}

/** Three-month fixture: asset A swings wildly, asset B is flat. */
export const FIXTURE_SERIES: Record<AssetCategoryId, ReturnSeries> = {
  'us-total-equity': {
    assetId: 'us-total-equity',
    points: [
      { month: '2024-01', return: 0.1 },
      { month: '2024-02', return: -0.5 },
      { month: '2024-03', return: 0.2 },
    ],
  },
  'us-treasury-interm': {
    assetId: 'us-treasury-interm',
    points: [
      { month: '2024-01', return: 0.0 },
      { month: '2024-02', return: 0.0 },
      { month: '2024-03', return: 0.0 },
    ],
  },
  // The remaining asset ids are part of the union but unused in the fixture.
  // They are present only so the object literal matches the Record type.
  'intl-developed': { assetId: 'intl-developed', points: [] },
  'intl-emerging': { assetId: 'intl-emerging', points: [] },
  gold: { assetId: 'gold', points: [] },
}
