---
name: llm-wiki
description: "LLM-maintained knowledge wiki living under wiki/. Use when the user adds a source (URL, article, paper, file, notes), asks to ingest/summarize/file/document something, asks a knowledge question that should build on accumulated notes, or asks to check/lint wiki health. Proactively file valuable findings, decisions, and research into the wiki so knowledge compounds across sessions instead of being re-derived each time."
---

# LLM Wiki

A persistent, compounding knowledge base for this project. Instead of
re-deriving answers from raw documents on every question (plain RAG), the
assistant **incrementally builds and maintains** a wiki of interlinked markdown
files. Knowledge is compiled once and kept current.

This file is the **schema** — it tells the assistant exactly how the wiki is
structured, what the conventions are, and what workflow to run on each
operation. It is what turns a generic chatbot into a disciplined wiki
maintainer. Co-evolve it as the domain settles.

Pattern source: Karpathy, "LLM Wiki"
(https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

## The split of labor

- **The human** curates sources, directs analysis, asks good questions, and
  decides what it all means.
- **The assistant** does everything else: summarizing, cross-referencing,
  filing, bookkeeping, linting. The assistant owns the wiki layer entirely.
  The human reads it; the assistant writes it.

## Directory layout

```
wiki/
  README.md            user-facing docs (how to use the wiki)
  index.md             CONTENT catalog — every page, one line each (assistant-maintained)
  log.md               CHRONOLOGICAL record — append-only (assistant-maintained)
  raw/                 IMMUTABLE sources. Read-only. The source of truth.
    *.md, *.pdf, *.png ...
  pages/
    summaries/         one page per ingested source (the compiled view of a source)
    entities/          people, products, tools, systems, datasets ...
    concepts/          topics, themes, decisions, theses ...
    synthesis/         cross-cutting overviews and comparisons the assistant writes
```

Hard rules:

- **`raw/` is immutable.** Never edit, rename, or delete files there. The
  assistant reads from it; only the human curates it.
- **`pages/` is fully owned by the assistant.** Create, update, merge, and
  relink freely. Match the style already present in a page before editing it.
- **`index.md` and `log.md` are assistant-maintained.** Update them on every
  ingest and every filed query answer.

## Page conventions

Every page under `pages/` starts with YAML frontmatter so the wiki is
queryable and lintable later:

```markdown
---
type: summary | entity | concept | synthesis
title: Human-readable title
tags: [kubernetes, infra]
sources: [[../raw/some-article.md]]
related: [[../pages/concepts/x.md]]
status: draft | stable | stale | superseded
updated: 2026-07-09
---

# Title

Body in plain markdown. Link freely with [[...]] wikilinks to other pages.
```

- Use `[[path/to/page.md]]` for cross-references. Prefer relative paths from
  the linking page so links survive moves.
- Filenames: lowercase-hyphenated, one concept per file
  (e.g. `kubernetes-networking.md`).
- Keep pages **short and atomic.** A page is a distinct thing you would link
  to from elsewhere. If it is just an attribute of something else, edit that
  page in place instead of making a new one.
- Cite sources inline, e.g. `Pods are the smallest deployable unit [[../raw/k8s-overview.md#pods]]`.

## The three operations

### 1. Ingest  (when the user adds a source)

Triggered when the user drops a file/URL/notes into `raw/` or says "add this",
"ingest this", "file this article", or pastes a URL.

Flow (do all steps; surface a short summary to the user at the end):

1. **Read** the source fully (text first; view referenced images after).
2. **Discuss** key takeaways with the user in one or two sentences.
3. **Write a summary page** at `pages/summaries/<slug>.md` with frontmatter.
4. **Update every related page.** For each entity/concept the source touches:
   either edit an existing page or create a new one. Note contradictions and
   where new data strengthens or challenges existing claims. A single source
   commonly touches 5–15 pages.
5. **Update `index.md`** — add a one-line entry for every new/changed page.
6. **Append to `log.md`** with the fixed prefix format (see below).

Prefer one source at a time and stay involved. Batch only when the user asks.

### 2. Query  (when the user asks a knowledge question)

1. **Read `index.md` first** to find relevant pages (it is a routing file, not
   something to scan in full).
2. Drill into the ~3–10 most relevant pages and read them.
3. Synthesize an answer **with citations** to the pages and underlying sources.
4. If the answer is valuable (a comparison, an analysis, a discovered
   connection), **offer to file it back into the wiki** as a new page under
   `pages/synthesis/`. Good answers should compound, not vanish into chat.

### 3. Lint  (periodic health check, or when asked to "check the wiki")

Run these checks. **Never delete files unilaterally** — flag for the user.
**Never** create content pages during lint; that is ingest's job. Do repair
frontmatter when the correct value is certain.

1. **Schema integrity** — pages missing required frontmatter fields
   (`type, title, tags, sources, status, updated`). Repair where unambiguous.
2. **Staleness** — surface the oldest pages; flag any contradicted by newer
   sources. Propose updates, do not apply unilaterally.
3. **Coverage gaps** — entities/concepts mentioned in pages but lacking their
   own page. List them; do not create them.
4. **Orphans** — pages with zero inbound links. Suggest which pages should link.
5. **Duplicates** — near-identical titles/files. List; never delete.
6. **Broken links** — `[[...]]` targets that no longer exist.

Produce a short markdown report, then append a `lint` entry to `log.md`.

## log.md entry format

Each entry starts with a fixed, parseable prefix so simple tools work:

```
## [2026-07-09] ingest | Kubernetes Overview
## [2026-07-09] query  | How does X compare to Y? (filed → pages/synthesis/x-vs-y.md)
## [2026-07-09] lint   | 2 orphans, 1 coverage gap
```

One-line body under each header with what changed.

## index.md format

Grouped by category, one line per page:

```
## Summaries
- [[../raw/k8s-overview.md]] — Kubernetes Overview (2026-07-09, 4 pages touched)

## Entities
- [[../pages/entities/karpenter.md]] — Karpenter: cluster autoscaler

## Concepts
- [[../pages/concepts/bin-packing.md]] — Bin packing tradeoffs

## Synthesis
- [[../pages/synthesis/karpenter-vs-cluster-autoscaler.md]] — side-by-side
```

## When to use this proactively

Invoke this skill (do not wait to be asked) when the user:
- pastes a URL, article, or document and wants it remembered,
- shares a decision, research finding, or "note to self" worth filing,
- asks a question that should build on accumulated notes rather than fresh web
  search,
- finishes a chunk of work whose learnings should persist.

Before answering a knowledge question in this project, check whether the wiki
already has a page on it. If it does, read it first.

## Scope boundary

This wiki holds **domain knowledge, research, and decisions.** It is
deliberately separate from `specs/` (which holds Spec-Driven Development
feature artifacts — spec.md/plan.md/tasks.md). Do not mix the two. A spec
decision that is also general domain knowledge can be summarized into a wiki
concept page and linked from the spec.

## Token hygiene

- Treat `index.md` as the **routing file** — read it first, then only the few
  relevant page bodies. Never scan the whole wiki to answer a query.
- Keep pages atomic and short so each read is cheap.
- For broad searches as the wiki grows, prefer a subagent (Task tool) to do
  the narrowing so the orchestrator context stays clean.
