/**
 * Human-readable metadata about the bundled dataset, sourced into the
 * always-visible disclaimer and the collapsible methodology (FR-011).
 *
 * In plain words: these are the short strings that tell a reader where the
 * numbers come from, when they were gathered, and how often they're refreshed.
 */

/** The "as-of" month for the bundled data vintage (YYYY-MM). */
export const DATA_AS_OF = '2025-06'

/** A human-readable vintage label, e.g. "as of June 2025". */
export const DATA_VINTAGE_LABEL = `as of June 2025`

/** How often the bundled dataset is refreshed (research.md §R-2). */
export const DATA_REFRESH_CADENCE = 'refreshed annually'

/** Short, human-readable list of the data sources. */
export const DATA_SOURCE_SUMMARY =
  'Kenneth French Data Library (Tuck / Dartmouth) and FRED (St. Louis Fed) — both free public datasets'

/** The always-visible core notice (FR-011): educational, not advice. */
export const DISCLAIMER_CORE_NOTICE =
  'Educational tool, not financial advice. Past performance does not guarantee future results.'
