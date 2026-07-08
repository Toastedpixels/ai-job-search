# greenhouse-cli

CLI for searching jobs on Greenhouse-hosted company career boards.

**Base URL**: `https://boards-api.greenhouse.io/v1/boards/{company}/`
**Authentication**: None required.
**Scope**: **Company-specific.** There is no global keyword search across every
employer using Greenhouse — every request needs a board token (e.g. `toast`,
`datadog`). See `../url-reference.md` for the full endpoint reference and
`../SKILL.md` for how to find a company's token.

---

## Installation

```bash
cd .agents/skills/greenhouse-search/cli
bun install
```

---

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search job listings for one or more companies |
| `detail` | Fetch full detail for a single job listing |

All commands accept `--format json|table|plain` (default: `json`).
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

---

## `search` — Search job listings

```bash
bun run src/cli.ts search --company <token>[,<token2>,...] [flags]
```

Greenhouse's list endpoint returns a company's **entire** open-jobs list in one
call (no server-side pagination or keyword search), so `--query`, `--location`,
`--jobage`, and `--page` are all applied client-side after fetching.

### Flags

| Flag | Type | Default | Description |
|------|------|---------|--------------|
| `--company` / `-c` | string | — | **Required.** Comma-separated Greenhouse board token(s) |
| `--query` / `-q` | string | — | Case-insensitive substring match against job title |
| `--location` / `-l` | string | — | Case-insensitive substring match against location |
| `--jobage` | number | `9999` | Only include postings updated within N days |
| `--page` | number | `1` | 1-indexed page (25 results/page, client-side slice) |
| `--limit` / `-n` | number | — | Cap total results returned by the CLI (applied last) |
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

### Example

```bash
# Engineering roles at Toast
bun run src/cli.ts search -c toast -q "engineer" --format table

# Manager roles across Toast and Datadog, remote only, first 10
bun run src/cli.ts search -c toast,datadog -q "manager" -l "remote" --limit 10
```

### Response shape

```json
{
  "meta": { "count": 2, "total": 55, "page": 1, "companies": ["toast"] },
  "results": [
    {
      "id": "8008019",
      "title": "Director, Customer Success Data and Analytics Engineering",
      "company": "Toast",
      "location": "New York, NY",
      "date": "2026-07-08T11:58:06-04:00",
      "url": "https://careers.toasttab.com/jobs?gh_jid=8008019"
    }
  ]
}
```

**Field notes:**
- `id` — numeric Greenhouse job ID, as a string. Use this with `detail`.
- `company` — from the API's `company_name` field when present, otherwise the raw `--company` token you passed.
- `location` — free text from the posting, may be `null`.
- `date` — the posting's `updated_at` (falls back to `first_published`); may be `null`.
- `url` — the public apply-page URL; may be `null`.

---

## `detail` — Fetch full job listing detail

```bash
bun run src/cli.ts detail <company> <jobId> [--format json|plain]
```

`company` is the board token; `jobId` is the numeric ID from `search` results.

### Example

```bash
bun run src/cli.ts detail toast 8008019
bun run src/cli.ts detail toast 8008019 --format plain
```

### Response shape

```json
{
  "id": "8008019",
  "title": "Director, Customer Success Data and Analytics Engineering",
  "company": "Toast",
  "location": "New York, NY",
  "date": "2026-07-08T11:58:06-04:00",
  "url": "https://careers.toasttab.com/jobs?gh_jid=8008019",
  "description": "Full plain-text job description here...",
  "departments": "Customer Success : Customer Success Operations : Customer Success Data",
  "offices": "Boston, Massachusetts, USA"
}
```

**Field notes:**
- `description` — HTML stripped, entities decoded. Greenhouse's raw `content`
  field is HTML-entity **double**-encoded (e.g. `FP&A` round-trips as
  `FP&amp;amp;A`); the CLI decodes twice before stripping tags. See
  `../url-reference.md` for details.
- `departments` / `offices` — comma-joined names when multiple are present; `null` if none.

---

## Error handling

All errors are written to stderr in JSON format and exit with code `1`:

```json
{ "error": "the --company/-c flag is required (...)", "code": "NO_COMPANY" }
{ "error": "Job not found", "code": "NOT_FOUND" }
{ "error": "Request failed: 500 Internal Server Error", "code": "SEARCH_FAILED" }
```

A 404 on the board-list endpoint (unknown company token) is treated as "no
results" for that company rather than a hard failure when multiple `--company`
tokens are given; a 404 on the single-job endpoint is reported as `NOT_FOUND`.
