#!/usr/bin/env bun
// Self-contained CLI for searching jobs on company-specific Lever-hosted job boards
// (jobs.lever.co/<company>), using Lever's public unauthenticated postings API.
// No external CLI framework, so it runs anywhere `bun` is available with zero
// install beyond the repo clone.
//
// Lever's postings API is per-company: there is no global keyword search across
// all Lever-hosted employers. You must supply the company's board token via
// --company (comma-separated for multiple companies in one search).

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", l: "location", n: "limit", c: "company" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("--") || a.startsWith("-")) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("-")) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      ;(flags._ as string[]).push(a)
    }
  }
  return flags
}

const HELP = `lever-cli — search jobs on company-specific Lever-hosted job boards

Lever's public postings API is per-company (jobs.lever.co/<company>) — there is
no global keyword search across all Lever-hosted employers. You must supply the
company's board token.

USAGE
  bun run src/cli.ts search --company <token>[,<token2>,...] [flags]
  bun run src/cli.ts detail <company> <postingId> [--format json|plain]

SEARCH FLAGS
  --company, -c <token[,token2,...]>   Lever board token(s). REQUIRED. e.g. "palantir",
                                        or "palantir,angellist" to search multiple boards.
  --query, -q <text>       Keywords (matched case-insensitively against the job title).
  --location, -l <text>    Location filter (case-insensitive substring match).
  --jobage <days>          Posted within N days. Default: all.
  --page <n>               1-indexed page (25 results/page, applied client-side).
  --limit, -n <n>          Cap results emitted (client-side).
  --format <fmt>           json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -c palantir -q "engineer" --format table
  bun run src/cli.ts search -c palantir,angellist -q "product" -l "New York" --jobage 30
  bun run src/cli.ts detail palantir 0bbfd4f4-41ff-4ec6-b73f-5200efd5d4d3 --format plain

Finding a company's board token: visit their careers page — if they use Lever,
the page (or its "apply" links) point to jobs.lever.co/<token>. The token is the
path segment right after jobs.lever.co/.
`

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  if (cmd === "search") {
    const companyRaw = typeof flags.company === "string" ? flags.company : undefined
    if (!companyRaw) {
      process.stderr.write(
        JSON.stringify({
          error: 'the --company/-c flag is required (e.g. -c "palantir" or -c "palantir,angellist")',
          code: "NO_COMPANY",
        }) + "\n",
      )
      return 1
    }
    const companies = companyRaw
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
    if (companies.length === 0) {
      process.stderr.write(
        JSON.stringify({ error: "--company must contain at least one non-empty token", code: "NO_COMPANY" }) + "\n",
      )
      return 1
    }

    const fmt = (flags.format as string) || "json"

    const parseIntFlag = (name: string, raw: string | boolean | string[]): number | null => {
      const val = parseInt(raw as string, 10)
      if (isNaN(val)) {
        process.stderr.write(JSON.stringify({ error: `--${name} must be a number, got "${raw}"`, code: "BAD_ARG" }) + "\n")
        return null
      }
      return val
    }

    if (flags.jobage !== undefined) {
      const v = parseIntFlag("jobage", flags.jobage)
      if (v === null) return 1
      flags.jobage = String(v)
    }
    if (flags.page !== undefined) {
      const v = parseIntFlag("page", flags.page)
      if (v === null) return 1
      flags.page = String(v)
    }
    if (flags.limit !== undefined) {
      const v = parseIntFlag("limit", flags.limit)
      if (v === null) return 1
      flags.limit = String(v)
    }

    const opts: SearchOpts = {
      companies,
      query: typeof flags.query === "string" ? flags.query : undefined,
      location: typeof flags.location === "string" ? flags.location : undefined,
      jobage: flags.jobage ? parseInt(flags.jobage as string, 10) : 9999,
      page: flags.page ? Math.max(1, parseInt(flags.page as string, 10)) : 1,
      limit: flags.limit ? parseInt(flags.limit as string, 10) : undefined,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const company = (flags._ as string[])[1]
    const postingId = (flags._ as string[])[2]
    if (!company || !postingId) {
      process.stderr.write(
        JSON.stringify({ error: "detail requires <company> <postingId>", code: "NO_ID" }) + "\n",
      )
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = {
      company,
      postingId,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main().then((code) => process.exit(code))
