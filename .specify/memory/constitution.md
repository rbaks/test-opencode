<!--
==============================================================================
SYNC IMPACT REPORT
==============================================================================
Version change: (unfilled template) -> 1.0.0 -> 1.1.0 -> 1.2.0
  v1.0.0 (2026-07-09): Initial ratification of a previously unfilled
    [PLACEHOLDER] constitution. First concrete governance document.
  v1.1.0 (2026-07-09): MINOR bump. Added "UI Technology & Professionalism
    Standards" section mandating Tailwind CSS + maximum shadcn/ui usage and
    elevating UI professionalism to a first-class project priority. No
    existing principle removed or redefined -> MINOR, not MAJOR.
  v1.2.0 (2026-07-09): MINOR bump. Materially expanded the "UI Technology &
    Professionalism Standards" section to mandate TradingView Lightweight
    Charts as the default for all charting. New enforced technology
    constraint -> MINOR, not PATCH.

Modified principles:
  - [PRINCIPLE_1_NAME] -> I. Code Quality
  - [PRINCIPLE_2_NAME] -> II. Testing Standards (NON-NEGOTIABLE)
  - [PRINCIPLE_3_NAME] -> III. User Experience Consistency
  - [PRINCIPLE_4_NAME] -> IV. Performance Requirements
  - [PRINCIPLE_5_NAME] -> REMOVED (user specified 4 principles; the 5th
    template slot was dropped per "respect the number specified" rule)

Added sections:
  - Quality Gates (formerly [SECTION_2_CONTENT])              [v1.0.0]
  - Review Process (formerly [SECTION_3_CONTENT])             [v1.0.0]
  - Governance rules (ratified)                               [v1.0.0]
  - UI Technology & Professionalism Standards                 [v1.1.0]
    (NEW: mandates Tailwind CSS as sole styling layer, maximum shadcn/ui
    component usage, and a professionalism bar for every shipped UI)

Removed sections: none

Templates requiring updates:
  - .specify/templates/plan-template.md        -> N/A (Constitution Check
       section "[Gates determined based on constitution file]" is populated
       dynamically at /speckit.plan time; no static edit needed)   [no change]
  - .specify/templates/spec-template.md         -> N/A (FR/SC sections align
       with Testing Standards + Performance principles; no structural
       change required)                                              [no change]
  - .specify/templates/tasks-template.md        -> N/A (already includes test
       tasks + a "Performance optimization across all stories" polish task;
       aligns with the new principles)                              [no change]
  - .opencode/commands/speckit.*.md             -> DO NOT EDIT (managed files;
       tracked via .specify/integrations/opencode.manifest.json)     [no change]

Follow-up TODOs: none. All placeholders resolved. Project name derived from
AGENTS.md ("SDD Workspace"); update to the concrete product name once a
feature is specced via /speckit.specify.
==============================================================================
-->

# SDD Workspace Constitution

## Core Principles

### I. Code Quality

All code committed to this repository MUST be clean, readable, and
maintainable. Non-negotiable rules:

- **Simplicity first.** Implement the minimum that satisfies the spec. No
  speculative generality, no "flexibility" nobody asked for, no dead code.
  YAGNI is the default.
- **Surgical changes.** Touch only what the task requires. Do not refactor
  unrelated code, reformat untouched files, or "improve" passing tests.
- **Consistent style.** Every change MUST pass the project's linter and
  formatter (or the established equivalent for the stack). Naming,
  formatting, and structure follow existing conventions in the file/module
  being edited.
- **Readability over cleverness.** Prefer explicit, self-documenting code.
  A reviewer MUST be able to understand a change without the author present.
- **No secrets.** Credentials, keys, and tokens MUST NEVER be committed or
  logged.

**Rationale**: Code is read far more often than it is written. Quality at
the point of authorship prevents the compounding cost of debt and makes
review, testing, and convergence tractable.

### II. Testing Standards (NON-NEGOTIABLE)

Every unit of delivered functionality MUST be accompanied by tests that
prove it works and guard against regression. Non-negotiable rules:

- **Tests are required, not optional.** New behavior MUST ship with tests.
  Bug fixes MUST ship with a regression test that fails before the fix and
  passes after.
- **Behavior, not implementation.** Tests MUST verify observable behavior
  (inputs -> outputs, contracts, user journeys), not internal wiring.
- **Deterministic and isolated.** Tests MUST NOT depend on order, wall-clock
  time, network, or shared mutable state. Flaky tests are bugs and MUST be
  fixed before merge.
- **Fast feedback.** The unit suite MUST complete in seconds. Slow or
  environment-dependent checks belong in an integration tier, clearly
  separated.
- **Coverage is a floor, not a target.** Every new public surface (API
  endpoint, exported function, user-facing action) MUST have at least one
  passing test. Coverage metrics track regression, not completionism.

**Rationale**: Tests are the executable specification that makes
refactoring, parallelization, and convergence safe. Without them, every
change is a gamble.

### III. User Experience Consistency

Every user-facing surface MUST feel like one product built by one team.
Non-negotiable rules:

- **One design language.** UI MUST follow the established design system
  (components, spacing, typography, color, motion). Reuse existing
  components; introduce new ones only with justification.
- **Predictable interaction.** Similar actions MUST behave similarly across
  the product. Identical controls MUST produce identical results.
- **Graceful failure.** Every error state (empty, loading, error, offline,
  permission-denied) MUST be designed and tested -- never show a raw
  stack trace or unstyled blank screen to a user.
- **Accessible by default.** Interfaces MUST meet WCAG 2.1 AA: keyboard
  operable, screen-reader compatible, sufficient contrast, and respecting
  user motion/zoom preferences.
- **Consistent across target surfaces.** Behavior MUST be verified on every
  declared target platform/device; a feature is not "done" until it is
  correct on all of them.

**Rationale**: Inconsistency erodes trust faster than missing features. A
coherent, predictable, accessible experience is a competitive feature in
itself and reduces support load.

### IV. Performance Requirements

Performance is a feature and MUST be specified, measured, and defended like
one. Non-negotiable rules:

- **Budgets are explicit.** Every feature MUST declare measurable
  performance targets in its spec (latency, throughput, payload size, frame
  rate, memory -- whichever apply). "As fast as possible" is not a budget.
- **Measure before optimizing.** Performance claims MUST be backed by a
  measurement, not intuition. Optimize only the demonstrated bottleneck.
- **No regressions.** A change that regresses a declared budget beyond its
  threshold MUST NOT merge without explicit, documented justification.
- **Efficient by construction.** Avoid known anti-patterns for the stack
  (N+1 queries, unbounded lists, blocking the main/UI thread, unbatched
  network calls). Default to the efficient path unless a budget says
  otherwise.
- **Progressive under load.** The system MUST degrade predictably under
  load (slower, not corrupted) and MUST fail safely when a budget cannot be
  met.

**Rationale**: Performance budgets make "fast enough" a testable, enforceable
property rather than a subjective opinion. Defending them prevents the
slow, invisible decay of the user experience.

## UI Technology & Professionalism Standards

This project mandates a single, opinionated UI stack so that visual and
structural consistency is enforced by construction. **UI professionalism is
a first-class project priority, on par with the Core Principles above.**
Every shipped surface MUST look like it was built by one disciplined team
for paying customers.

- **Tailwind CSS is the ONLY styling layer.** All styling MUST be authored
  as Tailwind utility classes or Tailwind-driven design tokens. Custom CSS,
  inline `style` attributes, and alternative CSS-in-JS solutions are
  prohibited unless Tailwind genuinely cannot express the need -- and any
  exception MUST be justified in review.
- **shadcn/ui by default, to the maximum extent.** Any UI element that
  shadcn/ui provides MUST be built from the shadcn/ui component, never
  hand-rolled. Reach for the shadcn/ui primitive FIRST; drop to raw Tailwind
  only when no shadcn/ui component fits. "Maximum shadcn/ui usage" is
  literal: if a matching component exists in the registry, use it.
- **Composition over reinvention.** Customize shadcn/ui components through
  Tailwind classes and the established tokens (variants, spacing, radius,
  color, elevation). Do NOT fork components into bespoke variants that drift
  from the shared design language.
- **TradingView Lightweight Charts for all charting.** Any data
  visualization plotting series over an axis (price, time-series, financial,
  candlestick, line, area, histogram, bar) MUST use TradingView Lightweight
  Charts. Do NOT reach for a generic charting library (Chart.js, Recharts,
  D3, Victory, etc.) or hand-roll canvas/SVG plots when Lightweight Charts
  covers the need. Charts MUST be themed through Lightweight Charts' API to
  inherit the Tailwind/shadcn design tokens (colors, fonts, gridlines,
  crosshair) so they never look like a third-party widget bolted on. Drop to
  another library only when Lightweight Charts genuinely cannot express the
  required chart type -- and justify the exception in review.
- **Professionalism bar (the floor).** Every shipped UI MUST meet: pixel-
  accurate spacing and alignment, consistent radius and elevation, intentional
  color use (no default/placeholder/raw Tailwind palette colors in final UI),
  complete interaction states (hover, focus-visible, active, disabled,
  loading, error), responsiveness at every declared breakpoint, and zero
  visual jank. "Good enough for paying customers" is the minimum.
- **Consistency is the deliverable.** Because every surface uses the same
  stack and component set, consistency becomes mechanical rather than
  aspirational. A reviewer MUST reject hand-rolled alternatives to any
  existing shadcn/ui component.

**Rationale**: A single opinionated stack (Tailwind + shadcn/ui) is the most
reliable way to make "one professional product" a default outcome instead of
constant, error-prone effort. It also shrinks the test surface (fewer bespoke
components) and accelerates delivery (composable, documented primitives).

## Quality Gates

The following automated gates MUST pass before any change is considered
done. A feature is "complete" only when all gates are green.

- **Lint + format**: MUST be clean for the affected files.
- **Type check / build**: MUST succeed with zero errors (warnings tracked,
  not blocking unless a principle says otherwise).
- **Unit tests**: MUST pass; coverage MUST not drop below the prior
  baseline for touched modules.
- **Integration tests**: MUST pass for any changed contract, endpoint, or
  cross-component flow.
- **Constitution Check**: `/speckit.plan` gates (derived from this file)
  MUST be satisfied before Phase 0 research, and re-checked after Phase 1
  design.
- **Convergence**: `/speckit.converge` MUST report `converged` (no
  appended tasks) before a feature is declared done.

When a gate cannot be met, the deviation MUST be recorded in the feature's
plan under "Complexity Tracking" with the rejected simpler alternative and
its rationale.

## Review Process

- **Code review is mandatory.** No change merges without at least one
  approving review that explicitly confirms the four Core Principles are
  upheld (especially Testing Standards and Performance budgets).
- **Spec review precedes code.** Specs (`spec.md`) and plans (`plan.md`)
  MUST be reviewed and approved before implementation begins; this is where
  Quality, Testing, UX-Consistency, and Performance budgets are set.
- **Surgical diffs.** Reviewers MUST reject changes that bundle unrelated
  refactors, style rewrites, or scope creep with the task at hand.
- **Compliance verification.** Every review MUST check this constitution.
  A principle violation blocks merge regardless of test status.
- **Runtime guidance.** Authors and reviewers follow `AGENTS.md` for
  repository conventions and working principles; this constitution is the
  authoritative superset for governance.

## Governance

- This constitution is the **supreme** governance document for the project.
  Where any other practice, doc, or convenience conflicts with it, the
  constitution prevails.
- **Amendments** require: (1) a documented proposal, (2) review against
  existing specs/plans/tasks for propagation impact, (3) an explicit
  migration plan for any in-flight feature, and (4) a version bump.
- **Versioning** follows semantic versioning:
  - **MAJOR**: a principle is removed or redefined in a backward-incompatible
    way.
  - **MINOR**: a new principle or materially expanded guidance is added.
  - **PATCH**: clarifications, wording, typo fixes, non-semantic refinements.
- **Compliance review** is enforced automatically by `/speckit.plan`
  (Constitution Check gate) and `/speckit.converge` (final convergence),
  and manually at every code review.
- **Complexity must be justified.** Any deviation from a principle MUST be
  recorded with a rationale and the simpler alternative that was rejected.

**Version**: 1.2.0 | **Ratified**: 2026-07-09 | **Last Amended**: 2026-07-09
