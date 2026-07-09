# Contract: Recommendation Lookup

**Branch**: `001-passive-portfolio-visualizer`

This is the app's **internal** contract for the personalized recommendation
(User Story 4, FR-008). It is a **deterministic, rule-based lookup** —
`(timeHorizon, riskComfort) → one strategy` — with a plain-language rationale.
There is **no scoring algorithm, no machine learning, no tie-breaking
randomness**. The same answers always produce the same recommendation, and
the reason is fully explainable in plain words (the user's explicit goal:
"help me decide").

In plain words: the user answers two simple questions — "roughly how long
until you need this money?" and "how comfortable are you watching the value
drop?" — and the app points them to the single strategy that best fits,
with a short paragraph explaining why.

---

## Module: `src/lib/recommend.ts`

### `recommend(prefs) → Recommendation`

```ts
interface Recommendation {
  strategyId: string;          // Exactly one strategy
  rationale: string;           // One paragraph, plain language, explains the mapping
}

function recommend(prefs: UserPreferenceSet): Recommendation;
```

**Contract guarantees**:
- **Total** on valid `UserPreferenceSet` (never throws, never returns null).
- **Deterministic**: `recommend(prefs)` is a pure function of `prefs` — same
  answers, same result, every time.
- **Exactly one** `strategyId` (never a list, never "it depends").
- **Non-empty rationale** that references the user's specific answers.

---

## The lookup matrix

The recommendation maps the user's two answers to one of the six bundled
strategies (see [data-model.md](../data-model.md) §Strategy). The matrix
honors the core investing principle that **longer horizons and higher risk
comfort justify more growth-oriented (and more volatile) portfolios**.

|  | **Risk comfort: LOW** (can't stomach big drops) | **MEDIUM** (some drops OK) | **HIGH** (ride it out) |
|---|---|---|---|
| **Horizon: SHORT** (< 5 yrs) | `conservative-income` | `conservative-income` | `60-40` |
| **Horizon: MEDIUM** (5–15 yrs) | `conservative-income` | `60-40` | `growth-tilt` |
| **Horizon: LONG** (> 15 yrs) | `60-40` | `three-fund` | `all-equity` |

**Rationale seed text** (each cell produces a one-paragraph reason that names
the user's answers and the strategy's profile). Example for
`(long, high) → all-equity`:

> You said you don't need this money for **more than 15 years** and you're
> **comfortable seeing the value drop** along the way. Over long stretches,
> a globally diversified all-equity portfolio has historically delivered the
> highest growth — at the cost of the bumpiest ride. With decades to recover
> from any dip, that trade-off fits your answers. The **All-Equity (Global)**
> strategy puts your money to work across US, developed, and emerging
> markets. Remember: past performance does not guarantee future results.

The rationale text is authored per-cell (not generated) so it stays
plain-language and auditable. The `recommend` function selects the cell's
`strategyId` and returns its authored rationale.

---

## Coverage and validation

- **Every cell is filled** — all 9 `(horizon × risk)` combinations map to a
  strategy. A test enumerates all 9 and asserts each returns a valid
  `strategyId` present in the strategy library.
- **Every rationale references both answers** — a test asserts the rationale
  contains the horizon label and the risk label.
- **No strategy is silently unreachable** — `all-weather` is reachable via
  the compare/recommend secondary surface (it appears in the library and in
  comparisons); its absence from the primary matrix is intentional (it
  overlaps `three-fund` on the matrix's purpose). This is documented, not a
  gap.

---

## Why rule-based (not optimized)

The spec (FR-008, clarification 2026-07-09) explicitly requires a **fixed
rule-based lookup**: "time horizon + risk tier map deterministically to one
strategy, fully explainable in plain words." This rules out:

- *Optimization / efficient-frontier solvers.* Rejected: opaque, hard to
  explain to a beginner, and sensitive to the input data window (would give
  different answers as the dataset refreshes).
- *Risk-tolerance scoring questionnaires (10+ questions).* Rejected: the spec
  asks for "a short set of questions." Two well-chosen questions (horizon +
  comfort) capture the dominant axes of the decision for a beginner.
- *ML / learned models.* Rejected: not explainable, not deterministic across
  refreshes, and grossly over-engineered for 6 strategies.
