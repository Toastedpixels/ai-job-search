import {
  fetchBoard,
  mapJob,
  matchesQuery,
  matchesLocation,
  withinJobAge,
  sleep,
  writeError,
  type AshbyRawJob,
  type JobResult,
} from "../helpers.js"

export interface SearchOpts {
  companies: string[]
  query?: string
  location?: string
  jobage: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

// Ashby returns the entire board in one response (no server-side pagination),
// so `--page` is a client-side slice over the filtered result set.
const PAGE_SIZE = 20
// Small delay between sequential per-company requests to keep request volume low.
const COMPANY_DELAY_MS = 400

function renderTable(cards: JobResult[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const id = c.id.slice(0, 10).padEnd(10)
    const title = (c.title || "").slice(0, 40).padEnd(40)
    const company = (c.company || "—").slice(0, 20).padEnd(20)
    const loc = (c.location || "—").slice(0, 22).padEnd(22)
    const date = (c.date || "—").slice(0, 10)
    return `${id} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(10) + " " + "TITLE".padEnd(40) + " " + "COMPANY".padEnd(20) + " " + "LOCATION".padEnd(22) + " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const merged: Array<{ job: AshbyRawJob; company: string; organizationName?: string }> = []

    for (let i = 0; i < opts.companies.length; i++) {
      const company = opts.companies[i]
      const board = await fetchBoard(company)
      if (board === null) {
        // Unknown/mistyped company token — skip silently, like a 404 on any
        // other portal. If every company 404s, `results` will just be empty.
        if (i < opts.companies.length - 1) await sleep(COMPANY_DELAY_MS)
        continue
      }
      for (const job of board.jobs) {
        if (job.isListed === false) continue
        merged.push({ job, company, organizationName: board.organizationName })
      }
      if (i < opts.companies.length - 1) await sleep(COMPANY_DELAY_MS)
    }

    let filtered = merged.filter((m) => matchesQuery(m.job.title, opts.query))
    filtered = filtered.filter((m) => matchesLocation(m.job.location ?? null, m.job.isRemote, opts.location))
    filtered = filtered.filter((m) => withinJobAge(m.job.publishedAt, opts.jobage))

    let results: JobResult[] = filtered.map((m) => mapJob(m.job, m.company, m.organizationName))
    const totalMatched = results.length
    const start = (opts.page - 1) * PAGE_SIZE
    results = results.slice(start, start + PAGE_SIZE)

    if (opts.limit !== undefined && opts.limit >= 0) results = results.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(results) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        results
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.date || "—"}\n  id: ${c.id}\n  ${c.url || "—"}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify(
          { meta: { count: results.length, totalMatched, page: opts.page }, results },
          null,
          2,
        ) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
