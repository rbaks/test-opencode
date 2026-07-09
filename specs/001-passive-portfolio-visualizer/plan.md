# Implementation Plan: Passive Portfolio Visualizer

**Branch**: `001-passive-portfolio-visualizer` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-passive-portfolio-visualizer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

A **static, front-end-only single-page web app** that helps a non-expert
understand and choose among well-known passive investment strategies (5–7
archetypes across the risk spectrum). The user explores a curated strategy
library, runs historical backtests over a bundled ~25-year dataset, compares
2–3 strategies side by side, and answers a short quiz to get one
plain-language recommendation they can share via a link.

There is **no backend, no database, and no account**. All backtest math runs
in the browser; the historical dataset is bundled as static JSON; and the
shareable recommendation is encoded entirely in the URL. This is the simplest
architecture that satisfies every functional requirement, and it is forced by
the spec's explicit "no account, no server-side storage, ephemeral session"
constraints.

**Technical approach** (full rationale in [research.md](./research.md)):
React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui (constitution-mandated
UI stack); TradingView Lightweight Charts v5 for all time-series
(constitution-mandated); bundled data from Fama–French (equities) + FRED
public-domain series (fixed income/gold/CPI), with one documented
intermediate-Treasury proxy for the corporate-bond sleeve; flat query-param
shareable links.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 18, Vite 5

**Primary Dependencies**:
- `react`, `react-dom` (18) — UI runtime
- `vite` — build/dev toolchain
- `tailwindcss` — the **only** styling layer (constitution-mandated)
- `shadcn/ui` — every UI primitive it provides (constitution-mandated "maximum usage")
- `lightweight-charts` (TradingView, v5) — all axis/time-series charts (constitution-mandated)
- `recharts` (via shadcn `chart` block) — allocation donut only (justified exception, see R-6)
- `react-day-picker` (via shadcn Date Picker) — month/year date range input
- `sonner` (via shadcn) — toast for "link copied"
- `react-router-dom` — query-param state via `useSearchParams`
- `vitest` + `@testing-library/react` — unit + component tests (deterministic, no network)

**Storage**: **N/A** — no persistence layer. URL query params are the only
storage; session state is in-memory only (spec clarification 2026-07-09).

**Testing**: Vitest (unit + integration) + React Testing Library. The bundled
dataset is imported as a fixture, so backtest/metric tests are fully
reproducible and deterministic. See research.md §R-9.

**Target Platform**: Modern evergreen browsers (Chrome, Firefox, Safari,
Edge), desktop + mobile, ES2020+. Static-hostable (GitHub Pages, Netlify,
Cloudflare Pages).

**Project Type**: Web app — static single-page application (frontend-only).

**Performance Goals** (user-facing service levels from spec + internal budgets):
- **Backtest compute: < 1 second** for any single strategy run (SC-002 — chart
  and four metrics appear within 1s of the user's action).
- **Chart render: < 1 second** after data is ready (SC-002).
- **Smooth interaction: 60 fps** during chart pan/zoom and comparison toggling
  on desktop and mobile (SC-006 — no frozen/janky screen).
- **Initial load: < 2 seconds** to interactive on an average connection.
- **Comparison setup: < 2 minutes** end-to-end for 3 strategies (SC-003).
- **Recommendation: < 30 seconds** from quiz start to result (SC-004).

**Constraints**:
- **Offline-capable after first load** (data bundled; never blank-screen on a
  slow connection — FR-012).
- **WCAG 2.1 AA**: keyboard-operable, screen-reader compatible (charts paired
  with visually-hidden data tables), sufficient contrast, motion/zoom
  respected (FR-010, constitution III).
- **Mobile + desktop responsive** at every declared breakpoint (FR-010).
- **Bundle**: app code < 300 KB gzipped (excluding bundled data, which is
  < 100 KB — see R-2 sizing). `lightweight-charts` is ~30 KB.
- **Static hosting**: no SPA-fallback rewrite needed (query-param state keeps
  the path at `/`).
- **No secrets**: nothing to commit or log (constitution I) — there are no
  API keys because there is no backend and no live data API.

**Scale/Scope**: 6 predefined strategies; 5 bundled monthly-return series
over ~25 years (~300 points each, ~1.5k numeric points total, < 100 KB JSON);
one primary view (explore/visualize/compare/recommend) composed of panels;
single-page, no routing beyond query params.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution **v1.2.0** (ratified 2026-07-09). Evaluation against each gate:

### I. Code Quality — **PASS**
- **Simplicity first**: the architecture is a single static front-end project
  with no backend, no database, no accounts. This is the minimum that
  satisfies the spec; nothing speculative is introduced.
- **Surgical changes**: greenfield feature; no unrelated code to disturb.
- **Consistent style**: Tailwind utilities + shadcn primitives everywhere;
  TypeScript strict; naming follows existing conventions.
- **No secrets**: there are none — no backend, no API keys.

### II. Testing Standards (NON-NEGOTIABLE) — **PASS**
- Every unit of functionality ships with tests: backtest engine (pure
  functions), metric computation, URL encode/decode round-trips,
  recommendation lookup, component interactions, accessibility assertions.
- Tests verify **behavior** (inputs → outputs), not implementation.
- **Deterministic and isolated**: bundled dataset imported as a fixture; no
  network, no wall-clock, no shared mutable state.
- Fast: Vitest completes in seconds.

### III. User Experience Consistency — **PASS**
- **One design language**: Tailwind + shadcn/ui across every surface
  (enforced by construction via the constitution's UI mandate).
- **Graceful failure**: every error/empty/loading/offline state designed and
  tested (FR-012, edge cases) using shadcn `Empty`, `Skeleton`/`Spinner`,
  `Alert`.
- **Accessible by default**: WCAG 2.1 AA; every chart paired with a
  visually-hidden data table; full keyboard reachability of the core flow
  (FR-010, SC-008).
- **Consistent across surfaces**: verified on desktop + mobile breakpoints.

### IV. Performance Requirements — **PASS**
- **Budgets are explicit**: declared above (compute < 1s, render < 1s,
  60 fps, load < 2s, bundle < 300 KB).
- **Measure before optimizing**: budgets will be verified by measurement
  (Vitest timing for compute; manual/CI checks for render and fps), not
  intuition. Optimization targets only demonstrated bottlenecks.
- **Efficient by construction**: pure backtest functions (no N+1, no
  unbounded lists), canvas charting off the critical React render path,
  debounced continuous input, data bundled (no runtime fetches).
- **Progressive under load**: degrades to slower, not corrupted; fails safely
  with friendly messages when a budget cannot be met.

### UI Technology & Professionalism Standards (v1.1.0 / v1.2.0) — **PASS**
- **Tailwind CSS is the only styling layer**: no custom CSS, inline styles, or
  CSS-in-JS.
- **shadcn/ui to the maximum extent**: every UI surface except the footer maps
  to a shadcn primitive (verified against the live registry — see research.md
  §R-4). Custom Tailwind is used only where no shadcn component exists.
- **TradingView Lightweight Charts for all charting**: all time-series (growth,
  comparison overlay, drawdown) use `lightweight-charts` v5. The single
  justified exception is the categorical allocation donut (shadcn `chart` /
  Recharts), which is outside the mandate's "series over an axis" scope — see
  research.md §R-6 for the review-recorded justification.
- **Professionalism bar**: intentional spacing/alignment/radius/elevation,
  complete interaction states (hover/focus-visible/active/disabled/loading/
  error), responsive at every breakpoint, zero visual jank.

**Gate verdict**: No violations. Complexity Tracking table below is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-passive-portfolio-visualizer/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/           # shadcn/ui primitives (registry-installed) + app UI components
│   ├── ui/               # shadcn/ui generated components (Card, Button, Tooltip, Table, ...)
│   ├── charts/           # Lightweight-Charts wrappers (GrowthChart, ComparisonChart, DrawdownChart)
│   ├── strategy/         # StrategyCard, StrategyDetail, AllocationDonut
│   └── states/           # EmptyState, LoadingState, ErrorState, OfflineState
├── features/             # Feature modules aligned to the 4 user stories
│   ├── explore/          # Strategy library browse + detail (Story 1)
│   ├── visualize/        # Single-strategy backtest run + metrics (Story 2)
│   ├── compare/          # 2–3 strategy comparison (Story 3)
│   └── recommend/        # Quiz + recommendation + share link (Story 4)
├── lib/                  # Pure functions (no React) — the testable core
│   ├── backtest.ts       # Monthly-rebalance backtest engine
│   ├── metrics.ts        # Total growth, CAGR, volatility, max drawdown
│   ├── recommend.ts      # Rule-based (horizon + risk tier) → strategy lookup
│   ├── url-state.ts      # Encode/decode shareable query params
│   └── format.ts         # Currency / percent / date plain-language formatting
├── data/                 # Bundled static dataset (build-time assets)
│   ├── returns/          # Monthly total-return series per asset class (JSON)
│   ├── strategies.ts     # The 5–7 predefined strategy recipes + metadata
│   └── DATA_SOURCES.md   # Attribution + vintage + methodology (sourced into disclaimer)
├── types/                # Shared TypeScript types (Strategy, AssetClass, Run, Metric, ...)
├── hooks/                # React hooks (useUrlState, useBacktest, useTheme)
├── App.tsx               # Single view composing the feature panels
└── main.tsx              # Vite entry
tests/
├── unit/                 # lib/* pure-function tests (backtest, metrics, url-state, recommend)
├── components/           # React Testing Library interaction tests
└── fixtures/             # Snapshot/fixture of the bundled dataset for reproducible runs
```

**Structure Decision**: Single-project layout (plan-template Option 1), because
this is a frontend-only static app with no backend, no API, and no separate
mobile target. The `backend/` + `frontend/` split (Option 2) is explicitly
rejected — there is no backend. The split between `lib/` (pure, fully tested
business logic) and `features/` (React UI) keeps the backtest math decoupled
from rendering, which is what makes the testing standard (constitution II)
tractable: the hard logic is pure functions, not embedded in components.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Empty — no constitution violations. The chosen architecture is the simplest
that satisfies the spec: one static front-end project, no backend, no database,
no accounts, no persistence. There is no fourth project, no repository pattern,
and no abstraction layer beyond what the four user stories require.
