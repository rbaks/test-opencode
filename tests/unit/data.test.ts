import { describe, it, expect } from 'vitest'
import { ASSET_CLASSES } from '@/data/asset-classes'
import { STRATEGIES } from '@/data/strategies'
import {
  isUrlSafeSlug,
  allocationsSumToOne,
  validateStrategies,
  validateAssetClasses,
  assertDatasetValid,
} from '@/data/validate'
import type { Strategy } from '@/types'

describe('isUrlSafeSlug', () => {
  it('accepts lowercase letters, digits, and hyphens', () => {
    expect(isUrlSafeSlug('60-40')).toBe(true)
    expect(isUrlSafeSlug('three-fund')).toBe(true)
    expect(isUrlSafeSlug('a1-b2')).toBe(true)
  })

  it('rejects uppercase, spaces, slashes, and special chars', () => {
    expect(isUrlSafeSlug('60/40')).toBe(false)
    expect(isUrlSafeSlug('Three Fund')).toBe(false)
    expect(isUrlSafeSlug('CAPS')).toBe(false)
    expect(isUrlSafeSlug('')).toBe(false)
    expect(isUrlSafeSlug('has_underscore')).toBe(false)
  })
})

describe('allocationsSumToOne', () => {
  it('returns true when weights sum to exactly 1.0', () => {
    expect(allocationsSumToOne([0.6, 0.4])).toBe(true)
    expect(allocationsSumToOne([0.2, 0.2, 0.6])).toBe(true)
  })

  it('tolerates floating-point drift within epsilon', () => {
    expect(allocationsSumToOne([1 / 3, 1 / 3, 1 / 3])).toBe(true)
  })

  it('returns false when weights do not sum to 1.0', () => {
    expect(allocationsSumToOne([0.5, 0.4])).toBe(false)
    expect(allocationsSumToOne([0.7, 0.6])).toBe(false)
    expect(allocationsSumToOne([1.0, 0.1])).toBe(false)
  })
})

describe('bundled asset classes (T007)', () => {
  it('contains exactly 5 asset-class records', () => {
    expect(ASSET_CLASSES).toHaveLength(5)
  })

  it('all asset-class data starts at a valid YYYY-MM month', () => {
    for (const a of ASSET_CLASSES) {
      expect(a.dataStartMonth).toMatch(/^\d{4}-\d{2}$/)
    }
  })

  it('has unique asset-class ids', () => {
    validateAssetClasses(ASSET_CLASSES) // throws on duplicate/invalid
  })
})

describe('bundled strategies (T008)', () => {
  it('contains exactly 6 strategy recipes', () => {
    expect(STRATEGIES).toHaveLength(6)
  })

  it('every strategy id is URL-safe and unique', () => {
    const ids = STRATEGIES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(isUrlSafeSlug(id)).toBe(true)
  })

  it('every strategy allocation weights sum to 1.0', () => {
    for (const s of STRATEGIES) {
      expect(
        allocationsSumToOne(s.allocations.map((a) => a.weight)),
        `${s.id} weights must sum to 1.0`,
      ).toBe(true)
    }
  })

  it('every allocation references a real asset class', () => {
    const known = new Set(ASSET_CLASSES.map((a) => a.id))
    for (const s of STRATEGIES) {
      for (const alloc of s.allocations) {
        expect(known.has(alloc.assetId), `${s.id} references unknown ${alloc.assetId}`).toBe(true)
      }
    }
  })

  it('every earliestStartMonth equals the latest component dataStartMonth', () => {
    const startById = new Map(ASSET_CLASSES.map((a) => [a.id, a.dataStartMonth]))
    for (const s of STRATEGIES) {
      const latest = s.allocations.reduce<string>((max, alloc) => {
        const m = startById.get(alloc.assetId) ?? ''
        return m > max ? m : max
      }, '')
      expect(s.earliestStartMonth).toBe(latest)
    }
  })
})

describe('validateStrategies', () => {
  const knownIds = ASSET_CLASSES.map((a) => a.id)

  it('returns no errors for the real bundled dataset', () => {
    expect(validateStrategies(STRATEGIES, knownIds)).toEqual([])
  })

  it('flags weights that do not sum to 1.0', () => {
    const bad: Strategy = {
      id: 'bad-weights',
      name: 'Bad',
      shortDescription: 'x',
      whoItSuits: 'x',
      tradeoffs: 'x',
      riskTier: 'balanced',
      allocations: [
        { assetId: 'us-total-equity', weight: 0.5 },
        { assetId: 'us-treasury-interm', weight: 0.3 },
      ],
      earliestStartMonth: '1990-07',
    }
    const errors = validateStrategies([bad], knownIds)
    expect(errors.some((e) => e.includes('bad-weights'))).toBe(true)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('flags a non-URL-safe id', () => {
    const bad: Strategy = {
      id: 'Bad Slug',
      name: 'Bad',
      shortDescription: 'x',
      whoItSuits: 'x',
      tradeoffs: 'x',
      riskTier: 'balanced',
      allocations: [
        { assetId: 'us-total-equity', weight: 0.6 },
        { assetId: 'us-treasury-interm', weight: 0.4 },
      ],
      earliestStartMonth: '1990-07',
    }
    expect(validateStrategies([bad], knownIds).length).toBeGreaterThan(0)
  })

  it('flags duplicate ids', () => {
    const dup: Strategy = {
      id: '60-40',
      name: 'Dup',
      shortDescription: 'x',
      whoItSuits: 'x',
      tradeoffs: 'x',
      riskTier: 'balanced',
      allocations: [
        { assetId: 'us-total-equity', weight: 0.6 },
        { assetId: 'us-treasury-interm', weight: 0.4 },
      ],
      earliestStartMonth: '1990-07',
    }
    expect(validateStrategies([...STRATEGIES, dup], knownIds).length).toBeGreaterThan(0)
  })

  it('flags an allocation that references an unknown asset class', () => {
    const bad: Strategy = {
      id: 'unknown-asset',
      name: 'Bad',
      shortDescription: 'x',
      whoItSuits: 'x',
      tradeoffs: 'x',
      riskTier: 'balanced',
      allocations: [{ assetId: 'crypto' as never, weight: 1.0 }],
      earliestStartMonth: '1990-07',
    }
    expect(validateStrategies([bad], knownIds).length).toBeGreaterThan(0)
  })
})

describe('assertDatasetValid (build-time guard)', () => {
  it('does not throw for the shipped dataset', () => {
    expect(() => assertDatasetValid()).not.toThrow()
  })
})
