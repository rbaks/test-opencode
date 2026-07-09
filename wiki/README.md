# LLM Wiki — your project's knowledge base

This is a **knowledge base that the AI builds and maintains for you**, instead
of re-reading your files from scratch every time you ask a question.

The idea comes from Andrej Karpathy's "LLM Wiki" write-up. The short version:
most AI tools (ChatGPT file uploads, NotebookLM, typical RAG) rediscover
knowledge on every question — nothing accumulates. Here, the AI **incrementally
builds a wiki** as you feed it sources, so the cross-references, summaries, and
synthesis are already done by the time you ask. The wiki gets richer with every
source.

## Who does what

- **You** curate sources, ask questions, and decide what things mean.
- **The AI** does all the bookkeeping — summarizing, cross-linking, filing,
  keeping pages consistent. You read the wiki; the AI writes it.

Think of it like a personal assistant who takes notes for you and keeps them
organized forever, for free.

## Where things live

```
wiki/
  README.md            this file
  index.md             the catalog — what's in the wiki (AI-maintained)
  log.md               the timeline — what happened when (AI-maintained)
  raw/                 YOUR sources go here (articles, papers, notes). Read-only for the AI.
  pages/
    summaries/         one AI-written page per source you add
    entities/          pages for people, tools, products, systems
    concepts/          pages for topics, themes, decisions
    synthesis/         cross-cutting overviews and comparisons the AI writes
```

`raw/` is the source of truth and never changes. `pages/` is the AI's workspace
— it creates and updates those freely.

## How to use it — three things you can say

### 1. Add something ("ingest")

Drop a file into `wiki/raw/`, or just paste a URL / article / notes and say:

> "add this to the wiki"  ·  "ingest this article"  ·  "file this"

The AI reads it, writes a summary page, updates every related page, and logs
it. A single source might touch 10–15 pages. It stays involved — you'll get a
short summary and can steer what to emphasize.

Example: paste a Kubernetes overview article →

```
"I found this k8s overview, add it to the wiki"
```

The AI then creates `pages/summaries/k8s-overview.md`, plus or updates pages
like `pages/entities/kubernetes.md`, `pages/concepts/pods.md`, etc.

### 2. Ask a question ("query")

Ask any knowledge question and the AI answers from the wiki, with citations:

> "how does Karpenter compare to the cluster autoscaler?"

It reads the index, drills into the relevant pages, and answers. If the answer
is valuable, it offers to **save it back into the wiki** as a new page — so
your explorations compound, they don't vanish into chat history.

### 3. Health check ("lint")

Every so often, ask the AI to check the wiki's health:

> "lint the wiki"  ·  "check the wiki for problems"

It looks for stale pages, contradictions, missing cross-references, orphaned
pages, and duplicates. It flags problems and proposes fixes — but never deletes
anything without your OK.

## Tips

- **Add sources one at a time** for best results. You stay in control of what
  gets emphasized. Batching works too if you want less involvement.
- **Every page carries metadata** (type, tags, sources, date, status) in a
  small header. This makes the wiki queryable and lintable.
- **The wiki is just a folder of markdown files.** You can browse it in any
  editor. If you use Obsidian, open the `wiki/` folder as a vault — the
  `[[...]]` links and graph view work out of the box.
- **It's separate from your specs.** This project uses Spec-Driven Development
  (`specs/` holds feature specs). The wiki holds domain knowledge and research.
  A spec decision worth remembering can be summarized into a wiki concept page.

## How the AI knows to use this

There's a skill file at `.opencode/skills/llm-wiki/SKILL.md` that acts as the
AI's instruction manual — it tells the AI exactly how to maintain the wiki
(folder layout, page format, the ingest/query/lint workflows). A pointer in the
project's `AGENTS.md` reminds the AI to use it, so you usually don't have to
ask — when you paste a source or ask a knowledge question, it kicks in.

## First source to add

The wiki is empty right now. To see it in action, try:

```
add this to the wiki: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
```

That's the original write-up this whole pattern is based on — a nice first
entry.
