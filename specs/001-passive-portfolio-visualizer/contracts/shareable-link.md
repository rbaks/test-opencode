# Contract: Shareable Link (URL State)

**Branch**: `001-passive-portfolio-visualizer`

This is the app's **external** interface: the format of a shareable link that
one user sends to another. Opening the link must reproduce the sender's view
**with no server, no database, and no account** — the URL *is* the storage
([research.md](../research.md) §R-1, §R-7).

In plain words: when a user picks a strategy, an amount, a date range, or a
comparison set, the app writes those choices into the web address itself.
Anyone who opens that exact address sees the exact same thing. Nothing is
saved anywhere else.

---

## URL shape

The app lives at path `/` on a static host. Shareable state is encoded as
**flat query parameters** with short keys, appended after `?`:

```text
https://<host>/?s=<strategyId>&a=<amount>&from=<YYYY-MM>&to=<YYYY-MM>&cmp=<ids>&view=<view>&quiz=<answers>
```

| Param | Required | Type | Example | Meaning |
|---|---|---|---|---|
| `s` | optional | strategy slug | `60-40` | The currently focused strategy (explore/visualize) |
| `a` | optional | integer > 0 | `10000` | Starting amount in USD |
| `from` | optional | `YYYY-MM` | `2000-01` | Backtest start month |
| `to` | optional | `YYYY-MM` | `2025-06` | Backtest end month |
| `cmp` | optional | comma-sep slugs | `60-40,three-fund` | Comparison set (0–3 strategies) |
| `view` | optional | enum | `compare` | Active panel: `explore` \| `visualize` \| `compare` \| `recommend` (default `explore`) |
| `quiz` | optional | `<horizon>.<risk>` | `long.medium` | Personalization answers: `short|medium|long` `.` `low|medium|high` |

**A representative link** (~50 chars):
`https://app.example/?s=60-40&a=10000&from=2000-01&to=2025-06&view=visualize`

**A recommendation link**:
`https://app.example/?quiz=long.medium&view=recommend`

---

## Encoding rules

1. **Flat short keys** — no JSON blob, no base64, no compression library.
   The state is 5–8 small flat fields; flat params are the shortest realistic
   encoding and stay human-readable/debuggable (R-7).
2. **Path stays at `/`** — so **no SPA-fallback rewrite** is needed on any
   static host (GitHub Pages, Netlify, Cloudflare Pages). Both query and hash
   params bypass the deep-link-404 problem; query is chosen as the standard.
3. **Slugs** must be URL-safe (lowercase, `[a-z0-9-]`). Strategy ids are
   authored to satisfy this (data-model.md).
4. **Validation on decode**: any unrecognized/invalid value is silently
   dropped (the app falls back to its default state), never thrown. A
   malformed link must show a usable app, not an error (FR-012).

---

## Round-trip contract (the testable guarantee)

`encode(state) → URL string → decode(URL) → state'` must satisfy:

- **`decode(encode(state))` deep-equals `state`** for every valid `state`.
  This is the primary contract test (a single property test covers it).
- **`encode` is total** on valid `state` (never throws).
- **`decode` is total on every input** (never throws; worst case → default
  state). This is what makes arbitrary links safe to open.

---

## History behavior (push vs replace)

- **`pushState`** on discrete commits (selecting a strategy, adding to
  comparison, changing the date range, answering a quiz question, generating a
  recommendation) → the browser Back button restores the previous state.
- **`replaceState`** (debounced ~300–500 ms) on continuous edits (typing the
  amount, dragging a slider) → no history spam.

Implementation: `react-router`'s `useSearchParams` (or a tiny
`useSyncExternalStore` hook if react-router is dropped). The hook owns both
directions (push/replace and the `popstate` listener).

---

## Pure-function surface (`src/lib/url-state.ts`)

```ts
interface ShareableState {
  strategyId?: string;
  amount?: number;
  from?: string;        // 'YYYY-MM'
  to?: string;          // 'YYYY-MM'
  compare?: string[];   // 0..3 strategy ids
  view?: 'explore' | 'visualize' | 'compare' | 'recommend';
  quiz?: { timeHorizon: TimeHorizon; riskComfort: RiskComfort };
}

// Encodes state → query string (without the leading '?').
function encodeState(state: ShareableState): string;

// Decodes a query string (with or without leading '?') → state.
// Total: never throws; invalid/unknown values are dropped.
function decodeState(query: string): ShareableState;
```

These two functions are the contract. The React hook is a thin wrapper that
calls them and keeps `window.location` in sync.
