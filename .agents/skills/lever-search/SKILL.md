---
name: lever-search
version: 1.0.0
description: >
  Use this skill when the user wants to search job openings at a specific company
  that hosts its careers page on Lever (jobs.lever.co/<company>), or wants full
  detail on a specific Lever posting. This is a company-scoped search, not a
  global keyword search across employers — you must know (or look up) the
  company's Lever board token first. Trigger phrases: Lever jobs, jobs.lever.co,
  "openings at <company>" when <company> is known to use Lever, company careers
  page search, ATS job board lookup, "check <company>'s Lever board".
context: fork
allowed-tools: Bash(bun run .agents/skills/lever-search/cli/src/cli.ts *)
---

# Lever Search Skill

Search live job postings on a **specific company's** Lever-hosted careers board
(`jobs.lever.co/<company>`). No authentication, no API key, and **zero runtime
dependencies** — it runs with just `bun`.

## ⚠️ Company-scoped, not a global search

Lever's public postings API is **per-company**. There is no way to search across
every Lever-hosted employer at once — you must supply the company's Lever board
token via `--company`.

**Finding a company's Lever token:** visit the company's careers page. If they use
Lever, the page (or the browser's address bar after clicking "Apply") will show a
URL like `https://jobs.lever.co/<token>/...`. The token is the path segment right
after `jobs.lever.co/`. If the token isn't obvious, try the company's lowercase
name/slug directly against `https://api.lever.co/v0/postings/<guess>?mode=json` —
a 404 means either the guess is wrong or the company doesn't use Lever; an empty
array `[]` means the token is right but there are no open postings right now.

## When to use this skill

- Check current openings at a company you already know uses Lever
- Search a company's board by keyword (job title/role) and/or location
- Get the full description of a specific posting
- Check several known Lever-hosted companies in one pass (comma-separated tokens)

## Commands

### Search a company's postings

```bash
bun run .agents/skills/lever-search/cli/src/cli.ts search --company <token>[,<token2>,...] [flags]
```

Key flags:
- `--company <token>` / `-c <token>` — **required.** Lever board token(s). Comma-separated
  to search multiple companies in one call (fetched sequentially with a short delay between
  each — keep the list short).
- `--query <text>` / `-q <text>` — keyword match against the job title (case-insensitive substring).
- `--location <text>` / `-l <text>` — case-insensitive substring match against the posting's location.
- `--jobage <days>` — only postings created within the last N days.
- `--page <n>` — page number (1-indexed, 25 results/page, applied client-side).
- `--limit <n>` / `-n <n>` — cap total results emitted.
- `--format json|table|plain` — default `json`.

### Fetch full posting detail

```bash
bun run .agents/skills/lever-search/cli/src/cli.ts detail <company> <postingId> [--format json|plain]
```

`postingId` is the posting's UUID from a `search` result's `id` field (e.g.
`0bbfd4f4-41ff-4ec6-b73f-5200efd5d4d3`). Returns the full description (HTML stripped
to readable plain text), team, commitment type, workplace type, country, and apply link.

## Usage examples

```bash
# Engineering roles at a company known to use Lever
bun run .agents/skills/lever-search/cli/src/cli.ts search -c palantir -q "engineer" --format table

# Product roles across two Lever-hosted boards, posted in the last 30 days
bun run .agents/skills/lever-search/cli/src/cli.ts search -c palantir,angellist -q "product" --jobage 30 --format table

# Location filter
bun run .agents/skills/lever-search/cli/src/cli.ts search -c palantir -l "New York" --format table

# Full detail for a specific posting
bun run .agents/skills/lever-search/cli/src/cli.ts detail palantir 0bbfd4f4-41ff-4ec6-b73f-5200efd5d4d3 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single posting's full detail (`detail` command) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- Data is from Lever's public `postings` API — no credentials required.
- An unknown or misspelled `--company` token returns zero results (search) or `NOT_FOUND` (detail),
  not a crash — Lever's API itself returns HTTP 404 for tokens that aren't real customers, and an
  empty array for real customers with no current openings.
- Verified live against `jobs.lever.co/palantir` (hundreds of open postings) and
  `jobs.lever.co/angellist` at the time this skill was built. Company boards come and go as
  employers switch ATS vendors — if a token that used to work now 404s, the company may have moved
  off Lever.
- Multiple `--company` tokens are fetched **sequentially** with a small delay between requests,
  never in parallel, to keep request volume low.
