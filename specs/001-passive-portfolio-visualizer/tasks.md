# Tasks: Passive Portfolio Visualizer

**Input**: Design documents from `/specs/001-passive-portfolio-visualizer/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests ARE included. The constitution (§II Testing Standards — NON-NEGOTIABLE) and plan.md / research.md §R-9 explicitly require that every unit of functionality ships with tests. Tests verify behavior (inputs → outputs), not implementation, and are deterministic (bundled dataset imported as a fixture).

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and delivered independently. The app is a **frontend-only static SPA** (no backend, no database, no accounts) — all paths assume a single project rooted at `src/` and `tests/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project (web app, frontend-only)**: `src/`, `tests/` at repository root
- There is **no backend, no API, no `backend/` directory** (research.md §R-1)
- Pure business logic lives in `src/lib/` (fully testable, no React); UI lives in `src/features/` and `src/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, toolchain, and design-token foundation

- [X] T001 Initialize Vite + React 18 + TypeScript project scaffold (package.json, vite.config.ts, tsconfig.json with strict mode, index.html, src/main.tsx)
- [X] T002 Install dependencies in package.json: runtime (react, react-dom, react-router-dom, tailwindcss, lightweight-charts, recharts, react-day-picker, sonner) and dev (vitest, @testing-library/react, @testing-library/jest-dom, eslint, prettier, @vitejs/plugin-react)
- [X] T003 [P] Configure Tailwind CSS + shadcn/ui design tokens (tailwind.config.ts with chart/color tokens, globals.css with CSS variables, components.json) — constitution UI mandate
- [X] T004 [P] Configure Vitest + React Testing Library (test setup file, jsdom environment, npm scripts: `test`, `test:run`, `typecheck`, `lint`) in vite.config.ts and package.json
- [X] T005 [P] Configure ESLint + Prettier with TypeScript and React rules (.eslintrc.cjs, .prettierrc, path aliases `@/` → `src/`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared read-only data, pure helpers, URL state, app shell, and cross-cutting UI (disclaimer + glossary) that EVERY user story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Define shared TypeScript types (Strategy, AssetClass, Allocation, ReturnSeries, GrowthPoint, BacktestRunInput, BacktestRun, Metric, MetricKey, UserPreferenceSet, TimeHorizon, RiskComfort, ShareableState, RunWarning, BacktestError) in src/types/index.ts
- [X] T007 [P] Bundle the 5 asset-class metadata records (id, name, category, dataSource, proxyNote, glossary, dataStartMonth) in src/data/asset-classes.ts — sourced per research.md §R-2
- [X] T008 [P] Define the 6 predefined strategy recipes + metadata (id, name, shortDescription, whoItSuits, tradeoffs, riskTier, allocations, earliestStartMonth) in src/data/strategies.ts — per data-model.md §Strategy table
- [X] T009 Implement data validation: assert every strategy's allocation weights sum to 1.0 (± epsilon) and every id is URL-safe/unique, in src/data/validate.ts and tests/unit/data.test.ts (depends on T007, T008)
- [X] T009.5 [P] Author src/data/DATA_SOURCES.md — attribution (Kenneth French Data Library / Tuck-Dartmouth, FRED / St. Louis Fed), data vintage + "as-of" date, annual refresh cadence, and the documented intermediate-Treasury proxy for the bond sleeve — per FR-011 and research.md §R-2; sourced into the disclaimer (T015)
- [X] T010 [P] Implement the glossary dictionary (every financial term/acronym → one-line beginner definition, satisfying FR-003 term-coverage rule) in src/data/glossary.ts
- [X] T011 [P] Implement URL state encode/decode (ShareableState ↔ flat query params: s, a, from, to, cmp, view, quiz) in src/lib/url-state.ts per contracts/shareable-link.md — decode is total, never throws
- [X] T012 Test URL state round-trip (decode(encode(state)) deep-equals state) and invalid-input dropping in tests/unit/url-state.test.ts (depends on T011)
- [X] T013 [P] Create shared state components (EmptyState, LoadingState, ErrorState, OfflineState) using shadcn Empty/Skeleton/Spinner/Alert in src/components/states/
- [X] T014 Build App shell: layout, header, view-switching that reads/writes the `view` query param via useSearchParams, and a panel slot per view, in src/App.tsx and src/components/layout/AppHeader.tsx (depends on T011, T013)
- [X] T015 [P] Create persistent disclaimer + collapsible "how these numbers are computed" disclosure (educational-not-advice notice, data source, vintage, rebalance frequency, proxy note, comparison-alignment rule) per FR-011 in src/components/Disclaimer.tsx and src/components/layout/AppFooter.tsx
- [X] T016 [P] Create the GlossaryTerm component: wraps any financial term in a shadcn Tooltip that appears on hover AND keyboard focus (FR-003) in src/components/GlossaryTerm.tsx

**Checkpoint**: Foundation ready — types, data, URL state, app shell, disclaimer, and glossary all in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Explore & Understand the Strategy Library (Priority: P1) 🎯 MVP

**Goal**: A first-time visitor with no investing knowledge sees a curated gallery of 6 named strategies, picks one, and reads its allocation breakdown and a "who it suits" summary — every jargon term defined on demand — with no account and no money entered (SC-001).

**Independent Test**: Open the app, pick any single strategy, and confirm you can read its allocation and a "who this suits" summary with no account and no money entered.

### Tests for User Story 1

- [X] T017 [P] [US1] Test the gallery renders all 6 strategy cards with name + short description in tests/components/explore.test.tsx
- [X] T018 [P] [US1] Test selecting a strategy renders the detail view with allocation breakdown, whoItSuits, and tradeoffs in tests/components/explore.test.tsx
- [X] T019 [P] [US1] Test a glossary term shows its plain-language definition on keyboard focus in tests/components/explore.test.tsx

### Implementation for User Story 1

- [X] T020 [P] [US1] Create StrategyCard component (name, short description, risk-tier badge) using shadcn Card in src/components/strategy/StrategyCard.tsx
- [X] T021 [P] [US1] Create AllocationDonut component (percentage per asset class) using the shadcn/ui chart block (Recharts Pie, innerRadius) — the justified categorical exception per research.md §R-6 — in src/components/strategy/AllocationDonut.tsx
- [X] T022 [P] [US1] Create StrategyDetail component (title, description, whoItSuits, tradeoffs, allocation donut, glossary terms) in src/components/strategy/StrategyDetail.tsx (depends on T021)
- [X] T023 [US1] Build the ExplorePanel feature: a responsive Tailwind grid of StrategyCards + a detail view driven by the selected `s=` param, in src/features/explore/ExplorePanel.tsx (depends on T020, T022)
- [X] T024 [US1] Wire the ExplorePanel into the App shell and sync the selected strategy to the `s=` and `view=explore` URL params in src/App.tsx and src/hooks/useUrlState.ts (depends on T014, T023)

**Checkpoint**: User Story 1 is fully functional — the app is a usable educational product on its own.

---

## Phase 4: User Story 2 — See How a Strategy Performed Over Time (Priority: P2)

**Goal**: The user picks a strategy, enters a starting amount and historical period, and sees a growth-over-time chart (including the scary dips) plus four headline numbers — total growth, annualized return, volatility, worst drawdown — each with a plain-language label, within 1 second (SC-002).

**Independent Test**: Pick one strategy, enter an amount and date range, and confirm a growth chart plus the four headline numbers appear with plain-language labels.

### Tests for User Story 2

- [X] T025 [P] [US2] Test the backtest engine produces the expected growth series from the bundled fixture and shows 2008/2020 dips honestly (FR-007) in tests/unit/backtest.test.ts
- [X] T026 [P] [US2] Test computeMetrics returns all four metrics, max-drawdown ≤ 0, and no NaN/Infinity in tests/unit/metrics.test.ts
- [X] T027 [P] [US2] Test runBacktest returns structured errors (INVALID_AMOUNT, INVALID_RANGE, NO_DATA) and never throws on bad input, in tests/unit/backtest.test.ts
- [X] T028 [P] [US2] Test the format helpers (formatPercent, formatCurrency, formatMonth) are locale-stable in tests/unit/format.test.ts
- [X] T029 [P] [US2] Test a run renders the growth chart and the four labeled metrics in tests/components/visualize.test.tsx
- [X] T030 [P] [US2] Test every chart is paired with a visually-hidden (sr-only) data table for screen readers (FR-010) in tests/components/visualize.test.tsx

### Implementation for User Story 2

- [X] T031 [P] [US2] Bundle the monthly total-return series JSON for all 5 asset classes (Fama–French equities + FRED Treasuries/gold, 2000–present) under src/data/returns/ with a build-time series-integrity check (ascending months, no duplicates/gaps) in src/data/returns/index.ts
- [X] T032 [US2] Implement the format helpers (formatPercent, formatCurrency, formatMonth) as pure locale-stable functions in src/lib/format.ts (depends on T028 conceptually; TDD)
- [X] T033 [US2] Implement the backtest engine runBacktest (monthly rebalance, weighted monthly return, cumulative growth series, range adjustment + RunWarning) in src/lib/backtest.ts per contracts/backtest.md (depends on T031)
- [X] T034 [US2] Implement computeMetrics (total-growth, annualized-return/CAGR, volatility ×√12, max-drawdown) in src/lib/metrics.ts per contracts/backtest.md (depends on T033)
- [X] T035 [P] [US2] Create the GrowthChart wrapper (TradingView Lightweight Charts v5 AreaSeries, useRef/useEffect, autoSize, dispose on cleanup) in src/components/charts/GrowthChart.tsx
- [X] T035.5 [P] [US2] Create the DrawdownChart wrapper (TradingView Lightweight Charts v5 BaselineSeries, baseValue.price = 0, red-below/green-above fill, sr-only companion table) in src/components/charts/DrawdownChart.tsx
- [X] T036 [P] [US2] Create the MetricsPanel component (4 metric cards, each with label + displayValue + on-demand definition) in src/components/MetricsPanel.tsx
- [X] T037 [P] [US2] Create RunControls (starting-amount Input with `$` addon + month/year Date Picker constrained to the available range) using shadcn Input + DatePicker in src/features/visualize/RunControls.tsx
- [X] T038 [US2] Build the VisualizePanel feature (RunControls + GrowthChart + DrawdownChart + MetricsPanel + sr-only data table + blocked-run empty state) in src/features/visualize/VisualizePanel.tsx (depends on T035, T035.5, T036, T037)
- [X] T039 [US2] Create the useBacktest hook and wire the VisualizePanel into the App shell, syncing `a=`, `from=`, `to=` params (pushState on commit), in src/hooks/useBacktest.ts and src/App.tsx (depends on T033, T034, T038)

**Checkpoint**: User Stories 1 AND 2 both work independently — a beginner can explore and then see real historical performance.

---

## Phase 5: User Story 3 — Compare Strategies Side by Side (Priority: P3)

**Goal**: The user selects 2–3 strategies over the same amount and period and sees them overlaid on one chart with an aligned metrics table, so the growth-versus-calmness trade-off is obvious (SC-003, SC-005).

**Independent Test**: Select two strategies, run them over the same period, and confirm an overlaid chart and an aligned comparison table of the headline metrics appear.

### Tests for User Story 3

- [ ] T040 [P] [US3] Test the comparison aligns multiple runs on the latest common start month (data-model.md edge case) in tests/unit/backtest.test.ts
- [ ] T041 [P] [US3] Test the ComparePanel renders one line per strategy on an overlaid chart plus an aligned metrics table in tests/components/compare.test.tsx
- [ ] T042 [P] [US3] Test a plain-language alignment warning is shown when strategies have different earliest-data months in tests/components/compare.test.tsx

### Implementation for User Story 3

- [ ] T043 [P] [US3] Create the ComparisonChart wrapper (multiple TradingView Lightweight Charts LineSeries sharing one time axis, distinct `--chart-N` colors) in src/components/charts/ComparisonChart.tsx
- [ ] T044 [P] [US3] Create the ComparisonTable component (rows = the four metrics, columns = selected strategies) using shadcn Table in src/components/ComparisonTable.tsx
- [ ] T045 [P] [US3] Create the StrategyMultiSelect (pick 2–3 strategies with chips, enforced limit) using shadcn Combobox/ToggleGroup in src/features/compare/StrategyMultiSelect.tsx
- [ ] T046 [US3] Build the ComparePanel feature (StrategyMultiSelect + shared RunControls + ComparisonChart + ComparisonTable + alignment note + sr-only summary) in src/features/compare/ComparePanel.tsx (depends on T043, T044, T045)
- [ ] T047 [US3] Wire the ComparePanel into the App shell, syncing the `cmp=` param (comma-sep slugs) and reusing the shared amount/period, in src/App.tsx (depends on T039, T046)

**Checkpoint**: User Stories 1, 2, AND 3 all work independently — explore, visualize, and compare are all usable.

---

## Phase 6: User Story 4 — Get a Personalized Recommendation (Priority: P4)

**Goal**: The user answers two questions (time horizon, risk comfort) and receives one recommended strategy with a plain-language "why" and a shareable link, within 30 seconds (SC-004).

**Independent Test**: Answer the few questions and confirm a single recommended strategy appears with a one-paragraph reason and a recap of its growth/risk profile, plus a copyable share link.

### Tests for User Story 4

- [ ] T048 [P] [US4] Test recommend() returns a valid strategyId for all 9 (horizon × risk) cells in tests/unit/recommend.test.ts
- [ ] T049 [P] [US4] Test every rationale references both the horizon and risk answers and is non-empty in tests/unit/recommend.test.ts
- [ ] T050 [P] [US4] Test the quiz produces a highlighted recommendation and a "link copied" toast in tests/components/recommend.test.tsx
- [ ] T051 [P] [US4] Test a stale/invalid shareable link shows a friendly "this link is out of date" notice offering the nearest valid strategy (spec edge case) in tests/components/recommend.test.tsx

### Implementation for User Story 4

- [ ] T052 [US4] Implement the recommendation lookup (deterministic 3×3 matrix → one strategyId + authored one-paragraph rationale) in src/lib/recommend.ts per contracts/recommendation.md
- [ ] T053 [P] [US4] Create the Quiz component (RadioGroup for time horizon + RadioGroup for risk comfort, fixed enums only) using shadcn RadioGroup in src/features/recommend/Quiz.tsx
- [ ] T054 [P] [US4] Create the RecommendationCard component (highlighted strategy, rationale, growth/risk profile recap) in src/features/recommend/RecommendationCard.tsx
- [ ] T055 [P] [US4] Create the CopyLinkButton (encodes quiz answers to a share URL, sonner toast on copy) and the StaleLinkNotice fallback in src/features/recommend/CopyLinkButton.tsx
- [ ] T056 [US4] Build the RecommendPanel feature (Quiz + RecommendationCard + CopyLinkButton + StaleLinkNotice) in src/features/recommend/RecommendPanel.tsx (depends on T053, T054, T055)
- [ ] T057 [US4] Wire the RecommendPanel into the App shell, syncing the `quiz=` param (`<horizon>.<risk>`) and `view=recommend`, in src/App.tsx (depends on T014, T056)

**Checkpoint**: All four user stories are independently functional — the full explore → visualize → compare → recommend flow is complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify the cross-cutting guarantees that span every user story (constitution §III, §IV)

- [ ] T058 [P] Accessibility pass: confirm the full core flow is completable keyboard-only and every chart has a paired sr-only data table (FR-010, SC-008) across src/
- [ ] T059 [P] Responsive pass: verify charts and tables reflow readably at every declared breakpoint with no horizontal scroll (FR-010) across src/
- [ ] T060 [P] Performance verification: measure backtest compute < 1s, chart render < 1s, 60fps interaction, initial load < 2s, and app bundle < 300 KB gzipped (SC-002, SC-006) across src/
- [ ] T061 [P] Graceful-failure pass: confirm every error/empty/loading/offline state shows a friendly actionable message, never a blank screen or raw error (FR-012, SC-007) across src/
- [ ] T062 [P] Term-coverage audit: enumerate every financial term/acronym rendered in the core flow and assert each has a glossary entry + inline definition — zero undefined terms (FR-003) across src/
- [ ] T063 [P] Chart theming: theme all TradingView Lightweight Charts through their API to inherit the Tailwind/shadcn design tokens (colors, fonts, gridlines, crosshair) and re-apply on theme change, in src/components/charts/
- [ ] T064 Run all six quickstart.md validation scenarios end-to-end on desktop and mobile widths (Scenario 1–6)
- [ ] T065 Run `/speckit.analyze` (no spec/plan/tasks inconsistencies) and `/speckit.converge` (reports `converged`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–6)**: Each depends on Foundational completion
  - US1 (P1): no dependency on other stories
  - US2 (P2): no dependency on other stories (brings its own data + engine)
  - US3 (P3): reuses US2's backtest engine + metrics + return data, so depends on US2
  - US4 (P4): no dependency on other stories (rule-based lookup, no backtest needed)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational — independently testable; brings return-series data + backtest engine
- **User Story 3 (P3)**: Depends on US2 (reuses `runBacktest`, `computeMetrics`, the return series, and GrowthChart patterns) — independently testable once US2 lands
- **User Story 4 (P4)**: Can start after Foundational — independently testable; the recommendation is a pure rule-based lookup

### Within Each User Story

- Tests are written FIRST and must FAIL before implementation (constitution §II)
- Pure `lib/` functions before React components
- Components before feature panels
- Feature panel before App-shell wiring
- Story complete and independently testable before moving to the next priority

### Parallel Opportunities

- All Setup tasks marked [P] (T003, T004, T005) can run in parallel
- All independent Foundational tasks marked [P] (T007, T008, T010, T011, T013, T015, T016) can run in parallel
- Within US1: tests (T017–T019) and leaf components (T020, T021) run in parallel
- Within US2: tests (T025–T030), return-series bundling (T031), and leaf components (T035, T036, T037) run in parallel
- US1 and US4 can be developed fully in parallel (neither depends on the other); US2 can start in parallel with US1; US3 must follow US2
- All Polish tasks marked [P] (T058–T063) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Test the gallery renders all 6 strategy cards in tests/components/explore.test.tsx"
Task: "Test selecting a strategy renders the detail view in tests/components/explore.test.tsx"
Task: "Test a glossary term shows its definition on focus in tests/components/explore.test.tsx"

# Launch all leaf components for User Story 1 together:
Task: "Create StrategyCard in src/components/strategy/StrategyCard.tsx"
Task: "Create AllocationDonut in src/components/strategy/AllocationDonut.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch pure-function tests + data bundling + leaf components in parallel:
Task: "Test the backtest engine on the fixture in tests/unit/backtest.test.ts"
Task: "Test computeMetrics in tests/unit/metrics.test.ts"
Task: "Test the format helpers in tests/unit/format.test.ts"
Task: "Bundle the monthly return series JSON in src/data/returns/"
Task: "Create the GrowthChart wrapper in src/components/charts/GrowthChart.tsx"
Task: "Create the MetricsPanel in src/components/MetricsPanel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test US1 independently — a beginner can explore the library and understand one strategy in under 2 minutes (SC-001)
5. Deploy/demo the MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (MVP!)
3. Add US2 → Test independently → Deploy/Demo (see real history)
4. Add US3 → Test independently → Deploy/Demo (side-by-side compare)
5. Add US4 → Test independently → Deploy/Demo (guided recommendation)
6. Polish pass → full constitution compliance
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Foundational completes:

- Developer A: User Story 1 (Explore) + User Story 3 (Compare, after US2)
- Developer B: User Story 2 (Visualize) — owns the backtest engine + data
- Developer C: User Story 4 (Recommend) — fully independent of the others

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps each task to its user story for traceability
- Every user story is independently completable and testable per its "Independent Test"
- Tests are mandatory (constitution §II) — verify they fail before implementing
- The app is **frontend-only** — there is no backend, no database, no API, no secrets (research.md §R-1, §R-8)
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
- The single justified charting exception is the categorical allocation **donut** (Recharts via shadcn `chart`) — all axis/time-series charts use TradingView Lightweight Charts v5 (research.md §R-5, §R-6)

---

## Phase 8: Convergence

- [X] T066 Wire `assertDatasetValid()` (src/data/validate.ts) into the build or app entry so a malformed bundled dataset fails the build per FR-014 (partial) — the validator exists and is unit-tested (tests/unit/data.test.ts) but is never invoked by `npm run build` (`tsc -b && vite build`) or at runtime, so a bad strategy/asset-class definition would currently ship silently; complements T031's pending return-series build-time check

---

## Phase 9: Convergence

- [ ] T067 Embed `DisclaimerCollapsible` (src/components/Disclaimer.tsx) inside each output panel — VisualizePanel (T038), ComparePanel (T046), RecommendPanel (T056) — so the detailed methodology disclosure is reachable from the chart / metrics table / recommendation it affects, not only from the global footer per FR-011 (partial)
- [ ] T068 Add visible contextual labeling to the drawdown / growth view so a beginner cannot misread a deep dip as "this strategy is broken" or "you would have lost everything" — note when the selected period includes a known historical crash (2008 / 2020), state that drawdown is peak-to-trough (not a total loss), and label the figure as historical per FR-007 + spec edge case (market crash) (partial)
