import {
  postingsUrl,
  jsonFetch,
  toJobResult,
  writeError,
  type SRPostingsResponse,
  type JobResult,
} from "../helpers.js"

export interface SearchOpts {
  companies: string[]
  query?: string
  location?: string
  jobage?: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

const MAX_PAGE_SIZE = 100 // SmartRecruiters caps `limit` at 100 (confirmed live).
const DEFAULT_PAGE_SIZE = 20

function renderTable(jobs: JobResult[]): string {
  if (jobs.length === 0) return "No results."
  const rows = jobs.map((j) => {
    const title = (j.title || "").slice(0, 42).padEnd(42)
    const company = (j.company || "—").slice(0, 22).padEnd(22)
    const loc = (j.location || "—").slice(0, 22).padEnd(22)
    const date = (j.date || "—").slice(0, 10)
    return `${j.id.padEnd(17)} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(17) +
    " " +
    "TITLE".padEnd(42) +
    " " +
    "COMPANY".padEnd(22) +
    " " +
    "LOCATION".padEnd(22) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

function renderPlain(jobs: JobResult[]): string {
  return (
    jobs
      .map(
        (j) =>
          `${j.title}\n  ${j.company || "—"} · ${j.location || "—"} · ${j.date || "—"}\n  id: ${j.id}\n  ${j.url || "—"}`,
      )
      .join("\n\n") + (jobs.length ? "\n" : "")
  )
}

/** Fetch every company's postings page sequentially with a small delay
 *  between companies, so a multi-company invocation doesn't flood the API. */
async function fetchAll(
  companies: string[],
  q: string | undefined,
  offset: number,
  limit: number,
): Promise<{ jobs: JobResult[]; missing: string[] }> {
  const jobs: JobResult[] = []
  const missing: string[] = []
  for (let i = 0; i < companies.length; i++) {
    const token = companies[i]
    const data = await jsonFetch<SRPostingsResponse>(postingsUrl(token, { q, offset, limit }))
    if (!data || !Array.isArray(data.content) || data.content.length === 0) {
      missing.push(token)
    } else {
      for (const posting of data.content) jobs.push(toJobResult(posting, token))
    }
    if (i < companies.length - 1) {
      await new Promise((r) => setTimeout(r, 300 + Math.floor(Math.random() * 200)))
    }
  }
  return { jobs, missing }
}

function matchesLocation(job: JobResult, location: string): boolean {
  return (job.location || "").toLowerCase().includes(location.toLowerCase())
}

function withinJobAge(job: JobResult, days: number): boolean {
  if (!job.date) return true // no reliable date to filter on — don't drop the posting
  const posted = new Date(job.date).getTime()
  if (isNaN(posted)) return true
  const ageMs = Date.now() - posted
  return ageMs <= days * 86400 * 1000
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const pageSize = Math.max(1, Math.min(opts.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE))
    const offset = (opts.page - 1) * pageSize

    const { jobs: allJobs } = await fetchAll(opts.companies, opts.query, offset, pageSize)

    let jobs = allJobs
    if (opts.location) jobs = jobs.filter((j) => matchesLocation(j, opts.location!))
    if (opts.jobage !== undefined && opts.jobage < 9999) {
      jobs = jobs.filter((j) => withinJobAge(j, opts.jobage!))
    }
    if (opts.limit !== undefined && opts.limit >= 0) jobs = jobs.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(jobs) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(jobs))
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
