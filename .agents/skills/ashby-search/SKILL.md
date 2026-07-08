---
name: ashby-search
version: 1.0.0
description: >
  Use this skill to search job listings on a specific company's Ashby-hosted
  job board (jobs.ashbyhq.com/<company>), or to fetch the full detail of one
  posting from that board. This is COMPANY-SCOPED, not a global search — Ashby
  has no keyword search across every employer that uses it, so the user (or
  the calling skill) must supply the target company's Ashby board token.
  Trigger phrases: Ashby, jobs.ashbyhq.com, "check <company>'s Ashby board",
  "search <company> jobs on Ashby", ATS job board, applicant tracking system
  job board, startup job board, scale-up careers page.
context: fork
allowed-tools: Bash(bun run .agents/skills/ashby-search/cli/src/cli.ts *)
---

# Ashby Search Skill

Search live job listings on **Ashby-hosted company job boards** using Ashby's public,
unauthenticated `posting-api`. No credentials, no API key, and **zero runtime
dependencies** — it runs with just `bun`.

## ⚠️ Company-scoped, not a global search

Unlike `linkedin-search`, this is **not** a keyword search across every employer.
Ashby's public API only exposes one company's board at a time:

```
GET https://api.ashbyhq.com/posting-api/job-board/<company>
```

You must supply `--company <token>` — the employer's Ashby board slug. Find it by
visiting the company's careers page and looking at the URL: if it's hosted at
`jobs.ashbyhq.com/acmeinc`, the token is `acmeinc`. You can pass multiple tokens
comma-separated (`--company acmeinc,otherco`) to search several boards in one call;
they're fetched sequentially with a short delay between requests, then merged.

Ashby is adopted mostly by **startups and scale-ups** — it is much less likely to
turn up large enterprise employers (healthcare/pharma majors, big tech, gaming
studios, aerospace, logistics giants) than the Danish portals or LinkedIn.

## When to use this skill

- You already know (or can find) a specific company's Ashby board token and want
  to search or browse their open roles
- You want the full description of one posting from that board

## Commands

### Search a company's board

```bash
bun run .agents/skills/ashby-search/cli/src/cli.ts search --company <token>[,<token2>,...] [flags]
```

Key flags:
- `--company <tokens>` / `-c <tokens>` — **required.** Comma-separated Ashby board token(s), e.g. `linear` or `linear,ramp`.
- `--query <text>` / `-q <text>` — case-insensitive substring match against the job title.
- `--location <text>` / `-l <text>` — case-insensitive substring match against location; `remote` also matches jobs flagged `isRemote`.
- `--jobage <days>` — posted within N days (based on Ashby's `publishedAt`). Omit for all postings.
- `--page <n>` — 1-indexed page over the filtered results (20/page, client-side — Ashby returns the whole board in one call).
- `--limit <n>` / `-n <n>` — cap total results emitted (applied after paging).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/ashby-search/cli/src/cli.ts detail <company> <jobId> [--format json|plain]
```

`company` is the Ashby board token; `jobId` is the id from a `search` result (a UUID,
e.g. `d3bc1ced-3ce4-4086-a050-555055dbb1ff`). Ashby has no working unauthenticated
per-job endpoint (see `url-reference.md`), so `detail` re-fetches the company's full
board and finds the job by id — the same request `search` makes.

## Usage examples

```bash
# All open roles at Linear
bun run .agents/skills/ashby-search/cli/src/cli.ts search --company linear --format table

# Engineering roles at Linear, posted in the last 30 days
bun run .agents/skills/ashby-search/cli/src/cli.ts search --company linear -q "engineer" --jobage 30 --format table

# Remote roles across two companies at once
bun run .agents/skills/ashby-search/cli/src/cli.ts search --company linear,ramp -l remote --format table

# Full detail for one posting
bun run .agents/skills/ashby-search/cli/src/cli.ts detail linear d3bc1ced-3ce4-4086-a050-555055dbb1ff --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the
process exits with code `1`. A company token that 404s is treated as "no results",
not an error, so multi-company searches degrade gracefully if one token is wrong.

## Notes

- Data is from Ashby's public `posting-api/job-board/<company>` endpoint — no
  credentials required. Confirmed live against `jobs.ashbyhq.com/linear` and
  `jobs.ashbyhq.com/ramp`.
- The response has no `organizationName` field in practice, so `company` in results
  falls back to the board token you passed.
- There is no separate, working unauthenticated single-job detail endpoint —
  `posting-api/job-board/<company>/<jobId>` returned `401 Unauthorized` live, so
  `detail` fetches the whole board and matches by id client-side.
- Multiple `--company` tokens are fetched **sequentially** with a ~400ms delay
  between requests — never in parallel — to keep request volume low.
- Ashby retries 429/5xx with exponential backoff (~6 attempts) and treats a 404
  company token as an empty result set rather than an error.
