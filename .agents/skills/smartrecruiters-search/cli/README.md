# smartrecruiters-cli

CLI for searching jobs on SmartRecruiters-hosted company career boards.

**Data source**: SmartRecruiters' public postings API
(`api.smartrecruiters.com/v1/companies/{company}/postings`).
**Authentication**: None required.
**Dependencies**: None (plain `bun` + `fetch`). `bun install` is optional and only pulls dev type defs.

**Company-scoped.** SmartRecruiters has no global keyword search across every
employer it hosts — confirmed live: `GET /v1/postings` and `GET
/v1/postings/search` (with or without a `q` param) both return 404. You must
supply one or more SmartRecruiters company identifiers via `--company`.

## Installation

```bash
cd .agents/skills/smartrecruiters-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Finding a company's SmartRecruiters identifier

The identifier is the token in the company's public job board URL:
`jobs.smartrecruiters.com/<identifier>`. It's case-insensitive against the
API, but must be the *actual* registered identifier — passing an unrelated
string returns `{"totalFound": 0}`, not a 404, so double-check the identifier
against the real career page if a search comes back empty.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search one or more companies' postings (`--company` required) |
| `detail` | Fetch full detail for a single posting (`<company> <postingId>`) |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts `--format json|plain`.
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Quick examples

```bash
# Management roles at Equinox
bun run src/cli.ts search -c Equinox -q "manager" --format table

# Engineer roles across two companies, filtered to New York
bun run src/cli.ts search -c Equinox,Visa -q "engineer" -l "New York" --limit 10

# Full detail for one posting
bun run src/cli.ts detail Equinox 744000136572149 --format plain
```

See `../SKILL.md` for the full flag reference.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--company` | `-c` | **Required.** Comma-separated SmartRecruiters identifier(s), e.g. `"Equinox"` or `"Equinox,Visa"`. |
| `--query` | `-q` | Keyword search — passed to SmartRecruiters' own server-side `q` param. |
| `--location` | `-l` | Case-insensitive substring match against city/region/country (client-side — see Notes). |
| `--jobage` | | Posted within N days (client-side, filtered against `releasedDate`). |
| `--page` | | 1-indexed page. Maps to real `offset`/`limit` pagination on the API. |
| `--limit` | `-n` | Results per page requested from the API (capped at 100) and the final client-side cap. |
| `--format` | | `json` \| `table` \| `plain`. |

## Notes on the real API (verified live)

- No global search: only per-company `postings` and `postings/{id}` endpoints exist.
- Real server-side pagination: `offset`/`limit` work as expected; `limit` is capped at 100 (a request for `limit=500` came back with `limit: 100` in the response).
- Server-side keyword filter: the `q` param does filter results.
- No working date filter: an `updatedAfter` param was tried and had no effect on `totalFound` — `--jobage` is therefore applied client-side.
- The `city` param exists but requires an exact-case match (`city=Miami` works, `city=miami` and `city=Mia` do not) — too brittle for a free-text `--location` flag, so location filtering is done client-side against the joined `city, region, country` string instead.
- The detail endpoint's `postingUrl`/`applyUrl` fields are the real public URLs (`jobs.smartrecruiters.com/<company>/<id>-<slug>`); the list endpoint doesn't include a slug, so list results link to `jobs.smartrecruiters.com/<company>/<id>` (without the slug), which SmartRecruiters serves directly.
