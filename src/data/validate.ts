import { ASSET_CLASSES } from './asset-classes'
import { STRATEGIES } from './strategies'

/**
 * Build-time + runtime data-integrity checks (FR-014). The bundled dataset must
 * be validated before it ships: every strategy's allocation weights must sum to
 * 1.0, every id must be URL-safe and unique, and every allocation must reference
 * a known asset class. Any anomaly in the dataset itself fails loudly — never
 * ships silently.
 *
 * In plain words: these checks make sure each "recipe" adds up to 100% and that
 * every ingredient name is real and shareable in a link.
 */

/** Tolerance for floating-point drift when checking that weights sum to 1.0. */
export const WEIGHT_EPSILON = 1e-6

const SLUG_RE = /^[a-z0-9-]+$/

/** A slug is URL-safe when it is lowercase letters, digits, and hyphens only. */
export function isUrlSafeSlug(id: string): boolean {
  return id.length > 0 && SLUG_RE.test(id)
}

/** True when weights sum to 1.0 within a small floating-point epsilon. */
export function allocationsSumToOne(weights: number[], epsilon = WEIGHT_EPSILON): boolean {
  const sum = weights.reduce((acc, w) => acc + w, 0)
  return Math.abs(sum - 1) <= epsilon
}

/** Returns a list of human-readable error strings for the asset classes (empty = valid). */
export function validateAssetClasses(assetClasses: typeof ASSET_CLASSES): string[] {
  const errors: string[] = []
  const seen = new Set<string>()

  for (const a of assetClasses) {
    if (seen.has(a.id)) {
      errors.push(`Duplicate asset-class id: "${a.id}"`)
    }
    seen.add(a.id)
    if (!/^\d{4}-\d{2}$/.test(a.dataStartMonth)) {
      errors.push(`Asset class "${a.id}" has invalid dataStartMonth "${a.dataStartMonth}"`)
    }
  }
  return errors
}

/** Returns a list of human-readable error strings for the strategies (empty = valid). */
export function validateStrategies(
  strategies: readonly { id: string; allocations: { assetId: string; weight: number }[] }[],
  knownAssetIds: readonly string[],
): string[] {
  const errors: string[] = []
  const known = new Set(knownAssetIds)
  const seenIds = new Set<string>()

  for (const s of strategies) {
    if (!isUrlSafeSlug(s.id)) {
      errors.push(`Strategy id is not URL-safe: "${s.id}"`)
    }
    if (seenIds.has(s.id)) {
      errors.push(`Duplicate strategy id: "${s.id}"`)
    }
    seenIds.add(s.id)

    if (s.allocations.length === 0) {
      errors.push(`Strategy "${s.id}" has no allocations`)
    }
    for (const alloc of s.allocations) {
      if (!known.has(alloc.assetId)) {
        errors.push(`Strategy "${s.id}" references unknown asset class "${alloc.assetId}"`)
      }
      if (!(alloc.weight >= 0 && alloc.weight <= 1)) {
        errors.push(`Strategy "${s.id}" has out-of-range weight ${alloc.weight}`)
      }
    }
    if (!allocationsSumToOne(s.allocations.map((a) => a.weight))) {
      const sum = s.allocations.reduce((acc, a) => acc + a.weight, 0)
      errors.push(`Strategy "${s.id}" allocation weights sum to ${sum.toFixed(6)} (must be 1.0)`)
    }
  }
  return errors
}

/**
 * Asserts the entire shipped dataset is valid. Called at build time (and safe to
 * call at runtime as a guard). Throws with a combined message listing every
 * problem if anything is off.
 */
export function assertDatasetValid(): void {
  const assetErrors = validateAssetClasses(ASSET_CLASSES)
  const strategyErrors = validateStrategies(
    STRATEGIES,
    ASSET_CLASSES.map((a) => a.id),
  )
  const all = [...assetErrors, ...strategyErrors]
  if (all.length > 0) {
    throw new Error(
      `Bundled dataset failed integrity checks (FR-014):\n${all.map((e) => `  - ${e}`).join('\n')}`,
    )
  }
}
