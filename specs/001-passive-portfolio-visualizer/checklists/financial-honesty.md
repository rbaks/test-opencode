# Financial Honesty & Beginner Comprehensibility Checklist: Passive Portfolio Visualizer

**Purpose**: Validate that the spec's requirements for *financial honesty* (never fabricate, never soften, always disclaim) and *beginner comprehensibility* (plain-language, defined terms, no jargon) are complete, unambiguous, measurable, and consistent — before implementation begins. This is a formal review gate.
**Created**: 2026-07-09
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md)
**Risk areas treated as mandatory gating**: (i) Beginner comprehensibility, (ii) Financial-honesty guardrails.

**How to read**: Each item tests the *quality of the written requirements* — not whether the implementation works. A failing item means the spec is silent, vague, or inconsistent on a point that materially affects honesty or comprehensibility.

---

## Financial Honesty Guardrails (Mandatory Gating)

- [ ] CHK001 - Are requirements explicit that drawdowns MUST be shown unsmoothed and unhidden across **every** chart type (single growth, comparison overlay, drawdown view)? [Clarity, Spec §FR-007, Spec §Edge Cases]
- [ ] CHK002 - Is the "never fabricate numbers" rule specified for all data-missing scenarios — asset pre-inception, partial range, fund gap, mid-series hole — not only the named edge cases? [Coverage, Spec §FR-012, Spec §Edge Cases]
- [ ] CHK003 - Is "persistent disclaimer" (FR-011) quantified — always-visible vs. footer-only vs. per-output — so a reviewer can tell if a layout satisfies it? [Clarity, Ambiguity, Spec §FR-011]
- [ ] CHK004 - Does the spec enumerate which disclaimer elements are mandatory: educational-not-advice, past-performance caveat, data source, data vintage? [Completeness, Spec §FR-011]
- [ ] CHK005 - Is it required that a disclaimer/explanation accompanies EACH output (chart, metric table, recommendation, shareable link), rather than a single global footer? [Coverage, Gap, Spec §FR-011]
- [ ] CHK006 - Are requirements defined for what "truthful display" means numerically — e.g., forbidding averaging-of-annual-returns to mask year-to-year volatility? [Clarity, Gap, Spec §FR-005]
- [ ] CHK007 - Is the read-only scope (no trades, no bank/brokerage linking) stated as an explicit testable requirement, not only an assumption? [Completeness, Spec §FR-009, Spec §Assumptions]
- [ ] CHK008 - Is the prohibition on forward-looking "expected return" projections stated as a v1 scope boundary the spec enforces? [Coverage, Spec §Assumptions]
- [ ] CHK009 - Are requirements defined for the scenario where the **bundled dataset itself** has an anomaly/gap (distinct from a user picking a period with missing data)? [Edge Case, Gap]

## Beginner Comprehensibility (Mandatory Gating)

- [ ] CHK010 - Is the plain-language standard for terms and explanations quantified or referenced (reading level, max sentence length, glossary format)? [Measurability, Gap, Spec §FR-003]
- [ ] CHK011 - Is ALL financial jargon required to have on-demand definitions, and is the term inventory bounded (which strings count as "terms")? [Completeness, Spec §FR-003]
- [ ] CHK012 - Is "who it suits" guidance required to reference *specific* investor profiles/situations rather than generic adjectives? [Clarity, Spec §FR-001]
- [ ] CHK013 - Are trade-offs (growth potential vs. ride calmness) required to appear on EACH strategy detail, not only inside the comparison view? [Consistency, Spec §FR-001, Spec §Story 3]
- [ ] CHK014 - Is the comparison view required to present trade-offs **without** declaring a single "winner"? [Clarity, Spec §Story 3, Spec §FR-006]
- [ ] CHK015 - Are metric labels required to be paired with a plain-language definition **at the point of display** (not only in a separate glossary)? [Completeness, Spec §FR-005]
- [ ] CHK016 - Is the recommendation rationale required to be a self-contained paragraph mapping each user answer to the chosen strategy? [Clarity, Spec §FR-008]
- [ ] CHK017 - Are requirements defined for how the rule-based recommendation handles ambiguous / in-between answers (e.g., medium horizon, mixed risk comfort)? [Coverage, Edge Case, Spec §FR-008]
- [ ] CHK018 - Is jargon-avoidance required to extend to chart axes, metric names, tooltips, and button labels — not only body text? [Consistency, Gap]
- [ ] CHK019 - Is there a measurable requirement that a true beginner can complete the core flow without encountering any undefined acronym? [Measurability, Spec §SC-001, Spec §SC-008]

## Clarity & Measurability of the Honesty-Critical Metrics

- [ ] CHK020 - Is "volatility" defined with a specific computation basis (e.g., annualized std-dev of monthly returns) in the spec, or explicitly deferred to plan.md? [Clarity, Ambiguity, Spec §FR-005]
- [ ] CHK021 - Is "worst drawdown" defined unambiguously (peak-to-trough convention, window)? [Clarity, Spec §FR-005]
- [ ] CHK022 - Is "annualized return" defined as CAGR (not arithmetic mean) to prevent overstating performance? [Clarity, Ambiguity, Spec §FR-005]
- [ ] CHK023 - Is "total growth" defined by unit (absolute USD vs. percentage vs. multiple)? [Clarity, Spec §FR-005]
- [ ] CHK024 - Are the four headline metrics required to use consistent units and time bases across single-run, comparison, and recommendation views? [Consistency, Spec §FR-005, Spec §FR-006]
- [ ] CHK025 - Is the data-alignment rule for strategies with different inception dates specified deterministically (latest-common-start) AND required to be disclosed to the user? [Clarity, Spec §Edge Cases]
- [ ] CHK026 - Is the backtest rebalancing assumption (frequency, on-drift vs. calendar) specified, given it materially changes the numbers shown? [Completeness, Gap]

## Scenario Coverage & Edge Cases (Honesty Lens)

- [ ] CHK027 - Are requirements defined for the partial-comparison case where SOME (not all) strategies in a comparison have missing data? [Coverage, Edge Case, Spec §Edge Cases]
- [ ] CHK028 - Are crash-period displays required to carry contextual labeling that prevents panic misinterpretation, beyond "show the real losses"? [Clarity, Spec §Edge Cases]
- [ ] CHK029 - Is slow/offline behavior specified to NEVER show stale or partially-computed numbers (only loading or friendly error)? [Clarity, Spec §FR-012, Spec §Edge Cases]
- [ ] CHK030 - Are requirements defined for when a shareable link encodes inputs that are no longer valid (strategy removed, dates out of range)? [Edge Case, Gap, Spec §Story 4]

## Dependencies, Assumptions & Conflicts

- [ ] CHK031 - Is the assumption that the bundled dataset is "representative enough" of real fund returns validated or flagged as a known limitation shown to the user? [Assumption, Spec §Assumptions]
- [ ] CHK032 - Is the intermediate-Treasury proxy for the corporate-bond sleeve (per plan.md) surfaced as a known limitation in a spec-level disclaimer, not only a dev doc? [Dependency, Gap, Plan §Summary]
- [ ] CHK033 - Is the USD / developed-market scope assumption documented AND required to be disclosed to a non-US beginner? [Assumption, Spec §Assumptions]
- [ ] CHK034 - Does the spec reconcile the tension between "beginner-friendly simplicity" and the technical complexity of an honest backtest methodology (i.e., where the line is drawn)? [Conflict, Gap]
- [ ] CHK035 - Are requirements defined for how the bundled data's source, vintage, and attribution are surfaced to the END USER (not only in DATA_SOURCES.md)? [Completeness, Spec §FR-011]

## Notes

- This checklist tests **requirements quality**, not implementation correctness. A `[ ]` means the spec is silent/vague/inconsistent on that point — fix the spec, not the code.
- Items flagged `[Gap]` indicate a requirement that appears to be missing entirely; `[Ambiguity]` indicates a term that is used but not defined; `[Conflict]` indicates tension between two spec sections.
- Traceability: every item references at least one anchor (`Spec §...`, `Plan §...`, or a gap marker) — ≥80% threshold met.
- Mandatory gating (per user instruction): all items in the first two sections (Financial Honesty Guardrails, Beginner Comprehensibility) MUST be resolved before `/speckit.tasks` proceeds.
- Cross-cutting with existing `requirements.md` (the high-level spec-quality pass): this file goes deeper on the two highest-risk honesty/comprehension domains and does not duplicate the top-level checks.
