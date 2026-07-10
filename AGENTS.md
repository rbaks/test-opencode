# AGENTS.md

This repository is a **Spec-Driven Development (SDD) workspace** initialized with
[spec-kit](https://github.com/github/spec-kit) `0.12.8` using the **opencode**
integration. There is no application code yet — features are specced, planned,
and decomposed into tasks *before* any implementation is written. Do not look
for "the app"; the deliverables here are the SDD artifacts under `specs/`.

The root marker for spec-kit is **`.specify/`**, not `.git/` — all scripts in
`.specify/scripts/bash/` walk upward looking for it. This workspace is currently
**not a git repository**; `git rev-parse` will fail, which is expected.

## Working principles (non-negotiable)

Apply Andrej Karpathy's four principles to every change in this repo
(see https://github.com/multica-ai/andrej-karpathy-skills):

1. **Think before coding** — state assumptions explicitly, present tradeoffs,
   push back on overcomplicated approaches, ask before guessing.
2. **Simplicity first** — minimum spec/plan/code that solves the problem. No
   speculative sections, no "flexibility" nobody asked for.
3. **Surgical changes** — touch only what the task requires. Do not refactor
   unrelated spec sections, edit managed command files, or "improve" existing
   artifacts. Match the style already in the file.
4. **Goal-driven execution** — define verifiable success criteria and loop until
   they pass (this is exactly what speckit checklists + converge provide).

These align with spec-kit's own design: spec-first, append-only convergence,
non-negotiable constitution.

## Plain-language communication (non-negotiable)

Always speak simply and intuitively. Avoid jargon, acronyms, and unnecessary
technical complexity when a plain word will do. The goal is that **anyone
reading the output — technical or not — can understand it on the first pass**.

**Assume the prompting user is a beginner.** Default to giving context before
diving into a new or complicated topic. When a concept is introduced, take a
sentence or two to set the stage — what it is, why it matters, and what a
familiar version of it looks like — *before* explaining how it works or asking
the user to decide. If you are unsure whether the user already knows a term,
explain it. It is always better to over-explain than to leave the user lost.

Example: instead of opening with "we'll use a reverse proxy with TLS
termination", start with "a reverse proxy sits in front of your app and handles
incoming requests — think of it as a receptionist who greets visitors before
they reach your team. The TLS part just means it encrypts the traffic." Then
continue.

This applies whenever you interact: proposing technical solutions, presenting
feature options, explaining tradeoffs, or describing how something works.

Rules:

1. **Prefer plain words over jargon.** Say "a way to log in" instead of
   "an authentication mechanism", "store the data" instead of "persist the
   payload to the datastore", "two choices" instead of "two mutually-exclusive
   options".
2. **Use a concrete example for every option or solution you propose.**
   Don't just name an approach — show what it looks like in practice. A short
   before/after, a tiny snippet, or a real-world analogy beats a paragraph of
   abstract description.
3. **Define any unavoidable term the first time it appears.** If you must use
   "idempotent", follow it with "(running it twice has the same effect as
   running it once)".
4. **Short sentences. One idea per sentence.** If a sentence has more than two
   commas, split it.
5. **No filler.** Skip the preamble and the recap. Say the thing, then stop.

Good example (proposing a feature option):

> **Option A — "Remember me" checkbox on the login screen.**
> When checked, the user stays logged in for 30 days even after closing the
> browser. Example: like Gmail — you log in once and you're in for weeks.
> Tradeoff: slightly less secure on shared computers.

Bad example:

> **Option A.** Implement a persistent-session token with a 30-day TTL leveraging
> the existing JWT infrastructure, exposing a user-controllable toggle on the
> authentication surface to opt into extended session retention.

Both describe the same thing. Only the first is useful to a reader.

## SDD command lifecycle

Commands are invoked as `/speckit.<command>` — the separator is **`.`**
(configured in `.specify/integration.json` → `integration_settings.opencode.invoke_separator`).

Strict order, enforced by prerequisite checks:

```
/speckit.constitution   → define principles (run first; currently an unfilled template)
/speckit.specify <what> → specs/<NNN>-<short>/spec.md          (WHAT/WHY only, no tech)
/speckit.clarify        → up to 5 targeted questions → patches spec.md
/speckit.plan           → plan.md, research.md, data-model.md, contracts/, quickstart.md
/speckit.checklist      → checklists/*.md ("unit tests for requirements", not for code)
/speckit.tasks          → tasks.md (dependency-ordered, [P] marks parallelizable tasks)
/speckit.analyze        → non-destructive cross-artifact consistency check
/speckit.implement      → executes tasks.md phase-by-phase, marks [X] as it goes
/speckit.converge       → APPEND-ONLY: re-checks code vs spec/plan/tasks, adds Phase N: Convergence
/speckit.taskstoissues  → pushes tasks to GitHub (requires github MCP server)
```

`/speckit.plan`, `/speckit.tasks`, `/speckit.implement`, and `/speckit.converge`
each run `.specify/scripts/bash/check-prerequisites.sh` from the **repo root**
first. Run every speckit command from the repo root — relative paths in the
commands assume it.

If a prerequisite is missing, the script exits non-zero with an actionable
message naming which command to run. Do not work around it.

## Project state

- **Active feature**: tracked in `.specify/feature.json` → `feature_directory`
  key. Written by `/speckit.specify`, read by every downstream command.
  Currently absent → no feature has been specced yet.
- **Feature numbering**: `sequential` (`.specify/init-options.json`) →
  `specs/NNN-<short-name>` (3-digit, e.g. `003-user-auth`).
- **Constitution**: `.specify/memory/constitution.md` is a **non-negotiable**
  governance document but is currently an unfilled `[PLACEHOLDER]` template.
  `/speckit.converge` and `/speckit.plan` gracefully skip constitution checks
  when it is unfilled. Run `/speckit.constitution` to fill it before relying on
  constitution enforcement.
- **Extension hooks**: `.specify/extensions.yml` is checked by every command
  for `before_*` / `after_*` hooks. File is absent → all hooks silently skip.

## Environment overrides

- `SPECIFY_FEATURE_DIRECTORY` — point a command at a specific feature dir
  (relative paths resolve under repo root; absolute paths used as-is).
  Overrides and persists to `.specify/feature.json`.
- `SPECIFY_INIT_DIR` — point a command at a different spec-kit project root
  (monorepo / CI use). Must exist and contain `.specify/`; strict, no fallback.
- `SPECIFY_FEATURE` — explicit feature identifier (set by extensions).

## Conventions that are easy to get wrong

- **`/speckit.converge` is append-only.** It must never modify `spec.md`,
  `plan.md`, or existing tasks — it only appends one `## Phase N: Convergence`
  section to `tasks.md`. If the code already matches intent, it leaves
  `tasks.md` byte-for-byte unchanged (no empty header).
- **`/speckit.implement` marks completed tasks `[X]` in `tasks.md`** as it
  runs. Do not forget this when resuming.
- **Single quotes in command args**: escape as `'I'\''m Groot'` or use double
  quotes (`"I'm Groot"`). Every command's setup step calls this out.
- **`.opencode/commands/speckit.*.md` are managed files.** SHA256 checksums are
  tracked in `.specify/integrations/opencode.manifest.json`. Do not hand-edit
  them — re-run the spec-kit installer to update. `.opencode/.gitignore`
  excludes `node_modules/` and `package*.json`; only `@opencode-ai/plugin` is a
  dependency.
- **Templates resolve through a priority stack**: `.specify/templates/overrides/`
  → presets → extensions → `.specify/templates/` (core). Higher-priority
  `replace` layers win entirely; non-replace strategies (`prepend`/`append`/
  `wrap`) compose layers above the nearest `replace` base.
- **Spec is WHAT/WHY; plan is HOW.** Spec must stay technology-agnostic (no
  frameworks, libraries, response-time-in-ms). Implementation detail belongs in
  `plan.md` / `tasks.md`. Checklists enforce this.
- **Checklists validate *requirements quality*, not implementation correctness.**
  "Are success criteria measurable?" — not "does the API return 200?".

## Verification

There is no test suite or build step. "Done" for a feature means:

1. `check-prerequisites.sh --json --require-tasks --include-tasks` runs clean
   from repo root.
2. All checklist files in `<feature>/checklists/` pass (0 incomplete items).
3. `/speckit.analyze` reports no consistency violations across
   `spec.md` / `plan.md` / `tasks.md`.
4. `/speckit.converge` reports `converged` (no appended tasks).

## LLM Wiki (knowledge base)

This project has a persistent, assistant-maintained knowledge base under
`wiki/`, implementing Karpathy's "LLM Wiki" pattern. It is **separate from
`specs/`** — `specs/` holds SDD feature artifacts; `wiki/` holds domain
knowledge, research, and decisions that should compound across sessions.

The full instructions live in the **`llm-wiki` skill**
(`.opencode/skills/llm-wiki/SKILL.md`). Invoke that skill (it is the schema)
before doing any wiki work. User-facing docs are in `wiki/README.md`.

**Auto-use it.** Do not wait to be asked when the user:
- pastes a URL / article / document / notes and wants it remembered → **ingest**
  (write to `wiki/raw/`, then build/update pages),
- shares a decision or research finding worth filing → file it as a concept page,
- asks a knowledge question → first check `wiki/index.md` for an existing page,
  read it, then answer with citations,
- asks to "lint" / "check the wiki" → run the health-check workflow.

Three operations: **ingest** (add a source), **query** (answer from the wiki),
**lint** (health check). Rules: `wiki/raw/` is immutable; the assistant fully
owns `wiki/pages/`, `wiki/index.md`, and `wiki/log.md`; never delete during
lint without user approval.

## Deployment

The app is a **Vite + React** SPA hosted on **Vercel**, auto-deployed from the
GitHub repo `github.com/rbaks/test-opencode`.

- **Platform**: Vercel. The GitHub repo is connected via the Vercel dashboard
  (sign in with GitHub → Import Project). No GitHub Action is needed — Vercel
  listens for pushes itself.
- **Production branch**: `main`. Every push to `main` triggers a production
  deploy. Pushes to other branches get a preview URL.
- **Vercel auto-detects Vite**: Build Command `npm run build`, Output Directory
  `dist`, Install Command `npm install`. These are filled in automatically on
  import — no override needed.
- **Routing**: `vercel.json` at repo root rewrites all routes to `index.html`
  so client-side routes (`react-router-dom`) don't 404 on refresh/direct visit.
  Do not delete it.
- **Local build before pushing** (optional sanity check): `npm run build`
  produces `dist/`. If the build fails locally it will fail on Vercel too.
