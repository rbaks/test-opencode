/**
 * The glossary — the single source of truth for every financial term used in
 * the UI (FR-003 term-coverage rule). A "financial term" is any word, phrase,
 * or acronym relating to investing, markets, or portfolio mechanics that is not
 * everyday common vocabulary. Every term rendered anywhere in the app (chart
 * axes, metric labels, tooltips, button labels, body copy) MUST have an entry
 * here AND an inline on-demand definition at its point of use.
 *
 * Acceptance bar: zero undefined acronyms or un-glossaried financial terms
 * across the core flow (explore → visualize → compare → recommend).
 *
 * Definitions are intentionally written for a true beginner — plain words,
 * short, one idea each.
 */
export interface GlossaryEntry {
  /** The display form of the term, e.g. "CAGR" or "drawdown". */
  term: string
  /** A one-line beginner-friendly definition. */
  definition: string
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  'asset class': {
    term: 'asset class',
    definition:
      'A broad category of investments that behave similarly — mainly stocks, bonds, and commodities like gold. Spreading money across classes is how you diversify.',
  },
  stock: {
    term: 'stock',
    definition:
      'A small ownership slice of a single company. When you own stock, you own a tiny piece of that business and share in its profits and losses.',
  },
  stocks: {
    term: 'stocks',
    definition:
      'Ownership slices of companies. "Stocks" and "equities" mean the same thing — when you own them, you own pieces of the underlying businesses.',
  },
  equity: {
    term: 'equity',
    definition:
      'Another word for stock ownership. "Equities" and "stocks" mean the same thing — owning a slice of a company.',
  },
  equities: {
    term: 'equities',
    definition:
      'Another word for stocks. "Equities" and "stocks" mean the same thing — owning slices of companies.',
  },
  bond: {
    term: 'bond',
    definition:
      'An IOU: you lend money to a company or government for a set time and they pay you regular interest, then return your original money.',
  },
  bonds: {
    term: 'bonds',
    definition:
      'IOUs issued by companies or governments. You lend money, they pay you interest, then return your original amount. Generally steadier than stocks.',
  },
  treasury: {
    term: 'Treasury',
    definition:
      'A bond issued by the US government — considered one of the safest investments because it is backed by the US government’s ability to tax and pay.',
  },
  treasuries: {
    term: 'Treasuries',
    definition:
      'Bonds issued by the US government. Considered among the safest bonds because they are backed by the US government.',
  },
  'fixed income': {
    term: 'fixed income',
    definition:
      'Investments that pay a set stream of interest, mainly bonds. The name comes from the predictable, "fixed" interest payments.',
  },
  commodity: {
    term: 'commodity',
    definition:
      'A physical good traded in bulk — like gold, oil, or grain. Gold is the commodity used in this app.',
  },
  gold: {
    term: 'gold',
    definition:
      'A precious metal held as a physical asset. It tends to move differently than stocks and bonds, so it can act as a shock absorber.',
  },
  'us total stock market': {
    term: 'US Total Stock Market',
    definition:
      'Nearly every publicly traded US company rolled into one — a way to own a small slice of the whole US market at once.',
  },
  'international developed stocks': {
    term: 'International Developed Stocks',
    definition:
      'Stocks of large companies in wealthy non-US countries — Japan, the UK, Germany, France, and similar.',
  },
  'emerging-market stocks': {
    term: 'Emerging-Market Stocks',
    definition:
      'Stocks from faster-growing economies like China, India, Brazil, and South Korea. Higher potential growth, but higher risk and bigger swings.',
  },
  'us intermediate treasuries': {
    term: 'US Intermediate Treasuries',
    definition:
      'US government bonds lasting roughly five years. Safe and steady, used here as the bond ingredient in most strategies.',
  },
  'emerging markets': {
    term: 'emerging markets',
    definition:
      'Faster-growing economies such as China, India, and Brazil. Their stocks offer higher potential growth but come with bigger swings and bigger risks.',
  },
  portfolio: {
    term: 'portfolio',
    definition:
      'The full collection of investments you hold. A portfolio mixes asset classes (stocks, bonds, gold) in chosen proportions.',
  },
  allocation: {
    term: 'allocation',
    definition:
      'How your money is divided among investments — for example "60% stocks, 40% bonds" is an allocation. It is the recipe for a portfolio.',
  },
  strategy: {
    term: 'strategy',
    definition:
      'A named, predefined portfolio recipe — a fixed mix of asset classes designed for a particular goal or risk level.',
  },
  rebalance: {
    term: 'rebalance',
    definition:
      'Returning a portfolio to its target mix after values drift. If stocks grow too big, you sell some and buy bonds to restore the original recipe.',
  },
  rebalancing: {
    term: 'rebalancing',
    definition:
      'The act of returning a portfolio to its target mix after values drift. This app rebalances monthly — resetting to the recipe at the start of each month.',
  },
  'monthly rebalance': {
    term: 'monthly rebalance',
    definition:
      'Resetting the portfolio back to its target recipe at the start of every month, so the mix never drifts far from the intended percentages.',
  },
  return: {
    term: 'return',
    definition:
      'How much an investment gained or lost over a period, shown as a percentage or dollar amount. A return of +10% means it grew by a tenth.',
  },
  'total return': {
    term: 'total return',
    definition:
      'The full gain or loss including both price changes and any dividends or interest paid out, as if you had reinvested every payout.',
  },
  dividend: {
    term: 'dividend',
    definition:
      'A share of a company’s profits paid out to its shareholders in cash. Total-return figures assume you reinvest dividends back into more shares.',
  },
  backtest: {
    term: 'backtest',
    definition:
      'Replaying a strategy over real historical data to see how it would have performed. A backtest shows the past, not a prediction of the future.',
  },
  growth: {
    term: 'growth',
    definition:
      'How much your money increased in value over time. In investing, "growth" almost always means the percentage or dollar rise of an investment.',
  },
  'total growth': {
    term: 'total growth',
    definition:
      'How much your money grew (or shrank) over the whole chosen period — the ending value minus the starting amount, also shown as a percentage.',
  },
  'annualized return': {
    term: 'annualized return',
    definition:
      'The steady yearly growth rate that would have produced your total result. It smooths the bumpy years into one comparable per-year number.',
  },
  cagr: {
    term: 'CAGR',
    definition:
      'Compound Annual Growth Rate — the steady yearly rate that would have grown your starting money to the ending value. It is the honest "average" return, never a simple mean.',
  },
  'compound annual growth rate': {
    term: 'compound annual growth rate',
    definition:
      'The steady yearly rate that would have grown your starting money to the ending value, with each year’s gains building on the last. Also called CAGR.',
  },
  volatility: {
    term: 'volatility',
    definition:
      'How much an investment’s value swings up and down. Higher volatility means a bumpier ride with wider gains and losses; lower means steadier.',
  },
  'standard deviation': {
    term: 'standard deviation',
    definition:
      'A number that measures how spread out a set of values is. For returns, it is the math behind "volatility" — bigger means wider swings.',
  },
  drawdown: {
    term: 'drawdown',
    definition:
      'The drop from a recent peak to the lowest point that follows it, before a new high is reached. It measures how far down you went at your worst moment.',
  },
  'max drawdown': {
    term: 'max drawdown',
    definition:
      'The single worst peak-to-trough drop observed over the whole period — the deepest hole your portfolio fell into before climbing back out.',
  },
  'worst drawdown': {
    term: 'worst drawdown',
    definition:
      'The largest peak-to-trough drop over the whole period — the deepest hole the portfolio fell into before recovering. Shown as a loss, never softened.',
  },
  'peak-to-trough': {
    term: 'peak-to-trough',
    definition:
      'Measured from a high point straight down to the lowest point after it. The size of that fall is the drawdown.',
  },
  risk: {
    term: 'risk',
    definition:
      'The chance and size of losing money. In this app, "risk" is measured by volatility (how wildly values swing) and by the worst drawdown.',
  },
  'risk tier': {
    term: 'risk tier',
    definition:
      'A label — conservative, balanced, or aggressive — describing how much up-and-down a strategy is built to accept, from calm to wild.',
  },
  conservative: {
    term: 'conservative',
    definition:
      'A risk tier favoring stability and small drops over growth. Conservative strategies hold more bonds and fewer stocks.',
  },
  balanced: {
    term: 'balanced',
    definition:
      'A risk tier that mixes stocks and bonds to pursue growth while softening drops — the middle path between calm and aggressive.',
  },
  aggressive: {
    term: 'aggressive',
    definition:
      'A risk tier favoring maximum growth by holding mostly stocks. Aggressive strategies rise the most in good times and fall the hardest in bad ones.',
  },
  diversification: {
    term: 'diversification',
    definition:
      'Spreading money across different investments so no single one dominates your results. The goal: smoother overall performance.',
  },
  proxy: {
    term: 'proxy',
    definition:
      'A stand-in used when the ideal data is not available. In this app, intermediate Treasuries proxy for the broader bond market — and it is labeled plainly.',
  },
  'intermediate-treasury proxy': {
    term: 'intermediate-Treasury proxy',
    definition:
      'Because no clean public-domain bond-market series exists, this app uses roughly-five-year US Treasuries to stand in for bonds. Disclosed openly as a known limitation.',
  },
  vintage: {
    term: 'vintage',
    definition:
      'The date the bundled data was collected — like a "best before" snapshot. Older data is still useful for long-horizon learning but is not current.',
  },
  'french data library': {
    term: 'French Data Library',
    definition:
      'A free, widely-used academic dataset maintained by Professor Kenneth French at Dartmouth. The source for the stock returns in this app.',
  },
  fred: {
    term: 'FRED',
    definition:
      'Federal Reserve Economic Data — a free public database from the St. Louis Fed. The source for the Treasury and gold data in this app.',
  },
  'shareable link': {
    term: 'shareable link',
    definition:
      'A web address that contains your current choices encoded inside it. Anyone who opens it sees exactly your view — nothing is stored on a server.',
  },
  'time horizon': {
    term: 'time horizon',
    definition:
      'How long you expect to invest before needing the money. Short means under 5 years, medium 5–15, long over 15. Longer horizons can afford more risk.',
  },
  'risk comfort': {
    term: 'risk comfort',
    definition:
      'How much of a drop you can emotionally tolerate without panic-selling. Low means you want a calm ride; high means you can stomach big swings.',
  },
  dollar: {
    term: 'dollar',
    definition: 'US dollars — the currency all amounts are shown in throughout this app.',
  },
}

const NORMALIZED_GLOSSARY: Map<string, GlossaryEntry> = new Map(
  Object.entries(GLOSSARY).map(([key, entry]) => [key.toLowerCase(), entry]),
)

/**
 * Look up a glossary entry by its term (case-insensitive). Returns undefined
 * when the term is not financial / not catalogued.
 */
export function lookupGlossary(term: string): GlossaryEntry | undefined {
  return NORMALIZED_GLOSSARY.get(term.trim().toLowerCase())
}
