import {
  POSTINGS_BASE,
  jsonFetch,
  toJobResult,
  matchesQuery,
  matchesLocation,
  withinJobAge,
  writeError,
  type LeverPosting,
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

const INTER_COMPANY_DELAY_MS = 400

function renderTable(jobs: JobResult[]): string {
  if (jobs.length === 0) return "No results."
  const rows = jobs.map((j) => {
    const title = (j.title || "").slice(0, 42).padEnd(42)
    const company = (j.company || "—").slice(0, 20).padEnd(20)
    const loc = (j.location || "—").slice(0, 24).padEnd(24)
    const date = j.date ? j.date.slice(0, 10) : "—"
    return `${j.id.slice(0, 8).padEnd(9)} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(9) +
    " " +
    "TITLE".padEnd(42) +
    " " +
    "COMPANY".padEnd(20) +
    " " +
    "LOCATION".padEnd(24) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const all: JobResult[] = []
    for (let i = 0; i < opts.companies.length; i++) {
      const company = opts.companies[i]
      const url = `${POSTINGS_BASE}/${encodeURIComponent(company)}?mode=json`
      const postings = await jsonFetch<LeverPosting[]>(url)
      if (postings) {
        for (const p of postings) all.push(toJobResult(p, company))
      }
      if (i < opts.companies.length - 1) {
        await new Promise((r) => setTimeout(r, INTER_COMPANY_DELAY_MS))
      }
    }

    let jobs = all.filter(
      (j) =>
        matchesQuery(j.title, opts.query) &&
        matchesLocation(j.location, opts.location) &&
        withinJobAge(j.date, opts.jobage),
    )

    // Client-side pagination (Lever returns everything in one call per company).
    const pageSize = 25
    const start = (opts.page - 1) * pageSize
    jobs = jobs.slice(start, start + pageSize)

    if (opts.limit !== undefined && opts.limit >= 0) jobs = jobs.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(jobs) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        jobs
          .map(
            (j) =>
              `${j.title}\n  ${j.company} · ${j.location || "—"} · ${j.date ? j.date.slice(0, 10) : "—"}\n  id: ${j.id}\n  ${j.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify(
          { meta: { count: jobs.length, page: opts.page, companies: opts.companies }, results: jobs },
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
