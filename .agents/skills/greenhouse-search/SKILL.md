---
name: greenhouse-search
version: 1.0.0
description: >
  Use this skill to search job openings on a specific company's Greenhouse-hosted
  career board, or to fetch a single posting's full detail. Greenhouse is a common
  US applicant-tracking system (ATS) — companies like Toast, Datadog, and HubSpot
  post their openings at boards.greenhouse.io/<company>. This is a COMPANY-SCOPED
  search: there is no global keyword search across every employer using Greenhouse,
  so the user (or caller) must supply the company's board token. Trigger phrases:
  "check <company>'s Greenhouse board", "jobs at <company>" (when <company> is
  known to use Greenhouse), "Greenhouse job board", "boards.greenhouse.io", ATS
  job board lookup, company careers page powered by Greenhouse.
context: fork
allowed-tools: Bash(bun run .agents/skills/greenhouse-search/cli/src/cli.ts *)
---

# Greenhouse Search Skill

Search live job listings from a company's public Greenhouse job board. No
authentication, no API key, and **zero runtime dependencies** — it runs with
just `bun`.

## Important: this is company-scoped, not a global search

Unlike `linkedin-search`, Greenhouse's public API has **no cross-company keyword
search**. Every request is scoped to one (or more) specific company board(s) via
a **board token**. You must know the company's token before you can search —
there is no way to ask "find me data engineer jobs anywhere on Greenhouse."

### Finding a company's board token

The token is the slug in the company's Greenhouse careers URL:

- `https://boards.greenhouse.io/toast` → token is `toast`
- `https://boards.greenhouse.io/datadog` → token is `datadog`

Many companies embed their Greenhouse board on their own careers page (e.g.
`careers.toasttab.com`) without the `boards.greenhouse.io` URL ever being
visible. If you don't know the token, try the obvious lowercase company name
first (`toast`, `datadog`, `hubspot`) — if that 404s, search the web for
`"<company> careers greenhouse"` or check the company's careers page footer/
network requests for a `boards-api.greenhouse.io` or `boards.greenhouse.io`
reference.

Not every company uses Greenhouse. If a token 404s, the company likely uses a
different ATS (Workday, Lever, iCIMS, SmartRecruiters, etc.) — that's outside
this skill's scope.

## Commands

### Search job listings

```bash
bun run .agents/skills/greenhouse-search/cli/src/cli.ts search --company <token>[,<token2>,...] [flags]
```

Flags:
- `--company <token(s)>` / `-c <token(s)>` — **required.** One or more comma-separated Greenhouse board tokens, e.g. `toast` or `toast,datadog`. Multiple tokens are fetched sequentially (with a short delay between companies) and merged.
- `--query <text>` / `-q <text>` — case-insensitive substring match against the job title.
- `--location <text>` / `-l <text>` — case-insensitive substring match against the posting's location.
- `--jobage <days>` — only include postings updated within the last N days. Skipped gracefully if a posting has no usable date.
- `--page <n>` — 1-indexed page over the merged/filtered results (25 per page; Greenhouse's API itself has no pagination — this is a client-side slice).
- `--limit <n>` / `-n <n>` — cap the final result count (applied after paging).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/greenhouse-search/cli/src/cli.ts detail <company> <jobId> [--format json|plain]
```

`company` is the board token; `jobId` is the numeric ID from `search` results
(e.g. `8008019`). Returns the full description (HTML stripped, entities
decoded), department(s), and office/location(s).

## Usage examples

```bash
# Engineering roles at Toast
bun run .agents/skills/greenhouse-search/cli/src/cli.ts search -c toast -q "engineer" --format table

# Manager roles across two companies, remote only
bun run .agents/skills/greenhouse-search/cli/src/cli.ts search -c toast,datadog -q "manager" -l "remote" --limit 10

# Full detail for a specific posting
bun run .agents/skills/greenhouse-search/cli/src/cli.ts detail toast 8008019 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- Data source: `boards-api.greenhouse.io` — the public JSON feed Greenhouse-hosted
  career pages embed client-side. No credentials required.
- Greenhouse's `content` (job description) field is **HTML-entity double-encoded**
  in the raw API response (e.g. `FP&A` round-trips as `FP&amp;amp;A`). The CLI
  decodes entities twice before stripping tags so descriptions read cleanly.
- The list endpoint (`/jobs`) returns every open posting for a board in one call —
  there's no server-side pagination or keyword filtering, so `--query`/`--location`/
  `--jobage`/`--page` are all applied client-side after fetching.
- `date` is the posting's `updated_at` (falls back to `first_published`); if a
  posting is missing a usable date, `--jobage` filtering is skipped for it rather
  than dropping it.
- Verified live against Toast's, Datadog's, and HubSpot's Greenhouse boards.
