# Feature Specification: Passive Portfolio Visualizer

**Feature Branch**: `001-passive-portfolio-visualizer`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "I want to create a web app that lets me visualize specific passive investment portfolio strategies and easily help me decide on the optimal investments strategy I'll adopt. I'm not an investment professional at all so the webapp should let any beginner like me extract something useful from it and use it as an educational tool, but for real, serious investment ideas."

## Overview *(what this is, in plain words)*

A web app that helps a non-expert understand and choose among well-known
**passive investment strategies** — ready-made, low-cost, "set it and forget
it" portfolios built from index funds. A simple example: a 60% stocks / 40%
bonds split, or a 3-fund mix of total-market stock and bond funds.

The user can see how each strategy is built, how it has performed over real
history, compare a few side by side, and get plain-language guidance on which
one fits their situation — turning a confusing decision into an informed,
confident choice.

It is an **educational and decision tool, not financial advice and not a
brokerage**. It never executes trades, never links to bank or brokerage
accounts, and always shows clearly that past results do not guarantee future
ones.

### Glossary *(plain-language definitions used throughout)*

- **Passive investing** — buying and holding low-cost funds that track whole
  markets, instead of trying to pick winning stocks. "Own a slice of
  everything, for pennies, and wait."
- **Portfolio strategy** — a fixed recipe of funds in set percentages
  (e.g., "60% stocks, 40% bonds").
- **Allocation** — the percentage split between a strategy's ingredients.
- **Backtest** — replaying a strategy over real historical data to see what it
  would have done: "if you had put $10,000 here in 2010, here's the line."
- **Volatility (risk)** — how much the value swings up and down. Bigger swings
  mean higher risk.
- **Drawdown** — the worst drop from a peak to a trough: "how bad it got
  before it recovered."

## Clarifications

### Session 2026-07-09

- Q: How large is the strategy library, and which archetypes does it cover? → A: A small focused set of 5–7 strategies covering classic archetypes across the risk spectrum (e.g., 60/40, 3-Fund, All-Weather, a conservative bonds-heavy mix, and an aggressive all-equity mix).
- Q: How far back should the historical dataset reach? → A: 2000 to present (~25 years) — reliably covers the 2008 and 2020 crashes and the full availability window of modern index funds.
- Q: What format does "save or share the recommendation" produce? → A: A shareable read-only link (URL encodes the chosen strategy) — no account, no server-side storage.
- Q: How is the recommendation strategy chosen? → A: A fixed rule-based lookup — time horizon + risk tier map deterministically to one strategy, fully explainable in plain words.
- Q: Should a user's answers and recommendation survive a page refresh? → A: Ephemeral only — held in memory for the session, never persisted to device or server; to keep a pick, the user uses the shareable link.

### Session 2026-07-10

- Q: Should the spec pin standard financial definitions for the four headline metrics, or defer to plan? → A: Pin all four in the spec — total growth = absolute USD gain; annualized return = CAGR; volatility = annualized std-dev of monthly returns (√12); worst drawdown = peak-to-trough max drawdown.
- Q: What is the granularity of the recommendation lookup matrix? → A: A 3 × 3 grid — 3 time-horizon tiers × 3 risk-comfort tiers = 9 cells, with multiple cells allowed to map to the same strategy (overlaps are expected and explainable).
- Q: Which methodology/data-limitation items must be disclosed to the end user vs. kept developer-only? → A: Disclose all material methodology and limitations to the end user in plain language — rebalance frequency, data proxies (e.g., Treasury-for-corporate-bonds), data vintage/refresh cadence, and comparison alignment rules — in a collapsible "how these numbers are computed" area, not only in developer docs.
- Q: What should happen when a shareable link encodes inputs that are no longer valid (strategy removed, dates out of range)? → A: Graceful fallback — show a friendly "this link is out of date" notice, state what was encoded, and offer the nearest still-valid strategy/range; never silently invent values and never hard-wall the user.
- Q: How should "beginner-friendly / plain-language" be made measurable? → A: A term-coverage rule — every financial term and acronym has a glossary entry plus an inline on-demand definition, with zero undefined acronyms anywhere (charts, axes, tooltips, buttons, body copy).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Explore & Understand the Strategy Library (Priority: P1)

A beginner opens the app with no prior knowledge. They see a curated library of
well-known passive strategies. They pick one and read a plain-language
explanation: what is in it, how it is split, what kind of investor it suits,
and the trade-offs (e.g., higher growth potential versus a calmer ride). Every
jargon term has a one-line definition on demand.

**Why this priority**: Education is the foundation. A beginner who cannot
understand the options cannot decide anything. This story alone is a usable
product.

**Independent Test**: Open the app, pick any single strategy from the library,
and confirm you can read its allocation and a "who this suits" summary — with
no account and no money entered.

**Acceptance Scenarios**:

1. **Given** a first-time visitor, **When** they open the app, **Then** they
   see a list of named strategies, each with a short description.
2. **Given** a visitor selects a strategy, **When** the detail view loads,
   **Then** they see the asset-allocation breakdown and a beginner-friendly
   explanation of who it suits.
3. **Given** a visitor encounters a financial term, **When** they focus on it,
   **Then** a plain-language definition appears.

---

### User Story 2 — See How a Strategy Performed Over Time (Priority: P2)

The user picks a strategy, enters a starting amount (say $10,000) and a
historical period, and watches how that money would have grown — including the
scary dips. They see a few headline numbers explained in plain words: total
growth, average yearly return, volatility (how bumpy), and worst drop.

**Why this priority**: Numbers make it real. Seeing the actual ride — gains and
losses — turns an abstract strategy into a concrete, felt decision.

**Independent Test**: Pick one strategy, enter an amount and date range, and
confirm a growth chart plus the four headline numbers appear with
plain-language labels.

**Acceptance Scenarios**:

1. **Given** a selected strategy, **When** the user enters a start amount and
   date range, **Then** a growth-over-time chart renders showing the value of
   the investment across the period.
2. **Given** the chart is shown, **When** the user views the headline metrics,
   **Then** total growth, annualized return, volatility, and worst drawdown are
   each displayed with a plain-language label and definition.
3. **Given** the period includes a market crash, **When** the chart renders,
   **Then** losses are shown honestly (never smoothed or hidden).

---

### User Story 3 — Compare Strategies Side by Side (Priority: P3)

The user selects 2–3 strategies and the same amount and period, and sees them
overlaid: whose line ended higher, whose ride was calmer, whose worst drop was
shallower. Key metrics line up in a comparison table so the differences stand
out clearly.

**Why this priority**: The core of "decide" is comparison. Side-by-side makes
the trade-off (more growth versus less stress) visceral and obvious.

**Independent Test**: Select two strategies, run them over the same period, and
confirm an overlaid chart and an aligned comparison table of the headline
metrics appear.

**Acceptance Scenarios**:

1. **Given** the user selects multiple strategies with a shared amount and
   period, **When** the comparison view loads, **Then** all selected strategies
   appear on one overlaid growth chart.
2. **Given** the comparison view, **When** the user reads the metrics, **Then**
   headline numbers for each strategy align in a table for direct comparison.
3. **Given** one strategy leads on growth while another leads on calmness,
   **When** the user views results, **Then** the trade-off is presented plainly
   (not as a single "winner").

---

### User Story 4 — Get a Personalized Recommendation (Priority: P4)

The user answers a few simple questions — roughly how long until they need the
money, and how comfortable they are seeing the value drop — and the app narrows
to the strategy that best fits, with a clear plain-language "why" and a summary
they could act on.

**Why this priority**: The decision payoff. This converts exploration into a
confident choice, which is the user's explicit goal.

**Independent Test**: Answer the few questions and confirm a single recommended
strategy appears with a one-paragraph reason and a recap of its growth/risk
profile.

**Acceptance Scenarios**:

1. **Given** the user has explored options, **When** they answer the
   time-horizon and risk-comfort questions, **Then** the app recommends one
   best-fit strategy.
2. **Given** a recommendation, **When** the user reads it, **Then** a
   plain-language reason explains why it fits their answers.
3. **Given** the recommendation, **When** the user wants to act, **Then** they
   can copy a **shareable read-only link** that encodes their chosen strategy
   (no account required, no server-side storage).

---

### Edge Cases

- **No strategy selected**: show a friendly empty state that guides the first
  pick.
- **Amount is zero, blank, or negative**: block the run with a clear, friendly
  message; never compute a misleading chart.
- **Chosen period has missing data** for an asset class (e.g., a fund did not
  exist yet): warn plainly and either shorten to the available range or exclude
  that strategy — never silently invent numbers.
- **Comparing strategies with different start dates**: align on the latest
  common start and explain the limitation in plain words.
- **Stale or invalid shareable link**: a link may encode a strategy that was
  removed from the library, or dates outside the available ~25-year range.
  Show a friendly "this link is out of date" notice that states what was
  encoded, and offer the nearest still-valid strategy and/or range — never
  silently invent values, and never hard-wall the user with a raw error.
- **Selected period is a market crash**: show the real losses; do not soften or
  hide drawdowns.
- **Slow or offline connection**: show loading states and a friendly offline
  message; never a blank screen or raw error.
- **Very small screen (mobile)**: charts and tables reflow to stay readable and
  usable.
- **User relies on keyboard or a screen reader**: every action is reachable
  without a mouse, and numbers and trends are readable by assistive technology.
- **User expects financial advice**: a persistent, plain-language disclaimer
  makes clear this is educational, not advice, and that past performance does
  not guarantee future results.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present a curated library of predefined, well-known
  passive investment strategies — a focused set of **5–7 archetypes** spanning
  the risk spectrum (conservative, balanced, aggressive) — each with a
  plain-language description and "who it suits" guidance.
- **FR-002**: Each strategy MUST display its asset-allocation breakdown in an
  at-a-glance visual (percentage per asset class).
- **FR-003**: Every financial term MUST offer a beginner-friendly definition on
  demand (glossary or inline definitions). "Beginner-friendly" is made
  measurable via a **term-coverage rule**: every financial term and acronym
  used anywhere in the UI — including chart axes, metric labels, tooltips,
  button labels, and body copy — MUST have (a) an entry in the glossary and
  (b) an inline on-demand definition at its point of use. The acceptance bar
  is **zero undefined acronyms or un-glossaried financial terms** across the
  core flow (explore → visualize → compare → recommend); this is verifiable by
  enumerating every term/acronym rendered and asserting each is defined.
- **FR-004**: System MUST let the user choose a strategy, enter a starting
  amount and a historical date range, and see how that amount would have grown
  across the period.
- **FR-005**: System MUST display headline metrics for any run — total growth,
  annualized return, volatility (risk), and worst drawdown — each with a
  plain-language label and definition. The metric definitions are pinned as
  follows (the *meaning* shown to the user; computation belongs to the plan):
  - **Total growth** — absolute USD gain/loss over the chosen period
    (ending value − starting amount), also shown as a percentage of the
    starting amount.
  - **Annualized return** — **CAGR** (compound annual growth rate), never the
    arithmetic mean of yearly returns (which would overstate gains).
  - **Volatility (risk)** — annualized standard deviation of monthly total
    returns (monthly std-dev × √12); a bigger number means a bumpier ride.
  - **Worst drawdown** — largest peak-to-trough decline observed in the series
    (max drawdown); never smoothed or averaged.
- **FR-006**: System MUST let the user compare 2–3 strategies over the same
  amount and period, shown on one overlaid chart with an aligned metrics table.
- **FR-007**: System MUST present gains and losses truthfully; it MUST never
  hide, smooth, or soften drawdowns.
- **FR-008**: System MUST let the user answer a short set of questions (time
  horizon, risk comfort) and recommend one best-fit strategy via a fixed
  **rule-based lookup** (horizon + risk tier → one strategy), with a
  plain-language rationale that explains the mapping. The lookup is a
  **3 × 3 matrix** — 3 time-horizon tiers (short / medium / long) × 3
  risk-comfort tiers (low / medium / high) = 9 cells; each
  cell maps deterministically to exactly one strategy, and **multiple cells
  may map to the same strategy** (overlap is expected and explainable).
  In-between answers snap to the nearest tier; the rationale MUST state which
  tier each answer was assigned to so the mapping is fully transparent.
- **FR-009**: System MUST work fully without requiring an account or any
  personal financial credentials; no brokerage or bank linking, and no trade
  execution.
- **FR-010**: System MUST be usable on both desktop and mobile, with every
  action reachable via keyboard and readable by screen readers.
- **FR-011**: System MUST display a persistent, plain-language disclaimer:
  educational tool, not financial advice; past performance does not guarantee
  future results; and the source and vintage of the underlying data. In
  addition, the system MUST disclose to the end user — in plain language and
  in a collapsible "how these numbers are computed" area — all material
  methodology and data limitations that affect the numbers shown:
  - the **backtest methodology** (notably the rebalancing frequency, e.g.
    monthly);
  - any **data proxy** or substitution (e.g., an intermediate-Treasury series
    standing in for corporate bonds), stated as a known limitation;
  - the **data source(s), vintage, and refresh cadence** (an "as-of" date);
  - the **comparison alignment rule** (e.g., strategies are aligned on the
    latest common start date when their inception dates differ).
  These disclosures MUST be reachable from the outputs they affect (charts,
  comparison, recommendation), not buried only in developer documentation.
- **FR-012**: System MUST gracefully handle missing data, invalid input, and
  offline states with friendly messages — never a blank screen or raw error.

### Key Entities *(include if feature involves data)*

- **Strategy** — a named, predefined portfolio recipe (e.g., "60/40").
  Attributes: name, short description, "who it suits," and its allocation.
- **Asset Class** — an ingredient of a strategy (e.g., US total stock market,
  international stocks, bonds). Has a category and a representative market index
  used as its data source.
- **Allocation** — the percentage of a strategy assigned to each asset class
  (the recipe).
- **Backtest Run** — a specific simulation: a strategy, a starting amount, and a
  start/end date, producing a growth series and headline metrics.
- **Metric** — a computed figure for a run (total growth, annualized return,
  volatility, max drawdown), always paired with a plain-language label.
- **User Preference Set** — the answers to the personalization questions (time
  horizon, risk comfort) used to produce a recommendation. Held in memory only
  for the current session — not persisted to the device or any server.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor with no investing knowledge can understand
  at least one strategy (its allocation and who it suits) within 2 minutes of
  opening the app.
- **SC-002**: After selecting a strategy and entering an amount and period, the
  growth chart and four headline numbers appear within 1 second of the user's
  action.
- **SC-003**: A user can set up and view a side-by-side comparison of three
  strategies in under 2 minutes.
- **SC-004**: A user who completes the personalization questions receives a
  single recommended strategy and a one-paragraph rationale within 30 seconds.
- **SC-005**: 90% of beginner testers can correctly explain, in their own words,
  the trade-off between two compared strategies (growth versus calmness) after
  using the comparison view.
- **SC-006**: The app stays smooth and responsive during chart interactions
  (panning, comparing) on both desktop and mobile, with no frozen or janky
  screen.
- **SC-007**: Every error and empty state (no selection, bad input, missing
  data, offline) presents a friendly, actionable message — verified on desktop
  and mobile.
- **SC-008**: The full core flow (explore → visualize → compare → recommend) is
  completable using keyboard only and is readable by a screen reader.

## Assumptions

- **Currency & markets**: The bundled historical dataset covers broad global
  asset classes (US and international equities; government and corporate bonds;
  and other classes used in well-known passive strategies), with amounts shown
  in USD as the primary currency.
- **Data source**: Historical performance is computed from a curated,
  periodically-refreshed dataset of market-index returns (a backtest), not live
  account data. The bundled history spans **2000 to present (~25 years)**,
  which covers the 2008 and 2020 crashes and the full availability window of
  modern index funds; the specific data provider and refresh cadence are
  decided at planning time.
- **Scope — no money movement**: The app is read-only and educational. It never
  links to bank or brokerage accounts and never places trades.
- **Scope — historical, not predictive**: v1 shows historical backtests only.
  Forward-looking "expected future return" projections are out of scope for v1
  to avoid misleading beginners; they may be revisited later with strong
  guardrails.
- **Decision model**: The app provides both neutral comparison AND a guided
  recommendation, because the user explicitly asked to both "visualize"
  (compare) and "decide" (be guided).
- **No account required**: Core value needs no login. An optional future "save
  my pick" may add accounts later.
- **Stateless session**: A user's personalization answers and recommendation
  are held in memory for the current session only — never persisted to the
  device or a server. To keep a pick, the user uses the shareable link.
- **Audience**: The primary user is a non-professional individual investor in a
  developed market with stable internet.
- **Performance targets stated here are user-facing service levels** (e.g.,
  "chart within 1 second"). Concrete internal budgets (latency, payload size,
  frame rate) will be detailed in the plan, per the project constitution.
- **Disclaimers**: All outputs carry an "educational, not advice; past
  performance does not guarantee future results" disclaimer.
