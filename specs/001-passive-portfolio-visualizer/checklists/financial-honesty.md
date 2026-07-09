# Financial Honesty & Beginner Comprehensibility Checklist: Passive Portfolio Visualizer

**Purpose**: Validate that the spec's requirements for *financial honesty* (never fabricate, never soften, always disclaim) and *beginner comprehensibility* (plain-language, defined terms, no jargon) are complete, unambiguous, measurable, and consistent — before implementation begins. This is a formal review gate.
**Created**: 2026-07-09
**Resolved**: 2026-07-10 (spec.md updated to close every gap below)
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md)
**Risk areas treated as mandatory gating**: (i) Beginner comprehensibility, (ii) Financial-honesty guardrails.

**How to read**: Each item tests the *quality of the written requirements* — not whether the implementation works. A failing item means the spec is silent, vague, or inconsistent on a point that materially affects honesty or comprehensibility.

**Resolution convention**: Each item below now carries `→ Resolved:` pointing to the exact spec anchor that satisfies it. Items marked "pre-existing" were already satisfied by the 2026-07-10 clarification round; items marked "spec edit" were added in this pass.

---

## Financial Honesty Guardrails (Mandatory Gating)

- [x] CHK001 - Are requirements explicit that drawdowns MUST be shown unsmoothed and unhidden across **every** chart type (single growth, comparison overlay, drawdown view)? [Clarity, Spec §FR-007, Spec §Edge Cases]
  → Resolved (spec edit): FR-007 now enumerates every chart type plotting value over time — single-strategy growth chart, multi-strategy comparison overlay, and the dedicated worst-drawdown view — and requires the 2008/2020 crashes to appear as real dips in each.
- [x] CHK002 - Is the "never fabricate numbers" rule specified for all data-missing scenarios — asset pre-inception, partial range, fund gap, mid-series hole — not only the named edge cases? [Coverage, Spec §FR-012, Spec §Edge Cases]
  → Resolved (spec edit): the "Chosen period has missing data" edge case now enumerates pre-inception, partial-range, mid-series hole, and entirely-absent fund, and forbids invent/interpolate/carry-forward in every case.
- [x] CHK003 - Is "persistent disclaimer" (FR-011) quantified — always-visible vs. footer-only vs. per-output — so a reviewer can tell if a layout satisfies it? [Clarity, Ambiguity, Spec §FR-011]
  → Resolved (spec edit): FR-011 now quantifies "persistent" — the core notice (educational-not-advice + past-performance + source/vintage) is visible in the default layout on every view (fixed header/footer strip), not behind a click; methodology detail is the collapsible part.
- [x] CHK004 - Does the spec enumerate which disclaimer elements are mandatory: educational-not-advice, past-performance caveat, data source, data vintage? [Completeness, Spec §FR-011]
  → Resolved (pre-existing): FR-011 enumerates the core notice (educational-not-advice, past-performance, source + vintage) plus methodology items (rebalance frequency, proxy, refresh cadence, alignment rule).
- [x] CHK005 - Is it required that a disclaimer/explanation accompanies EACH output (chart, metric table, recommendation, shareable link), rather than a single global footer? [Coverage, Gap, Spec §FR-011]
  → Resolved (spec edit): FR-011's reachability clause now enumerates each output — every growth chart, the metric panel/table, the comparison view, the recommendation, and any shareable link.
- [x] CHK006 - Are requirements defined for what "truthful display" means numerically — e.g., forbidding averaging-of-annual-returns to mask year-to-year volatility? [Clarity, Gap, Spec §FR-005]
  → Resolved (pre-existing): FR-005 pins annualized return = CAGR, explicitly "never the arithmetic mean of yearly returns"; FR-007 forbids smoothing.
- [x] CHK007 - Is the read-only scope (no trades, no bank/brokerage linking) stated as an explicit testable requirement, not only an assumption? [Completeness, Spec §FR-009, Spec §Assumptions]
  → Resolved (pre-existing): FR-009 is an explicit MUST — no account, no credentials, no brokerage/bank linking, no trade execution.
- [x] CHK008 - Is the prohibition on forward-looking "expected return" projections stated as a v1 scope boundary the spec enforces? [Coverage, Spec §Assumptions]
  → Resolved (spec edit): new FR-013 makes this an enforced MUST (no Monte Carlo, no probability-of-success, no expected-return forecasts); every figure must be a labeled historical result. The assumption is retained as context.
- [x] CHK009 - Are requirements defined for the scenario where the **bundled dataset itself** has an anomaly/gap (distinct from a user picking a period with missing data)? [Edge Case, Gap]
  → Resolved (spec edit): new FR-014 requires build-time dataset validation (ascending months, no duplicates, no undocumented gaps, weights sum to 1.0) and that any anomaly fails the build or is documented before shipping — never silent.

## Beginner Comprehensibility (Mandatory Gating)

- [x] CHK010 - Is the plain-language standard for terms and explanations quantified or referenced (reading level, max sentence length, glossary format)? [Measurability, Gap, Spec §FR-003]
  → Resolved (pre-existing): FR-003's term-coverage rule is the measurable standard (zero undefined terms, verifiable by enumeration); glossary format is pinned as a one-line beginner definition (data-model.md §AssetClass.glossary).
- [x] CHK011 - Is ALL financial jargon required to have on-demand definitions, and is the term inventory bounded (which strings count as "terms")? [Completeness, Spec §FR-003]
  → Resolved (spec edit): FR-003 now bounds the inventory — a "financial term" is any investing/market/portfolio word or acronym outside everyday vocabulary, with concrete examples and a non-exhaustive exclusion list; the glossary is the single source of truth.
- [x] CHK012 - Is "who it suits" guidance required to reference *specific* investor profiles/situations rather than generic adjectives? [Clarity, Spec §FR-001]
  → Resolved (spec edit): FR-001 now requires "who it suits" to reference concrete horizon bands and risk tolerances (e.g. "needs the money within 5 years and cannot stomach a drop"), explicitly not generic adjectives.
- [x] CHK013 - Are trade-offs (growth potential vs. ride calmness) required to appear on EACH strategy detail, not only inside the comparison view? [Consistency, Spec §FR-001, Spec §Story 3]
  → Resolved (spec edit): FR-001 now requires a per-strategy growth-vs-calmness trade-off on the strategy's own detail view, not only inside the comparison view.
- [x] CHK014 - Is the comparison view required to present trade-offs **without** declaring a single "winner"? [Clarity, Spec §Story 3, Spec §FR-006]
  → Resolved (pre-existing): Story 3 acceptance scenario 3 explicitly requires the trade-off "presented plainly (not as a single 'winner')."
- [x] CHK015 - Are metric labels required to be paired with a plain-language definition **at the point of display** (not only in a separate glossary)? [Completeness, Spec §FR-005]
  → Resolved (pre-existing): FR-005 requires each metric shown "with a plain-language label and definition"; FR-003 requires an inline on-demand definition at the point of use.
- [x] CHK016 - Is the recommendation rationale required to be a self-contained paragraph mapping each user answer to the chosen strategy? [Clarity, Spec §FR-008]
  → Resolved (pre-existing): FR-008 requires a plain-language rationale that "explains the mapping" and "MUST state which tier each answer was assigned to"; contracts/recommendation.md defines it as one authored paragraph per cell.
- [x] CHK017 - Are requirements defined for how the rule-based recommendation handles ambiguous / in-between answers (e.g., medium horizon, mixed risk comfort)? [Coverage, Edge Case, Spec §FR-008]
  → Resolved (pre-existing): FR-008 states "in-between answers snap to the nearest tier; the rationale MUST state which tier each answer was assigned to."
- [x] CHK018 - Is jargon-avoidance required to extend to chart axes, metric names, tooltips, and button labels — not only body text? [Consistency, Gap]
  → Resolved (pre-existing): FR-003's term-coverage rule explicitly lists "chart axes, metric labels, tooltips, button labels, and body copy."
- [x] CHK019 - Is there a measurable requirement that a true beginner can complete the core flow without encountering any undefined acronym? [Measurability, Spec §SC-001, Spec §SC-008]
  → Resolved (pre-existing): FR-003 sets the bar at "zero undefined acronyms or un-glossaried financial terms across the core flow," verifiable by enumeration; SC-001/SC-008 cover the completable flow.

## Clarity & Measurability of the Honesty-Critical Metrics

- [x] CHK020 - Is "volatility" defined with a specific computation basis (e.g., annualized std-dev of monthly returns) in the spec, or explicitly deferred to plan.md? [Clarity, Ambiguity, Spec §FR-005]
  → Resolved (pre-existing): FR-005 pins volatility = "annualized standard deviation of monthly total returns (monthly std-dev × √12)."
- [x] CHK021 - Is "worst drawdown" defined unambiguously (peak-to-trough convention, window)? [Clarity, Spec §FR-005]
  → Resolved (pre-existing): FR-005 pins "largest peak-to-trough decline observed in the series (max drawdown); never smoothed or averaged."
- [x] CHK022 - Is "annualized return" defined as CAGR (not arithmetic mean) to prevent overstating performance? [Clarity, Ambiguity, Spec §FR-005]
  → Resolved (pre-existing): FR-005 pins "CAGR (compound annual growth rate), never the arithmetic mean of yearly returns."
- [x] CHK023 - Is "total growth" defined by unit (absolute USD vs. percentage vs. multiple)? [Clarity, Spec §FR-005]
  → Resolved (pre-existing): FR-005 pins "absolute USD gain/loss over the chosen period (ending value − starting amount), also shown as a percentage of the starting amount."
- [x] CHK024 - Are the four headline metrics required to use consistent units and time bases across single-run, comparison, and recommendation views? [Consistency, Spec §FR-005, Spec §FR-006]
  → Resolved (spec edit): FR-005 now requires identical definitions, units, and time bases across the single-strategy run, the comparison table, and the recommendation's growth/risk recap.
- [x] CHK025 - Is the data-alignment rule for strategies with different inception dates specified deterministically (latest-common-start) AND required to be disclosed to the user? [Clarity, Spec §Edge Cases]
  → Resolved (pre-existing): edge case "Comparing strategies with different start dates" requires aligning on the latest common start with a plain-language explanation; FR-011 lists the alignment rule as a disclosed methodology item.
- [x] CHK026 - Is the backtest rebalancing assumption (frequency, on-drift vs. calendar) specified, given it materially changes the numbers shown? [Completeness, Gap]
  → Resolved (pre-existing): FR-011 discloses "the rebalancing frequency, e.g. monthly"; research.md §R-3 and data-model.md specify monthly rebalance to target weights.

## Scenario Coverage & Edge Cases (Honesty Lens)

- [x] CHK027 - Are requirements defined for the partial-comparison case where SOME (not all) strategies in a comparison have missing data? [Coverage, Edge Case, Spec §Edge Cases]
  → Resolved (spec edit): FR-006 now requires showing the strategies that have data, plainly flagging which were excluded and why — never silently dropping a strategy or inventing its numbers.
- [x] CHK028 - Are crash-period displays required to carry contextual labeling that prevents panic misinterpretation, beyond "show the real losses"? [Clarity, Spec §Edge Cases]
  → Resolved (spec edit): the "Selected period is a market crash" edge case now requires contextual labeling — noting the period includes a known crash, that drawdowns are peak-to-trough (not total loss), and that the figure is historical.
- [x] CHK029 - Is slow/offline behavior specified to NEVER show stale or partially-computed numbers (only loading or friendly error)? [Clarity, Spec §FR-012, Spec §Edge Cases]
  → Resolved (spec edit): the "Slow or offline connection" edge case now states the system MUST NEVER display stale or partially-computed numbers while loading/unavailable — only a loading indicator or friendly error.
- [x] CHK030 - Are requirements defined for when a shareable link encodes inputs that are no longer valid (strategy removed, dates out of range)? [Edge Case, Gap, Spec §Story 4]
  → Resolved (pre-existing): edge case "Stale or invalid shareable link" plus clarification 2026-07-10 require a friendly "this link is out of date" notice, stating what was encoded, offering the nearest valid strategy/range, never inventing and never hard-walling.

## Dependencies, Assumptions & Conflicts

- [x] CHK031 - Is the assumption that the bundled dataset is "representative enough" of real fund returns validated or flagged as a known limitation shown to the user? [Assumption, Spec §Assumptions]
  → Resolved (spec edit): new "Data representativeness (known limitation)" assumption states the dataset is an academic stitch, not a literal fund track record, and MUST be disclosed to the end user (FR-011).
- [x] CHK032 - Is the intermediate-Treasury proxy for the corporate-bond sleeve (per plan.md) surfaced as a known limitation in a spec-level disclaimer, not only a dev doc? [Dependency, Gap, Plan §Summary]
  → Resolved (pre-existing): FR-011 explicitly discloses "any data proxy or substitution (e.g., an intermediate-Treasury series standing in for corporate bonds), stated as a known limitation."
- [x] CHK033 - Is the USD / developed-market scope assumption documented AND required to be disclosed to a non-US beginner? [Assumption, Spec §Assumptions]
  → Resolved (spec edit): the "Currency & markets" assumption now requires the USD-denominated, developed-market-weighted scope to be disclosed to the end user (FR-011).
- [x] CHK034 - Does the spec reconcile the tension between "beginner-friendly simplicity" and the technical complexity of an honest backtest methodology (i.e., where the line is drawn)? [Conflict, Gap]
  → Resolved (pre-existing): the reconciliation mechanism is explicit — FR-005 pins precise definitions but presents them with plain-language labels, and FR-011's collapsible "how these numbers are computed" area makes the rigorous methodology available on demand without forcing it on a beginner. Simple by default, precise on demand.
- [x] CHK035 - Are requirements defined for how the bundled data's source, vintage, and attribution are surfaced to the END USER (not only in DATA_SOURCES.md)? [Completeness, Spec §FR-011]
  → Resolved (pre-existing): FR-011 requires the source and vintage in the always-visible disclaimer and that disclosures be "reachable from each output... not buried only in developer documentation."

## Notes

- This checklist tests **requirements quality**, not implementation correctness. All 35 items now pass — every `[ ]` has been resolved to a `[x]` with a pointer to the exact spec anchor.
- Items flagged `[Gap]` indicate a requirement that appears to be missing entirely; `[Ambiguity]` indicates a term that is used but not defined; `[Conflict]` indicates tension between two spec sections.
- Traceability: every item references at least one anchor (`Spec §...`, `Plan §...`, or a gap marker) — ≥80% threshold met.
- Mandatory gating (per user instruction): all items in the first two sections (Financial Honesty Guardrails, Beginner Comprehension) are now resolved, so `/speckit.tasks` (already run) and `/speckit.implement` may proceed.
- Cross-cutting with existing `requirements.md` (the high-level spec-quality pass): this file goes deeper on the two highest-risk honesty/comprehension domains and does not duplicate the top-level checks.
- Spec changes made in this pass (2026-07-10): FR-001, FR-003, FR-005 (consistency clause), FR-006 (partial-comparison clause), FR-007 (chart-type enumeration), FR-011 (persistence quantification + output enumeration), new FR-013 and FR-014, edge-case expansions (missing-data, crash labeling, never-stale), and assumption additions (USD/developed-market disclosure, data-representativeness limitation). No existing requirement was weakened; all changes are additive clarifications.
