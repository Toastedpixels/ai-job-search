---
name: smartrecruiters-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search for jobs on a company's
  SmartRecruiters-hosted career board, or look up a specific SmartRecruiters
  posting. SmartRecruiters is a US-prevalent applicant tracking system (ATS)
  used by companies like Equinox, Visa, and Cardinal Health for public job
  postings. This is COMPANY-SCOPED — SmartRecruiters has no global keyword
  search across every employer it hosts, so the user (or the calling skill)
  must supply the target company's SmartRecruiters identifier. Trigger
  phrases: jobs at <company> (when the company is known to use
  SmartRecruiters), SmartRecruiters jobs, SmartRecruiters posting, company
  career board search, ATS job board lookup.
context: fork
allowed-tools: Bash(bun run .agents/skills/smartrecruiters-search/cli/src/cli.ts *)
---

# SmartRecruiters Search Skill

Search live job postings on any company's SmartRecruiters-hosted career board.
No authentication, no API key, and **zero runtime dependencies** — it runs with
just `bun`.

## Company-scoped (no global search)

Unlike `linkedin-search`, this skill is **company-scoped**: SmartRecruiters has
no keyword search across every employer it hosts. This was verified live —
`GET https://api.smartrecruiters.com/v1/postings` and
`GET https://api.smartrecruiters.com/v1/postings/search` (with or without a
`q` param) both return `404`. Only the per-company endpoint
(`/v1/companies/{company}/postings`) exists and is public.

You must supply one or more SmartRecruiters company identifiers via
`--company`/`-c`. The identifier is the token in the company's public job board
URL: `jobs.smartrecruiters.com/<identifier>` (e.g. `Equinox`, `Visa`). The API
match is case-insensitive, but the identifier must be the *real* registered
one — passing an unrelated string returns `{"totalFound": 0}` (empty results),
not an error, so double-check against the real career page if a search comes
back empty.

## When to use this skill

- Search job openings at a specific company known to use SmartRecruiters
  (e.g. Equinox, Visa, Cardinal Health, and other US employers)
- Filter by keyword, location, or recency
- Get the full description of a specific posting, including qualifications
  and how to apply

## Commands

### Search job postings

```bash
bun run .agents/skills/smartrecruiters-search/cli/src/cli.ts search --company <token>[,<token2>,...] [flags]
```

Key flags:
- `--company <token(s)>` / `-c` — **required.** Comma-separated SmartRecruiters
  identifier(s), e.g. `Equinox` or `Equinox,Visa` for multiple companies in one
  invocation (fetched sequentially with a small delay between them — no
  parallel flooding).
- `--query <text>` / `-q` — keyword search. Passed to SmartRecruiters' own
  server-side `q` param (matches title/description).
- `--location <text>` / `-l` — case-insensitive substring match against the
  posting's `city, region, country` (applied **client-side**; SmartRecruiters'
  own `city` filter requires an exact-case match, e.g. `city=Miami` works but
  `city=miami` does not, which is too brittle for free text).
- `--jobage <days>` — posted within N days, filtered **client-side** against
  `releasedDate` (the API has no working date filter — an `updatedAfter` param
  was tried live and had no effect on results).
- `--page <n>` — 1-indexed page. Maps to SmartRecruiters' real `offset`/`limit`
  server-side pagination (confirmed live, unlike Greenhouse which has none).
- `--limit <n>` / `-n` — results per page requested from the API (capped at 100,
  SmartRecruiters' own max — a request for `limit=500` came back capped at 100)
  and the final client-side cap on emitted results.
- `--format json|table|plain` — default `json`.

### Fetch full posting detail

```bash
bun run .agents/skills/smartrecruiters-search/cli/src/cli.ts detail <company> <postingId> [--format json|plain]
```

`company` is the same SmartRecruiters identifier used in `search`. `postingId`
is the numeric ID from `search` results (e.g. `744000136572149`). Returns the
full job description (company description, job description, qualifications,
additional information sections joined), employment type, experience level,
department, and the real apply URL.

## Usage examples

```bash
# Management roles at Equinox
bun run .agents/skills/smartrecruiters-search/cli/src/cli.ts search -c Equinox -q "manager" --format table

# Engineer roles across two companies, filtered to New York
bun run .agents/skills/smartrecruiters-search/cli/src/cli.ts search -c Equinox,Visa -q "engineer" -l "New York" --limit 10

# Full detail for one posting
bun run .agents/skills/smartrecruiters-search/cli/src/cli.ts detail Equinox 744000136572149 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single posting's full detail (`detail` command) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- Data is from SmartRecruiters' public postings API — no credentials required.
- Real pagination: `--page`/`--limit` map directly to the API's `offset`/`limit`
  params, capped at 100 results per page.
- `--location` and `--jobage` are best-effort client-side filters applied to
  the page window returned by the API — a filtered `--page 2` is not
  guaranteed to be contiguous with a filtered `--page 1` if many postings on a
  given API page get filtered out. For exhaustive filtering, request larger
  `--limit` pages.
- The known-to-use-SmartRecruiters target companies validated live for this
  skill: Equinox (677 open postings) and Visa (2 open postings). Cardinal
  Health, Abbott, Baxter, UnitedHealth Group, Cigna, DHL, UPS, and FedEx did
  **not** resolve to any real postings under their obvious identifier guesses
  at verification time — either they use a different ATS today, or a
  non-obvious SmartRecruiters identifier. Confirm a company's identifier from
  its actual careers page before assuming it isn't on SmartRecruiters.
