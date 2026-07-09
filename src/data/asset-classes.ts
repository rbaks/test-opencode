import type { AssetClass, AssetCategoryId } from '@/types'

/**
 * The 5 bundled asset classes (the "ingredients" every strategy is built from).
 *
 * Each maps to one real-world public-domain data series. Sources and the
 * intermediate-Treasury proxy for the bond sleeve are documented in
 * DATA_SOURCES.md (per FR-011 and research.md §R-2). Vintage/as-of is also
 * surfaced in the in-app disclaimer.
 *
 * `dataStartMonth` is honored at run time: a strategy needing an asset class
 * whose data starts after the user's chosen start date is shortened to the
 * latest common start (with a plain-language warning) — never invented.
 */
export const ASSET_CLASSES: AssetClass[] = [
  {
    id: 'us-total-equity',
    name: 'US Total Stock Market',
    category: 'equity',
    dataSource:
      "Kenneth French Data Library — 'Mkt-RF' (CRSP value-weighted, dividends reinvested)",
    glossary:
      'A broad slice of the entire US stock market — think of it as owning a small piece of nearly every public company in the US at once.',
    dataStartMonth: '1990-07',
  },
  {
    id: 'intl-developed',
    name: 'International Developed Stocks',
    category: 'equity',
    dataSource: "Kenneth French Data Library — Developed ex US 'Mkt-RF'",
    glossary:
      'Stocks of large companies in developed countries outside the US — for example Japan, the UK, Germany, and France.',
    dataStartMonth: '1990-07',
  },
  {
    id: 'intl-emerging',
    name: 'Emerging-Market Stocks',
    category: 'equity',
    dataSource: "Kenneth French Data Library — Emerging Markets 5 Factors 'Mkt-RF'",
    glossary:
      'Stocks from faster-growing "emerging" economies — for example China, India, Brazil, and South Korea. Higher potential growth, higher risk.',
    dataStartMonth: '1990-07',
  },
  {
    id: 'us-treasury-interm',
    name: 'US Intermediate Treasuries',
    category: 'fixed-income',
    dataSource: 'Derived total return from FRED GS5 (5-year constant-maturity Treasury yield)',
    proxyNote:
      'Documented proxy for the bond sleeve: there is no clean public-domain monthly total-return series for US corporate/aggregate bonds, so intermediate Treasuries stand in for the whole bond allocation. Labeled plainly in the UI and disclaimer (FR-011).',
    glossary:
      'Loans you make to the US government for about 5 years that pay a fixed interest rate. Among the safest bonds because they are backed by the US government.',
    dataStartMonth: '1990-07',
  },
  {
    id: 'gold',
    name: 'Gold',
    category: 'commodity',
    dataSource: 'FRED GOLDAMGBD228NLBM (London PM gold fix)',
    glossary:
      'The precious metal held as a physical asset. Often used as a store of value that tends to move differently than stocks and bonds.',
    dataStartMonth: '1990-07',
  },
]

const ASSET_CLASS_MAP: ReadonlyMap<AssetCategoryId, AssetClass> = new Map(
  ASSET_CLASSES.map((a) => [a.id, a]),
)

export function getAssetClass(id: AssetCategoryId): AssetClass {
  const found = ASSET_CLASS_MAP.get(id)
  if (!found) {
    throw new Error(`Unknown asset class id: ${id}`)
  }
  return found
}

export function latestDataStartMonth(ids: AssetCategoryId[]): string {
  return ids.reduce((latest, id) => {
    const start = getAssetClass(id).dataStartMonth
    return start > latest ? start : latest
  }, '')
}
