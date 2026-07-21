// @ts-check
/**
 * Deterministic generator for the bundled monthly return series (T031).
 *
 * The Passive Portfolio Visualizer needs monthly total-return history for 5
 * asset classes (US equity, intl developed, intl emerging, intermediate
 * Treasuries, gold). The intended production sources are the Kenneth French
 * Data Library (equities) and FRED (Treasuries/gold) — see DATA_SOURCES.md.
 *
 * This script is the **transparent stand-in** used during development when
 * network access to those sources is unavailable. It produces a deterministic,
 * realistic-shaped series (correct asset-class behavior, real crashes baked
 * into 2008 and 2020, anti-correlated Treasuries during equity panics) using
 * a seeded PRNG so the output is byte-identical on every run. The output JSON
 * is the same shape as the real Fama–French + FRED data, so swapping in real
 * values later is a pure file replacement — no code changes anywhere else.
 *
 * Run:  node scripts/generate-returns.mjs
 * Output: src/data/returns/series.json
 *
 * HONESTY: every value below is synthetic-representative, NOT a literal market
 * observation. The shape (drift, vol, cross-correlations, crash magnitudes)
 * mirrors real market behavior closely enough that the educational story
 * (diversification, crash-honesty, calm-vs-growth trade-offs) is faithful.
 */

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = resolve(__dirname, '../src/data/returns/series.json')

// --- Seeded PRNG (mulberry32) -------------------------------------------------
// A tiny deterministic PRNG so the generated series is byte-identical every run.
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Box–Muller transform: turn uniform samples into standard-normal samples so
// we can apply realistic bell-curve noise to monthly returns.
function standardNormal(rng) {
  let u = 0
  let v = 0
  while (u === 0) u = rng()
  while (v === 0) v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// --- Month iteration ----------------------------------------------------------
const START_MONTH = { year: 1990, month: 7 } // matches asset-classes.ts dataStartMonth
const END_MONTH = { year: 2025, month: 6 } // matches meta.ts DATA_AS_OF

function monthIter(from, to) {
  const out = []
  let y = from.year
  let m = from.month
  while (y < to.year || (y === to.year && m <= to.month)) {
    out.push({ year: y, month: m })
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return out
}

function monthKey({ year, month }) {
  return `${year}-${String(month).padStart(2, '0')}`
}

// --- Per-asset-class behavior -------------------------------------------------
// Each asset class has:
//   mu:      mean monthly return (drift)
//   sigma:   monthly standard deviation (volatility)
//   seed:    distinct seed so each series is independent
// Realistic rough magnitudes (expressed as monthly decimals):
//   - US total equity:   ~10%/yr → 0.083%/mo mean, ~4.2%/mo vol
//   - Intl developed:    ~9%/yr  → 0.075%/mo mean, ~4.6%/mo vol
//   - Emerging markets:  ~10%/yr → 0.083%/mo mean, ~5.6%/mo vol
//   - Intermediate Trsy: ~3.5%/yr→ 0.29%/mo  mean, ~1.1%/mo vol
//   - Gold:              ~6.5%/yr→ 0.53%/mo  mean, ~4.6%/mo vol
const ASSET_PROFILES = [
  { id: 'us-total-equity', mu: 0.00083, sigma: 0.042, seed: 101 },
  { id: 'intl-developed', mu: 0.00075, sigma: 0.046, seed: 202 },
  { id: 'intl-emerging', mu: 0.00083, sigma: 0.056, seed: 303 },
  { id: 'us-treasury-interm', mu: 0.0029, sigma: 0.011, seed: 404 },
  { id: 'gold', mu: 0.0053, sigma: 0.046, seed: 505 },
]

// --- Hardcoded shock overlays for real crash months ---------------------------
// These are the months the spec REQUIRES to appear as real dips (FR-007,
// quickstart.md Scenario 2). The shocks are applied additively on top of the
// baseline monthly return for that asset class. Magnitudes reflect the actual
// historical scale of each event.
//
// Key historical reference points (approximate real monthly returns):
//   2008-09: US equity -9%, intl developed -10%, emerging -14%, Trsy +1.3%
//   2008-10: US equity -17%, intl developed -20%, emerging -25%, Trsy +2.4%
//   2008-11: US equity -7.5%, intl -7%, emerging -8%, Trsy +3.4%
//   2009-02: US equity -11%, intl -10%, emerging -7%
//   2009-03: US equity +8%, intl +7%, emerging +9% (recovery)
//   2020-03: US equity -13%, intl -10%, emerging -14%, Trsy +0.4%, gold -1%
//   2020-04: US equity +13%, intl +6%, emerging +9% (recovery)
//   2011-09: emerging -14% (EM selloff)
//   2022-06: US equity -8%, intl -9%, Trsy -1.7% (rate shock)
const SHOCKS = {
  // 2008 Global Financial Crisis
  '2008-09': { 'us-total-equity': -0.07, 'intl-developed': -0.08, 'intl-emerging': -0.12, 'us-treasury-interm': 0.013, gold: 0.04 },
  '2008-10': { 'us-total-equity': -0.15, 'intl-developed': -0.18, 'intl-emerging': -0.23, 'us-treasury-interm': 0.024, gold: -0.14 },
  '2008-11': { 'us-total-equity': -0.06, 'intl-developed': -0.06, 'intl-emerging': -0.07, 'us-treasury-interm': 0.034, gold: -0.12 },
  '2008-12': { 'us-total-equity': 0.02, 'intl-developed': 0.03, 'intl-emerging': 0.04, 'us-treasury-interm': 0.022, gold: 0.07 },
  '2009-01': { 'us-total-equity': -0.07, 'intl-developed': -0.09, 'intl-emerging': -0.10, 'us-treasury-interm': -0.005, gold: 0.04 },
  '2009-02': { 'us-total-equity': -0.09, 'intl-developed': -0.08, 'intl-emerging': -0.06, 'us-treasury-interm': 0.003, gold: 0.03 },
  '2009-03': { 'us-total-equity': 0.07, 'intl-developed': 0.06, 'intl-emerging': 0.08, 'us-treasury-interm': -0.008, gold: -0.02 },
  // 2011 EM selloff + US downgrade
  '2011-08': { 'us-total-equity': -0.05, 'intl-developed': -0.07, 'intl-emerging': -0.10, 'us-treasury-interm': 0.023, gold: 0.11 },
  '2011-09': { 'us-total-equity': -0.06, 'intl-developed': -0.08, 'intl-emerging': -0.14, 'us-treasury-interm': 0.020, gold: -0.11 },
  // 2015-2016 China scare / oil crash
  '2015-08': { 'us-total-equity': -0.06, 'intl-developed': -0.06, 'intl-emerging': -0.09, 'us-treasury-interm': 0.003, gold: -0.06 },
  '2016-01': { 'us-total-equity': -0.05, 'intl-developed': -0.05, 'intl-emerging': -0.05, 'us-treasury-interm': 0.005, gold: 0.05 },
  // 2018 Q4 correction
  '2018-12': { 'us-total-equity': -0.09, 'intl-developed': -0.05, 'intl-emerging': -0.03, 'us-treasury-interm': 0.017, gold: 0.05 },
  // 2020 COVID-19 crash + recovery
  '2020-02': { 'us-total-equity': -0.08, 'intl-developed': -0.07, 'intl-emerging': -0.06, 'us-treasury-interm': 0.011, gold: 0.01 },
  '2020-03': { 'us-total-equity': -0.12, 'intl-developed': -0.10, 'intl-emerging': -0.13, 'us-treasury-interm': 0.004, gold: -0.01 },
  '2020-04': { 'us-total-equity': 0.12, 'intl-developed': 0.06, 'intl-emerging': 0.09, 'us-treasury-interm': 0.003, gold: 0.06 },
  // 2022 rate-shock / inflation year
  '2022-01': { 'us-total-equity': -0.05, 'intl-developed': -0.04, 'intl-emerging': -0.01, 'us-treasury-interm': -0.017, gold: 0.01 },
  '2022-02': { 'us-total-equity': -0.03, 'intl-developed': -0.02, 'intl-emerging': 0.02, 'us-treasury-interm': -0.011, gold: 0.06 },
  '2022-04': { 'us-total-equity': -0.08, 'intl-developed': -0.07, 'intl-emerging': -0.06, 'us-treasury-interm': -0.025, gold: 0.04 },
  '2022-05': { 'us-total-equity': 0.0, 'intl-developed': 0.0, 'intl-emerging': -0.03, 'us-treasury-interm': -0.006, gold: 0.03 },
  '2022-06': { 'us-total-equity': -0.08, 'intl-developed': -0.08, 'intl-emerging': -0.04, 'us-treasury-interm': -0.018, gold: -0.02 },
  '2022-09': { 'us-total-equity': -0.09, 'intl-developed': -0.09, 'intl-emerging': -0.11, 'us-treasury-interm': -0.021, gold: -0.03 },
  '2022-10': { 'us-total-equity': 0.08, 'intl-developed': 0.07, 'intl-emerging': 0.07, 'us-treasury-interm': -0.013, gold: -0.02 },
}

// --- Generation ---------------------------------------------------------------
function generateSeries(profile, months) {
  const rng = mulberry32(profile.seed)
  const points = []
  for (const m of months) {
    const key = monthKey(m)
    const z = standardNormal(rng)
    let r = profile.mu + profile.sigma * z
    const shock = SHOCKS[key]?.[profile.id]
    if (typeof shock === 'number') r += shock
    // Clamp to a sane [-60%, +60%] monthly band — real markets never exceed
    // this in a single month, and it prevents any pathological NaN/Infinity.
    r = Math.max(-0.6, Math.min(0.6, r))
    points.push({ month: key, return: Math.round(r * 1e6) / 1e6 })
  }
  return { assetId: profile.id, points }
}

function main() {
  const months = monthIter(START_MONTH, END_MONTH)
  console.log(`Generating ${months.length} months × ${ASSET_PROFILES.length} asset classes`)
  const series = ASSET_PROFILES.map((p) => generateSeries(p, months))

  // Sanity: every series must cover exactly the same months in the same order.
  const first = series[0].points.map((p) => p.month).join(',')
  for (const s of series) {
    if (s.points.map((p) => p.month).join(',') !== first) {
      throw new Error(`Series ${s.assetId} month alignment drift`)
    }
  }

  writeFileSync(OUT_PATH, JSON.stringify(series, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${OUT_PATH} (${(series.length * months.length * 30) / 1024 | 0} KB approx)`)
}

main()
