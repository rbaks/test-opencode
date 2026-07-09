# Quickstart: Passive Portfolio Visualizer

**Branch**: `001-passive-portfolio-visualizer`

This is a **validation guide**: how to run the app and prove the feature works
end-to-end, scenario by scenario. It maps each user story to a concrete thing
you can do in the running app and what you should see if it's working. It is
not an implementation reference — code lives in `tasks.md` and the source.

For context on *why* the app looks the way it does (data sources, stack
choices), read [research.md](./research.md). For the data shapes, read
[data-model.md](./data-model.md). For the exact behavior guarantees, read the
[contracts/](./contracts/).

---

## Prerequisites

- **Node.js** 20+ (LTS) and **npm** (or pnpm/yarn).
- A modern evergreen browser (Chrome, Firefox, Safari, Edge) — desktop and a
  mobile-width viewport for responsive checks.
- No API keys, no database, no network dependency at runtime — the historical
  data is bundled into the build.

## Setup

```bash
npm install          # install React, Vite, Tailwind, shadcn/ui, lightweight-charts, vitest
npm run dev          # start the Vite dev server (prints a localhost URL)
```

Open the printed URL. The app loads at path `/` showing the strategy library
(Explore view) and the persistent disclaimer.

## Build & static preview

```bash
npm run build        # production build → dist/
npm run preview      # serve the production build locally
```

The production build is a static bundle — deployable as-is to GitHub Pages,
Netlify, or Cloudflare Pages with **no SPA-fallback rewrite** (shareable
state lives in query params, so the path stays at `/`).

## Run the tests

```bash
npm run test         # Vitest unit + component suite (seconds, no network)
npm run typecheck    # tsc --noEmit (zero type errors)
npm run lint         # lint + format check on affected files
```

All three must be green before a change is considered done (constitution:
Quality Gates). The bundled dataset is imported as a test fixture, so
backtest/metric tests are fully reproducible.

---

## Validation scenarios (one per user story)

Each scenario is an **independent test** (per the spec's "Independent Test"
per story). If all six pass, the feature works end-to-end.

### Scenario 1 — Explore the strategy library (Story 1, P1)

**Goal**: a first-time visitor understands at least one strategy in under
2 minutes (SC-001), with no account and no money entered.

1. Open the app. **Expect**: a grid of 5–7 named strategy cards, each with a
   short description. No login prompt.
2. Click any strategy (e.g., "60/40 Balanced"). **Expect**: a detail view
   with the asset-allocation breakdown (donut), a "who it suits" summary, and
   the growth-vs-calm trade-off.
3. Hover/focus a financial term (e.g., "bonds", "volatility"). **Expect**: a
   plain-language definition tooltip appears (FR-003).
4. Check the disclaimer is visible (header trigger + footer). **Expect**:
   "educational, not advice; past performance does not guarantee future
   results" plus the data source and vintage (FR-011).

**Pass**: you can describe the strategy's allocation and who it suits in your
own words.

### Scenario 2 — Run a backtest (Story 2, P2)

**Goal**: after entering an amount and period, the growth chart and four
headline numbers appear within 1 second (SC-002).

1. From a strategy detail, enter a starting amount (e.g., `$10000`) and a
   date range (e.g., `2000-01` → `2025-06`).
2. Run. **Expect within 1 second**:
   - A growth-over-time chart (TradingView Lightweight Charts) rendering the
     portfolio value across the period, **including the 2008 and 2020 dips**.
   - Four headline metrics, each with a plain-language label + definition:
     Total Growth, Annualized Return, Volatility, Worst Drawdown.
3. Confirm the chart is paired with a **visually-hidden data table** for
   screen readers (inspect the DOM: an `sr-only` table mirroring key values).

**Pass**: the four numbers are present, the dips are visible (not smoothed),
and the chart rendered in under 1 second.

**Edge sub-checks** (each must show a friendly message, never a crash):
- Enter `0` or a negative amount → run is blocked with "Enter an amount
  greater than zero."
- Pick a start date before the strategy's data begins → a warning that the
  run was shortened to the available range.

### Scenario 3 — Compare strategies side by side (Story 3, P3)

**Goal**: set up a 2–3 strategy comparison in under 2 minutes (SC-003).

1. Select 2–3 strategies (e.g., `60-40`, `three-fund`, `all-equity`) and a
   shared amount + period.
2. Open the Compare view. **Expect**:
   - One overlaid growth chart with one line per strategy, distinct colors.
   - An aligned metrics table: rows = the four metrics, columns = strategies,
     so the trade-off (more growth vs. calmer ride) is obvious.
3. Confirm the comparison **aligns on the latest common start** if the
   strategies have different earliest-data months, with a plain-language note
   explaining the alignment.

**Pass**: you can state, in your own words, which strategy grew more and
which had the calmer ride (SC-005).

### Scenario 4 — Get a personalized recommendation (Story 4, P4)

**Goal**: answer the quiz and get one recommended strategy + a rationale
within 30 seconds (SC-004).

1. Open the Recommend view (or click "Help me decide").
2. Answer the two questions: time horizon (short/medium/long) and risk
   comfort (low/medium/high).
3. **Expect**: one recommended strategy card, highlighted, with a
   one-paragraph plain-language rationale that names your answers.
4. Click "Copy shareable link". **Expect**: a toast confirms the copy, and
   the clipboard contains a URL with `?quiz=<horizon>.<risk>&view=recommend`.
5. Open that URL in a new tab. **Expect**: the same recommendation appears,
   with no login and no server round-trip (the URL encoded everything).

**Pass**: the recommendation matches the
[recommendation matrix](./contracts/recommendation.md) for your answers, and
the link reproduces it.

### Scenario 5 — Accessibility (cross-cutting, FR-010, SC-008)

1. Unplug the mouse. Complete the full core flow — explore → visualize →
   compare → recommend — using **keyboard only** (Tab, Shift+Tab, Enter,
   Space, arrows). Every control must be reachable and operable.
2. Run a screen reader (VoiceOver / NVDA). Confirm: every chart is announced
   via its visually-hidden data table; numbers and trends are readable.
3. Resize to a mobile-width viewport. Confirm: charts and tables reflow and
   stay readable; no horizontal scroll, no overlapping controls.

**Pass**: the core flow is completable keyboard-only and readable by a screen
reader, on both desktop and mobile widths.

### Scenario 6 — Graceful failure (FR-012, SC-007)

1. Disconnect the network after first load. Reload. **Expect**: the app still
   works (data is bundled) — or, if mid-first-load, a friendly offline
   message, never a blank screen.
2. Trigger each error/empty state: no selection (empty gallery prompt), bad
   input (blocked run), missing data (warning), offline. **Expect**: each
   shows a friendly, actionable message (shadcn `Empty` / `Alert`).

**Pass**: no raw error or blank screen in any state, on desktop or mobile.

---

## What "done" looks like

A change to this feature is complete only when:

1. `npm run test`, `npm run typecheck`, and `npm run lint` are all green.
2. All six validation scenarios above pass on **desktop and mobile** widths.
3. Every chart has a paired visually-hidden data table (accessibility).
4. `/speckit.analyze` reports no spec/plan/tasks inconsistencies.
5. `/speckit.converge` reports `converged` (no appended tasks).

(These mirror the project-level "Done" definition in `AGENTS.md` and the
constitution's Quality Gates.)
