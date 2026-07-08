# lever-cli

CLI for searching jobs on **company-specific** Lever-hosted job boards
(`jobs.lever.co/<company>`).

**Data source**: Lever's public `postings` API (`api.lever.co/v0/postings/<company>`).
**Authentication**: None required.
**Dependencies**: None (plain `bun` + `fetch`). `bun install` is optional and only pulls dev type defs.

> Lever's postings API is **per-company** — there is no global keyword search across
> all Lever-hosted employers. You must know the target company's board token
> (the path segment after `jobs.lever.co/`, e.g. `jobs.lever.co/palantir` → `palantir`).

## Installation

```bash
cd .agents/skills/lever-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search a company's (or several companies') open postings (`--company` required) |
| `detail` | Fetch full detail for a single posting (`detail <company> <postingId>`) |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts `--format json|plain`.
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Quick examples

```bash
# Engineering roles at Palantir
bun run src/cli.ts search -c palantir -q "engineer" --format table

# Product roles across two boards, posted in the last 30 days
bun run src/cli.ts search -c palantir,angellist -q "product" --jobage 30 --format table

# Full detail for one posting
bun run src/cli.ts detail palantir 0bbfd4f4-41ff-4ec6-b73f-5200efd5d4d3 --format plain
```

See `../SKILL.md` for the full flag reference.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--company` | `-c` | **Required.** Lever board token(s), comma-separated for multiple companies. |
| `--query` | `-q` | Keywords, matched case-insensitively against the job title. |
| `--location` | `-l` | Case-insensitive substring match against the posting's location. |
| `--jobage` | | Posted within N days. |
| `--page` | | 1-indexed page (25 results/page, applied client-side — Lever returns all postings in one call). |
| `--limit` | `-n` | Cap results emitted. |
| `--format` | | `json` \| `table` \| `plain`. |

## Notes on the real API shape

- Company tokens with **no open postings currently** (e.g. `lever`, `netflix`, `plaid` at
  the time this was built) return an empty array `[]`, not a 404 — the CLI treats that as
  zero results, not an error.
- A company token that **does not exist as a Lever customer** returns HTTP 404 — the CLI
  treats that the same as "zero results" for `search`, and as `NOT_FOUND` for `detail`.
- Verified live against `palantir` (270 open postings at time of testing) and `angellist`.
