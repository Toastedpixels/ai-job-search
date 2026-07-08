#!/usr/bin/env bun
// Self-contained CLI for searching jobs on SmartRecruiters-hosted company
// career boards, via SmartRecruiters' public postings API
// (api.smartrecruiters.com/v1/companies/{company}/postings). No external CLI
// framework, so it runs anywhere `bun` is available with zero install beyond
// the repo clone.
//
// Unlike LinkedIn/Jobindex, this is COMPANY-SCOPED: SmartRecruiters has no
// global keyword search across all boards it hosts (confirmed live — see
// helpers.ts). You must supply one or more SmartRecruiters company
// identifiers via --company (e.g. --company Equinox, or
// --company Equinox,Visa for multiple).

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

const HELP = `smartrecruiters-cli — search jobs on SmartRecruiters-hosted company career boards

This is a COMPANY-SCOPED search — SmartRecruiters has no global keyword search
across all employers it hosts (verified live: no /v1/postings aggregator
exists). You must supply the company's SmartRecruiters identifier(s) — the
token in jobs.smartrecruiters.com/<identifier>.

USAGE
  bun run src/cli.ts search --company <token>[,<token2>,...] [flags]
  bun run src/cli.ts detail <company> <postingId> [--format json|plain]

SEARCH FLAGS
  --company, -c <token(s)>  REQUIRED. Comma-separated SmartRecruiters company
                            identifier(s), e.g. "Equinox" or "Equinox,Visa".
                            Case-insensitive but must be the real identifier —
                            an unrelated string returns 0 results, not an error.
  --query, -q <text>       Keyword search (server-side, SmartRecruiters' own
                            "q" param — matches title/description).
  --location, -l <text>    Case-insensitive substring match against the
                            posting's city/region/country (applied client-side —
                            SmartRecruiters' own city filter needs an exact-case
                            match, e.g. "Miami" but not "miami", so it's too
                            brittle for free text).
  --jobage <days>          Posted within N days, filtered client-side against
                            releasedDate (the API has no working date filter).
  --page <n>               1-indexed page. Uses SmartRecruiters' real
                            offset/limit pagination server-side.
  --limit, -n <n>           Results per page sent to the API (capped at 100,
                            SmartRecruiters' own max) and the final client-side cap.
  --format <fmt>            json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -c Equinox -q "manager" --format table
  bun run src/cli.ts search -c Equinox,Visa -q "engineer" -l "New York" --limit 10
  bun run src/cli.ts detail Equinox 744000136572149 --format plain

Data source: SmartRecruiters' public postings API (no auth required).
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
          error:
            'the --company/-c flag is required (e.g. -c Equinox, or -c Equinox,Visa for multiple). This is the identifier from jobs.smartrecruiters.com/<identifier>.',
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
      process.stderr.write(JSON.stringify({ error: "--company must not be empty", code: "NO_COMPANY" }) + "\n")
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
    const id = (flags._ as string[])[2]
    if (!company || !id) {
      process.stderr.write(
        JSON.stringify({ error: "detail requires <company> <postingId>", code: "NO_ID" }) + "\n",
      )
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = {
      company,
      id,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main().then((code) => process.exit(code))
