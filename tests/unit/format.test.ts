import { describe, it, expect } from 'vitest'
import { formatPercent, formatCurrency, formatMonth } from '@/lib/format'

/**
 * T028 — The format helpers are locale-stable (en-US, USD, fixed shapes).
 *
 * Locale-stable means: the output must be byte-identical regardless of the
 * host's runtime locale or time zone. A test written in one region must pass
 * on every CI runner. These tests pin the exact strings so a regression that
 * silently picks up the host locale (e.g. via `Intl.NumberFormat()` with no
 * explicit `locales` argument) will fail loudly.
 */
describe('T028 — formatPercent', () => {
  it('formats positive decimals with a leading + and one decimal place', () => {
    expect(formatPercent(0.42)).toBe('+42.0%')
    expect(formatPercent(0.05)).toBe('+5.0%')
    expect(formatPercent(1)).toBe('+100.0%')
  })

  it('formats negative decimals with a leading - and one decimal place', () => {
    expect(formatPercent(-0.183)).toBe('-18.3%')
    expect(formatPercent(-0.5)).toBe('-50.0%')
    expect(formatPercent(-1)).toBe('-100.0%')
  })

  it('formats zero with no sign', () => {
    expect(formatPercent(0)).toBe('0.0%')
  })

  it('returns a stable fallback for non-finite input (never throws, never NaN)', () => {
    expect(formatPercent(Number.NaN)).toBe('—')
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe('—')
    expect(formatPercent(Number.NEGATIVE_INFINITY)).toBe('—')
  })
})

describe('T028 — formatCurrency', () => {
  it('formats positive USD with thousands separators and no decimals', () => {
    expect(formatCurrency(10000)).toBe('$10,000')
    expect(formatCurrency(14200.4)).toBe('$14,200') // rounds to nearest, not truncates
    expect(formatCurrency(14200.6)).toBe('$14,201')
    expect(formatCurrency(999)).toBe('$999')
    expect(formatCurrency(1234567)).toBe('$1,234,567')
  })

  it('formats negative USD with a leading minus', () => {
    expect(formatCurrency(-10000)).toBe('-$10,000')
    expect(formatCurrency(-1)).toBe('-$1')
  })

  it('formats zero as $0', () => {
    expect(formatCurrency(0)).toBe('$0')
  })

  it('returns a stable fallback for non-finite input', () => {
    expect(formatCurrency(Number.NaN)).toBe('—')
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe('—')
  })

  it('never produces locale-dependent separators (no spaces, no dots for thousands)', () => {
    // A European locale would render 10000 as "10.000" or "10 000". Pin en-US.
    expect(formatCurrency(1000000)).toMatch(/^\$\d{1,3}(,\d{3})*$/)
  })
})

describe('T028 — formatMonth', () => {
  it('formats YYYY-MM as "Mon YYYY"', () => {
    expect(formatMonth('2000-01')).toBe('Jan 2000')
    expect(formatMonth('2025-06')).toBe('Jun 2025')
    expect(formatMonth('1990-12')).toBe('Dec 1990')
  })

  it('handles every month index 01..12', () => {
    const expected = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    expected.forEach((name, i) => {
      const mm = String(i + 1).padStart(2, '0')
      expect(formatMonth(`2000-${mm}`)).toBe(`${name} 2000`)
    })
  })

  it('returns the input unchanged for malformed months (never throws)', () => {
    expect(formatMonth('')).toBe('')
    expect(formatMonth('2000')).toBe('2000')
    expect(formatMonth('2000-13')).toBe('2000-13') // invalid month index
    expect(formatMonth('bogus')).toBe('bogus')
  })
})
