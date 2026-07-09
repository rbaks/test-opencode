import { describe, it, expect } from 'vitest'
import { encodeState, decodeState } from '@/lib/url-state'
import type { ShareableState } from '@/types'

describe('encodeState', () => {
  it('produces a query string without a leading "?"', () => {
    const out = encodeState({ strategyId: '60-40', view: 'visualize' })
    expect(out.startsWith('?')).toBe(false)
    expect(out).toContain('s=60-40')
    expect(out).toContain('view=visualize')
  })

  it('returns an empty string for the empty state', () => {
    expect(encodeState({})).toBe('')
  })

  it('omits invalid values rather than emitting them', () => {
    const out = encodeState({
      strategyId: 'Not URL Safe!',
      amount: -50,
      from: 'bogus',
      view: 'nonsense' as never,
    })
    expect(out).toBe('')
  })

  it('caps the comparison set at 3 strategies', () => {
    const out = encodeState({
      compare: ['a', 'b', 'c', 'd', 'e'],
    })
    const decoded = decodeState(out)
    expect(decoded.compare).toHaveLength(3)
  })
})

describe('decodeState', () => {
  it('accepts a query with or without a leading "?"', () => {
    expect(decodeState('?s=60-40')).toEqual({ strategyId: '60-40' })
    expect(decodeState('s=60-40')).toEqual({ strategyId: '60-40' })
  })

  it('returns the empty state for an empty or blank query', () => {
    expect(decodeState('')).toEqual({})
    expect(decodeState('   ')).toEqual({})
  })

  it('is total and never throws on garbage input', () => {
    expect(() => decodeState('???&&&')).not.toThrow()
    expect(() => decodeState('s=')).not.toThrow()
    expect(() => decodeState('a=abc')).not.toThrow()
    expect(decodeState('???&&&')).toEqual({})
  })

  it('parses every valid field', () => {
    const state = decodeState(
      '?s=60-40&a=10000&from=2000-01&to=2025-06&cmp=60-40,three-fund&view=compare&quiz=long.medium',
    )
    expect(state).toEqual({
      strategyId: '60-40',
      amount: 10000,
      from: '2000-01',
      to: '2025-06',
      compare: ['60-40', 'three-fund'],
      view: 'compare',
      quiz: { timeHorizon: 'long', riskComfort: 'medium' },
    })
  })

  it('drops invalid values silently (never throws)', () => {
    const state = decodeState(
      '?s=Bad Slug&a=-5&a=0&from=2000-13&to=95-06&view=fake&quiz=long.high.low&quiz=xx',
    )
    expect(state).toEqual({})
  })

  it('only accepts positive integer amounts', () => {
    expect(decodeState('a=10000').amount).toBe(10000)
    expect(decodeState('a=0').amount).toBeUndefined()
    expect(decodeState('a=-1').amount).toBeUndefined()
    expect(decodeState('a=1.5').amount).toBeUndefined()
    expect(decodeState('a=abc').amount).toBeUndefined()
  })

  it('validates the YYYY-MM month format and ranges', () => {
    expect(decodeState('from=2000-01').from).toBe('2000-01')
    expect(decodeState('from=2000-13').from).toBeUndefined()
    expect(decodeState('from=20-01').from).toBeUndefined()
    expect(decodeState('from=bogus').from).toBeUndefined()
  })

  it('deduplicates comparison ids', () => {
    const state = decodeState('cmp=60-40,60-40,three-fund')
    expect(state.compare).toEqual(['60-40', 'three-fund'])
  })

  it('rejects an invalid quiz enum pair', () => {
    expect(decodeState('quiz=long.extreme').quiz).toBeUndefined()
    expect(decodeState('quiz=forever.low').quiz).toBeUndefined()
    expect(decodeState('quiz=long').quiz).toBeUndefined()
  })
})

describe('round-trip contract: decode(encode(state)) === state', () => {
  const cases: ShareableState[] = [
    {},
    { strategyId: '60-40' },
    { amount: 10000 },
    { from: '2000-01', to: '2025-06' },
    { view: 'compare' },
    { compare: ['60-40', 'three-fund'] },
    { compare: ['all-equity', 'growth-tilt', 'conservative-income'] },
    { quiz: { timeHorizon: 'long', riskComfort: 'medium' } },
    {
      strategyId: 'three-fund',
      amount: 5000,
      from: '2000-01',
      to: '2025-06',
      compare: ['60-40', 'three-fund'],
      view: 'visualize',
      quiz: { timeHorizon: 'short', riskComfort: 'low' },
    },
  ]

  for (const [i, state] of cases.entries()) {
    it(`round-trips case ${i}: ${JSON.stringify(state)}`, () => {
      const roundTripped = decodeState(encodeState(state))
      expect(roundTripped).toEqual(state)
    })
  }
})
