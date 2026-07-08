# ashby-cli

Zero-runtime-dependency CLI for searching jobs on Ashby-hosted company job boards
(`jobs.ashbyhq.com/<company>`), using Ashby's public, unauthenticated `posting-api`.

Ashby's board is **per-company** — there is no global keyword search across every
employer that uses Ashby. You supply one or more company board tokens via
`--company` (the slug in `jobs.ashbyhq.com/<token>`).

## Install

```bash
cd .agents/skills/ashby-search/cli
bun install
```

`bun install` only pulls dev-only type packages (`typescript`, `@types/bun`) —
no runtime dependencies.

## Usage

```bash
bun run src/cli.ts search --company linear -q "engineer" --format table
bun run src/cli.ts search --company linear,ramp -l remote --jobage 30 --format table
bun run src/cli.ts detail linear <jobId> --format plain
```

See `../SKILL.md` for the full flag reference and `../url-reference.md` for the
confirmed API shape.

## Development

```bash
bun run typecheck   # tsc --noEmit
bun test            # bun test --timeout 30000
```

## Data source and API notes

- `GET https://api.ashbyhq.com/posting-api/job-board/<company>` — returns the
  full board (`{ jobs: [...], apiVersion }`) for one company. Confirmed live
  against `linear` and `ramp`; unlisted/unknown company tokens 404.
- There is **no working unauthenticated single-job detail endpoint** —
  `posting-api/job-board/<company>/<jobId>` returned `401 Unauthorized` in
  live testing (for both real and bogus job IDs), so it requires an Ashby API
  key. `detail` instead re-fetches the company's full board and finds the job
  by id client-side — the same request `search` makes.
- The response envelope does **not** include an `organizationName` field in
  practice (checked on two live boards), contrary to some third-party
  descriptions of this API — so the `company` field in results falls back to
  the board token you passed.
