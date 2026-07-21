/**
 * Pure display-formatting helpers (contracts/backtest.md §Display formatting).
 *
 * The headline numbers and the growth chart's value axis both render through
 * here. "Locale-stable" means the output is the same byte-for-byte on every
 * runtime regardless of the host's default locale or time zone — so a test
 * assertion written on a US developer's machine passes on a CI runner in
 * another region, and so a shared link opened anywhere in the world shows the
 * same currency / percent / month strings.
 *
 * The bundled data uses USD, en-US formatting, and 'YYYY-MM' month keys. These
 * functions never throw on bad input — they fall back to a readable raw form
 * so a malformed value never breaks rendering (FR-012).
 */

const MONTH_NAMES = [
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
] as const

const MONTH_RE = /^\d{4}-\d{2}$/

/**
 * Formats a decimal return/growth/drawdown as a signed percentage with one
 * decimal place. Example: `0.42` → `"+42.0%"`, `-0.183` → `"-18.3%"`.
 */
export function formatPercent(decimal: number): string {
  if (!Number.isFinite(decimal)) return '—'
  const pct = decimal * 100
  const sign = pct > 0 ? '+' : pct < 0 ? '' : '' // zero has no sign per convention
  return `${sign}${pct.toFixed(1)}%`
}

/**
 * Formats a USD amount with thousands separators and no decimal places.
 * Example: `10000` → `"$10,000"`, `14200.5` → `"$14,200"`.
 */
export function formatCurrency(usd: number): string {
  if (!Number.isFinite(usd)) return '—'
  const rounded = Math.round(usd)
  // Manual grouping so the output never depends on the host locale.
  const sign = rounded < 0 ? '-' : ''
  const digits = Math.abs(rounded).toString()
  const groups: string[] = []
  for (let i = digits.length; i > 0; i -= 3) {
    const start = Math.max(0, i - 3)
    groups.unshift(digits.slice(start, i))
  }
  return `${sign}$${groups.join(',')}`
}

/**
 * Formats a `'YYYY-MM'` month key as a short, readable month and year.
 * Example: `'2000-01'` → `"Jan 2000"`. Falls back to the raw input when the
 * shape is not recognized (never throws).
 */
export function formatMonth(month: string): string {
  if (!MONTH_RE.test(month)) return month
  const year = Number(month.slice(0, 4))
  const monthNum = Number(month.slice(5, 7))
  if (monthNum < 1 || monthNum > 12) return month
  const name = MONTH_NAMES[monthNum - 1]
  return name ? `${name} ${year}` : month
}
