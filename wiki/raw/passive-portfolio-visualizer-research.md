# Research: Passive Portfolio Visualizer

**Branch**: `001-passive-portfolio-visualizer`
**Date**: 2026-07-09
**Status**: Phase 0 complete — all NEEDS CLARIFICATION resolved

This document records the technical decisions made during `/speckit.plan`
Phase 0. Each entry states the decision, why it was chosen, and what else was
considered. It exists so a future reader (human or agent) can understand *why*
the plan looks the way it does without re-deriving the research.

---

## Summary of decisions

| # | Question (NEEDS CLARIFICATION from spec) | Decision |
|---|---|---|
| R-1 | Architecture: backend or frontend-only? | **Static frontend SPA, no backend** |
| R-2 | Data source + refresh cadence | **Fama–French (equities) + FRED public-domain series (Treasuries/T-bill/gold/CPI); annual refresh** |
| R-3 | Backtest math (rebalance, metrics) | **Monthly total returns, monthly rebalance, CAGR / annualized volatility / max drawdown** |
| R-4 | Frontend stack | **React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui** |
| R-5 | Charting library | **TradingView Lightweight Charts v5** (constitution-mandated) |
| R-6 | Allocation visual (donut) | **shadcn/ui Chart donut (Recharts)** — categorical, outside the TradingView mandate |
| R-7 | Shareable-link state encoding | **Flat query params + `react-router` `useSearchParams`** |
| R-8 | State persistence | **None. URL is the only storage.** |
| R-9 | Testing stack | **Vitest + React Testing Library** |

---

## R-1 · Architecture: static frontend SPA, no backend

**Decision**: The app is a single static front-end single-page application.
There is **no server, no database, no API**. All computation (backtests,
metrics, recommendation lookup) runs in the browser. The historical dataset is
**bundled into the build as static JSON**.

**Rationale**: The spec forces this conclusion:
- FR-009: no account, no personal credentials, no brokerage/bank linking.
- Clarification (2026-07-09): "no account, no server-side storage."
- Clarification: the recommendation survives only via a "shareable read-only
  link (URL encodes the chosen strategy)."
- Assumption: "Stateless session — held in memory for the current session
  only, never persisted to the device or a server."

A backend would add an entire deployment surface (server, hosting, secrets,
uptime, GDPR/PII handling) to serve data that never needs to leave the client
and compute that is trivially fast in-browser. That violates the
constitution's "Simplicity first" principle. The bundled dataset is small
(see R-2 sizing), the backtest math is microseconds-scale, and a shareable
link replaces any need for server-side storage.

**Alternatives considered**:
- *Backend + database (full web service).* Rejected: no spec requirement for
  accounts, persistence, or multi-user data; adds operational complexity for
  zero product value. Would also introduce a PII surface that FR-009
  explicitly forbids.
- *Backend-less but with a live data API at runtime.* Rejected: the spec says
  the app must work offline-friendly (edge case: "Slow or offline connection")
  and must not show "a blank screen or raw error" (FR-012). Bundling the data
  makes the app work with zero network after first load and removes a runtime
  failure mode. A live API would also require key management (a secret the
  constitution forbids committing) and would reintroduce a backend.
- *Mobile native app.* Rejected: spec target is "usable on both desktop and
  mobile" via the web (FR-010); a responsive web app covers both at a fraction
  of the cost.

---

## R-2 · Data source: Fama–French + FRED (public domain), annual refresh

**Decision**: The bundled historical dataset is assembled from two
redistributable sources, with one documented proxy:

1. **Kenneth French Data Library** (Tuck / Dartmouth) — all **equity** asset
   classes, monthly **total returns** (dividends reinvested), back to 1926/1990.
   - US total stock market → market factor `Mkt-Rf` (CRSP value-weighted) —
     the standard proxy for a total-market index fund.
   - International developed ex-US → "Developed ex US" `Mkt-Rf`.
   - Emerging markets → "Emerging Markets 5 Factors" `Mkt-Rf`.
   - Risk-free rate → `Rf` (1-month T-bill).
   - URL: `https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html`
2. **FRED (St. Louis Fed)** — **fixed income + gold**, US-government
   public-domain series, daily/monthly, back to 1953–1962.
   - Intermediate Treasuries (yield) → `GS5` / `DGS5` (5-yr constant maturity).
   - Gold → `GOLDAMGBD228NLBM` (London PM fix).
   - URL: `https://fred.stlouisfed.org/`
3. **Documented proxy**: there is no clean public-domain monthly **total-return**
   series for US investment-grade corporate / aggregate bonds (those are
   commercial ICE/Bloomberg indices whose terms forbid redistribution, *even
   when mirrored on FRED*). The bond sleeve of bond-heavy strategies uses the
   **derived intermediate-Treasury total return** (computed from FRED `GS5`
   yields via the standard duration formula — see R-3) and is labeled as such
   in the UI and disclaimer.

**Refresh cadence**: **annual**. The dataset is a frozen snapshot bundled at
build time; the version/vintage is shown in the disclaimer (FR-011). A yearly
refresh is sufficient for an educational tool whose point is long-horizon
behavior, not daily tracking. (French and FRED both publish monthly within a
few weeks of month-end, so refresh-on-demand is possible later without
architectural change.)

**License posture**:
- FRED core data is US-government work → **public domain**, freely
  redistributable with attribution. This is the cleanest legal basis.
- French's library has **no explicit redistributable license** but is the
  universally-tolerated academic standard (the basis of essentially all modern
  asset-pricing research since the 1990s). We ship a `NOTICE` /
  `DATA_SOURCES.md` crediting French (Tuck/Dartmouth) and FRED (St. Louis Fed),
  and document the corporate-bond-proxy methodology. This is the conventional,
  low-risk path that academic backtesters have followed for 30 years.

**Bundle sizing**: monthly data over ~25 years (2000–present) for 5 series ≈
~300 points per series ≈ ~1.5k numeric points total. As compressed JSON this is
**well under 100 KB** — negligible against any reasonable bundle budget.

**Alternatives considered**:
- *Yahoo Finance / Tiingo / Stooq* (free-to-view price APIs). Rejected: their
  terms **prohibit redistribution** of the raw data feed; shipping them in a
  static app is a clear ToS violation.
- *Portfolio Visualizer.* Rejected: proprietary; its curated multi-asset
  dataset is explicitly off-limits for redistribution. (Useful only as an
  independent cross-check during development.)
- *Damodaran (NYU).* Rejected: **annual** granularity only — unusable for
  monthly backtests.
- *Shiller (Yale).* Not selected as primary: French's library already covers US
  total-market equity with explicit dividend reinvestment and broader coverage.
  Shiller is noted as an available independent cross-check for the S&P 500.
- *MSCI / S&P / Bloomberg-ICE commercial index feeds.* Rejected: paid licenses
  that forbid redistribution; out of scope for an educational tool.

**Rationale for the honest gap (corporate bonds)**: there is no single
canonical CC0/public-domain multi-asset monthly total-return dataset — the
academic standard is precisely the Fama–French + FRED stitch described above.
Accepting one documented proxy (intermediate-Treasury TR standing in for the
bond sleeve, clearly labeled) is the only way to stay both legal and
educationally honest. The disclaimer states this explicitly.

---

## R-3 · Backtest math

**Decision**: All backtests use **monthly total-return series** and
**monthly rebalancing** back to the strategy's target allocation. A run takes
a strategy, a starting amount, and a start/end month, and produces a monthly
growth series plus four headline metrics, each with a plain-language label.

**Computation rules** (all pure functions, fully unit-testable):

- **Rebalancing**: at the start of each month, redistribute the portfolio to
  the strategy's target weights. (Monthly is the conventional default and is
  simple to reason about; daily rebalancing adds noise without changing the
  educational story.)
- **Monthly return of the portfolio** = weighted sum of each asset class's
  monthly total return, using the target weights (post-rebalance).
- **Growth series**: cumulative value starting at the user's amount,
  compounded month by month. `V(t) = V(t-1) · (1 + r_portfolio(t))`.
- **Total growth (%)** = `(V_end / V_start) − 1`.
- **Annualized return (CAGR)** = `(V_end / V_start)^(12 / n_months) − 1`.
- **Annualized volatility** = standard deviation of monthly portfolio returns,
  × `√12` (the standard annualization from monthly data).
- **Max drawdown** = the largest peak-to-trough drop in the growth series,
  as a percentage: `max over t of (1 − V(t) / running_max(V up to t))`.

**Data-availability handling** (spec edge cases): if a chosen start date
predates a strategy's component data, the run is either shortened to the
latest common start (with a plain-language warning) or the strategy is
excluded — **never silently invent numbers** (FR-007, edge case
"Chosen period has missing data"). Comparisons align on the latest common
start month and say so plainly.

**Alternatives considered**:
- *Daily rebalancing.* Rejected: no educational benefit; multiplies data size
  ~21× for the same story.
- *No rebalancing (drift).* Rejected: drift makes "the strategy" ambiguous over
  long horizons and muddies the comparison story. Monthly rebalance keeps each
  strategy faithful to its stated recipe.
- *Time-weighted vs money-weighted returns.* Decision: time-weighted (CAGR) —
  there are no cash flows in or out during a run, so the distinction collapses.

---

## R-4 · Frontend stack: React + Vite + TypeScript + Tailwind + shadcn/ui

**Decision**:
- **React 18** + **Vite** (build/dev server) + **TypeScript** (strict).
- **Tailwind CSS** as the **only** styling layer (constitution-mandated).
- **shadcn/ui** for **every** UI primitive it provides (constitution-mandated
  "maximum usage").

**Rationale**:
- shadcn/ui is a React component system. Its canonical distribution is
  React + Tailwind + Vite. Choosing React is not a free choice here — it is
  the substrate the constitution's UI mandate implies.
- Vite gives sub-second dev feedback and a clean production build; it is the
  default React toolchain and pairs natively with Tailwind and shadcn/ui.
- TypeScript strict mode catches the kind of numeric/date mistakes (off-by-one
  months, mixed units) that silently corrupt a backtest.

**Component mapping** (verified against the live shadcn/ui registry at
`ui.shadcn.com/docs/components`):

| Surface (from spec) | shadcn/ui component |
|---|---|
| App header + disclaimer trigger | Navigation Menu + Button; disclaimer overlay = Dialog or Sheet |
| Strategy gallery (5–7 cards) | Card inside a Tailwind grid |
| Strategy detail (title/desc/suits) | Card + Typography |
| Allocation visual (R-6) | Chart (donut) or Progress bars |
| Inline glossary terms | Tooltip (hover **and** keyboard focus) |
| Starting amount + date range | Input Group (`$` addon) + Date Picker (Calendar caption dropdowns → month/year; constrained 2000→today) |
| Multi-select 2–3 strategies | Combobox `multiple` (with chips) or Toggle Group |
| Headline metrics panel | Card grid + Typography + Tooltip per metric |
| Comparison table | Table (TanStack Data Table only if sorting/pagination needed — it isn't) |
| Personalization quiz | Radio Group per question + Field + Label |
| Recommendation panel | Card (highlighted) + Button (copy link) + Sonner toast |
| Empty / loading / error / offline | Empty, Skeleton / Spinner, Alert (`destructive`) |
| Footer (disclaimer + data vintage) | **Custom** — semantic `<footer>` with Separator + Typography (shadcn ships no footer; this is expected) |

Every surface maps to a shadcn primitive except the footer (which is correctly
plain Tailwind layout). This satisfies "maximum shadcn/ui usage" literally.

**Alternatives considered**:
- *Vue / Svelte ports of shadcn.* Rejected: the canonical, best-maintained
  shadcn/ui is React; a port introduces drift and a smaller component surface.
- *Next.js.* Rejected: the app is a single static view with no SSR, no routing
  beyond query params, and no server. Next.js adds a framework for nothing.
  Plain Vite + React is the minimum.

---

## R-5 · Charting: TradingView Lightweight Charts v5 (constitution-mandated)

**Decision**: All **axis-based / time-series** charts use **TradingView
Lightweight Charts** `lightweight-charts` (v5.x). This is not a choice — it is
required by the constitution's "UI Technology & Professionalism Standards"
section (v1.2.0).

**Confirmed integration facts** (from official docs):
- **Version**: v5.2.0; **license**: Apache-2.0; **bundle**: ~30 KB (gzipped).
- **v5 API**: `chart.addSeries(LineSeries, opts)` — **not** the v3/v4
  `addLineSeries(...)`. Old tutorials must be updated; import the series
  definition (`LineSeries`, `AreaSeries`, `BaselineSeries`, `HistogramSeries`)
  alongside `createChart`.
- **React wrapper**: hand-rolled `useRef` + `useEffect`. Create the chart once,
  set `autoSize: true` (the library runs its own `ResizeObserver`), feed data
  via `series.setData(...)`, and **dispose with `chart.remove()`** in the
  effect cleanup to prevent canvas leaks. No official React adapter exists.
- **Series per need**:
  - Growth curve → **AreaSeries** (or LineSeries).
  - Comparison overlay (2–3 strategies) → **multiple LineSeries** sharing the
    time axis, each colored with a distinct `--chart-N` token.
  - Drawdown curve → **BaselineSeries** (`baseValue.price = 0`; two-color fill
    above/below) — purpose-built for "green above / red below."
- **Time format**: ISO date string (`'2024-01-01'`) for monthly data. No
  timezone math required (date-only data is timezone-safe per the docs).
  Data must be sorted ascending; duplicate timestamps are an error.
- **Theming to design tokens**: read shadcn CSS variables at runtime via
  `getComputedStyle(document.documentElement).getPropertyValue('--token')`,
  wrap HSL-component tokens with `hsl(...)`, and pass into
  `layout.background`, `layout.textColor`, `grid.vertLines.color`,
  `grid.horzLines.color`, `crosshair`, and per-series `color`. On theme change,
  re-apply with `chart.applyOptions(...)`.
- **Attribution**: Apache-2.0 requires crediting TradingView; the default
  `layout.attributionLogo` satisfies this.

**Accessibility (canvas caveat — constitution III, WCAG 2.1 AA)**: Lightweight
Charts renders to `<canvas>`, which is an opaque bitmap to assistive tech.
We pair every chart with a **visually-hidden (`sr-only`) data table / summary**
that mirrors the charted values (start, end, peak, trough, trend), plus
`role="img"` + `aria-label` on the container. This is the standard
canvas-chart a11y pattern and is mandatory here, not optional.

**Alternatives considered**: none permitted by the constitution (Chart.js,
Recharts, D3, Victory are all prohibited for time-series). See R-6 for the
single justified exception (the donut).

---

## R-6 · Allocation visual: shadcn/ui Chart donut (Recharts) — justified exception

**Decision**: The asset-allocation breakdown (FR-002, "percentage per asset
class") is rendered as a **donut via the shadcn/ui `chart` component**
(Recharts `<Pie innerRadius>`), themed through the chart-component's Tailwind
token integration. Fallback if bundle/print concerns ever matter: **Progress**
bars (one labeled bar per asset class).

**Why this is constitution-compliant**: the TradingView mandate is scoped to
"any data visualization plotting series **over an axis** (price, time-series,
financial, candlestick, line, area, histogram, bar)." A donut is **categorical**
— a single snapshot of % per category — with **no axis and no time dimension**.
TradingView Lightweight Charts does not support pie/donut at all, so this is a
genuine "library cannot express the chart type" case, which the constitution
explicitly permits **with justification in review**. This note is that
justification. Using shadcn/ui `chart` (Recharts) additionally honors
"maximum shadcn/ui usage" — it is the shadcn-preferred path for non-axis
charts.

**Alternatives considered**:
- *TradingView Lightweight Charts for the donut.* Rejected: the library has no
  pie/donut series; forcing it would both fail technically and misapply the
  mandate.
- *Hand-rolled SVG donut.* Rejected: reinvents what shadcn/ui `chart` already
  provides; violates "composition over reinvention."

---

## R-7 · Shareable link: flat query params + `react-router`

**Decision**: Shareable state lives in the **URL query string** as **flat
short-key params** (`?s=60-40&a=10000&from=2000-01&to=2025-06&cmp=gsc,gl`).
State is kept in sync via **`react-router`'s `useSearchParams`** hook (or, if
the project drops react-router, a tiny hand-rolled
`useSyncExternalStore`-based hook over `history.pushState`/`replaceState`).

**Why flat query params (no compression)**: the state is 5–8 small flat fields.
For data this small, compression (base64 JSON, `lz-string`) makes the URL
**longer**, not shorter, and destroys readability. Flat short keys are the
shortest realistic encoding, require no dependency, and stay human-debuggable.
A representative link is ~50 characters.

**Why query string over hash**: the app lives at path `/`. Both query (`?`) and
hash (`#`) params keep the path at `/`, so **no SPA-fallback rewrite rule is
needed on any static host** (GitHub Pages, Netlify, Cloudflare Pages, Vercel).
Query params are the standard, analytics-friendly choice; hash is reserved for
unusually finicky hosts.

**Push vs replace (back-button behavior)**:
- **`pushState`** on discrete commits (selecting a strategy, adding to
  comparison, changing the date range, generating a recommendation) → Back
  button restores the previous state (good UX).
- **`replaceState`** (debounced ~300–500 ms) on continuous edits (typing the
  amount, dragging a slider) → avoids spamming history.

**Alternatives considered**:
- *Path-based deep links (`/strategy/60-40`).* Rejected: requires SPA-fallback
  rewrites on the host (the classic 404→index.html problem); query/hash params
  avoid it entirely.
- *`lz-string` / base64 JSON blob.* Rejected: adds a dependency and bloats the
  URL for this small flat state.
- *`@tanstack/react-router`.* Rejected: type-safe schema-validated search is
  overkill for a single-view static app.

---

## R-8 · State persistence: none (URL is the storage)

**Decision**: There is **no persistence layer at all**. The session's working
state (selected strategy, amount, period, comparison set, quiz answers) lives
in React component state (in-memory) for the current session only. To *keep*
a choice, the user copies the shareable link (R-7), which encodes the state
into the URL.

**Rationale**: directly required by the spec's clarifications ("Ephemeral only
— held in memory for the session, never persisted to device or server").
Adding `localStorage` would contradict the explicit "never persisted to the
device" requirement. The shareable link is the designed replacement.

**Implication for recommendation**: the rule-based recommendation lookup
(horizon + risk tier → one strategy, FR-008) is a **pure function** of the
quiz answers — no server, no storage, fully deterministic and explainable in
plain words.

---

## R-9 · Testing stack: Vitest + React Testing Library

**Decision**: **Vitest** (unit + integration) + **React Testing Library**
(component/interaction tests). Deterministic, no network, fast (seconds).
The bundled dataset is imported as a fixture, so backtest/metric tests are
fully reproducible.

**Coverage focus** (constitution II — behavior, not implementation):
- Backtest engine: pure-function tests over fixed inputs → expected growth
  series + four metrics (R-3).
- Edge cases as tests: zero/negative amount (blocked), missing-data start
  (shortened/excluded), crash-period honesty (drawdown shown), latest-common-
  start alignment for comparison.
- URL state encoding/decoding round-trip (every state → URL → state is equal).
- Recommendation lookup: every (horizon, risk-tier) pair → the expected
  strategy and a non-empty rationale.
- Component interactions: select strategy → detail renders; enter amount +
  period → chart + four metrics render; select 2–3 → comparison view; answer
  quiz → recommendation + copy-link.
- Accessibility: every chart has a paired visually-hidden data table; keyboard
  reachability of the core flow (explore → visualize → compare → recommend).

**Alternatives considered**:
- *Jest.* Rejected: Vitest is the Vite-native runner (same transform pipeline,
  faster, zero config). Jest requires a separate config and slower cold starts.
- *Playwright/Cypress for E2E.* Deferred: optional integration tier later; the
  core behavior is provable with Vitest + Testing Library at far lower cost.

---

## Outstanding risks (carried into plan, not blockers)

1. **Corporate-bond proxy fidelity (R-2)**: bond-heavy strategies will track
   intermediate Treasuries, not the true Bloomberg Aggregate. Mitigated by an
   explicit in-app + disclaimer label; educationally sound but worth noting to
   reviewers.
2. **French library license posture**: no explicit redistributable license,
   though universally tolerated. Mitigated by clear attribution in
   `DATA_SOURCES.md` and the in-app disclaimer.
3. **Canvas a11y**: every chart needs a hand-authored visually-hidden
   companion table. This is per-chart work and must not be skipped (tracked as
   a task, not an afterthought).
