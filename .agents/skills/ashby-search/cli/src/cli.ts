#!/usr/bin/env bun
// Self-contained CLI for searching jobs on Ashby-hosted company job boards
// (jobs.ashbyhq.com/<company>). No external CLI framework, so it runs anywhere
// `bun` is available with zero install beyond the repo clone.
//
// Ashby's public posting-api is PER-COMPANY — there is no global keyword search
// across every Ashby-hosted employer. You must supply the company's board token
// via --company (the slug that appears as jobs.ashbyhq.com/<token>).

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

const HELP = `ashby-cli — search jobs on Ashby-hosted company job boards

Ashby's public job-board API is PER-COMPANY: there is no global keyword search
across every employer that uses Ashby. You must know the company's board token
(the slug in jobs.ashbyhq.com/<token>, e.g. "linear" for jobs.ashbyhq.com/linear).

USAGE
  bun run src/cli.ts search --company <token>[,<token2>,...] [flags]
  bun run src/cli.ts detail <company> <jobId> [--format json|plain]

SEARCH FLAGS
  --company, -c <tokens>  Comma-separated Ashby board token(s). REQUIRED.
                          e.g. "linear" or "linear,ramp,notable".
  --query, -q <text>      Keywords, matched case-insensitively against the job title.
  --location, -l <text>   Case-insensitive substring match against location
                          (also matches "remote" against the isRemote flag).
  --jobage <days>         Posted within N days (based on publishedAt). Default: all.
  --page <n>              1-indexed page over the filtered results (20/page). Default 1.
  --limit, -n <n>         Cap results emitted (client-side, applied after paging).
  --format <fmt>          json (default) | table | plain.

DETAIL
  <company>               The Ashby board token the job belongs to.
  <jobId>                 The job's id, from a search result.

EXAMPLES
  bun run src/cli.ts search --company linear -q "engineer" --format table
  bun run src/cli.ts search --company linear,ramp -l remote --jobage 30 --format table
  bun run src/cli.ts detail linear d3bc1ced-3ce4-4086-a050-555055dbb1ff --format plain

Public, unauthenticated Ashby posting-api. Keep request volume low.
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
          error: 'the --company/-c flag is required (comma-separated Ashby board token(s), e.g. --company linear)',
          code: "NO_COMPANY",
        }) + "\n",
      )
      return 1
    }
    const companies = companyRaw
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
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
    const jobId = (flags._ as string[])[2]
    if (!company || !jobId) {
      process.stderr.write(
        JSON.stringify({ error: "detail requires <company> <jobId>", code: "NO_ID" }) + "\n",
      )
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = {
      company,
      jobId,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main().then((code) => process.exit(code))
