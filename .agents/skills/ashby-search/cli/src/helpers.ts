// Data source: Ashby's public "posting-api" job-board endpoint. No authentication
// required. Unlike LinkedIn, Ashby's board is per-company (there is no global
// keyword search across every Ashby-hosted employer) — the caller must supply
// one or more company board tokens (the slug in jobs.ashbyhq.com/<token>).
//
// Endpoint returns clean JSON (confirmed via a live fetch against jobs.ashbyhq.com/linear
// and jobs.ashbyhq.com/ramp), so there is no HTML parsing here — just JSON shaping.

export const BOARD_URL = "https://api.ashbyhq.com/posting-api/job-board"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

/** Fetch JSON text with exponential backoff on 429/5xx. Returns null on a 404. */
export async function jsonFetch(url: string): Promise<string | null> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

/** Raw shape of a single job as returned by Ashby's posting-api. Confirmed live
 * against jobs.ashbyhq.com/linear and jobs.ashbyhq.com/ramp — there is no
 * `organizationName` field on the response envelope in either case, contrary to
 * some third-party descriptions of this API. */
export interface AshbyRawJob {
  id: string
  title: string
  department?: string | null
  team?: string | null
  employmentType?: string | null
  location?: string | null
  secondaryLocations?: Array<{ location?: string }> | null
  publishedAt?: string | null
  isListed?: boolean
  isRemote?: boolean
  workplaceType?: string | null
  jobUrl?: string | null
  applyUrl?: string | null
  descriptionHtml?: string | null
  descriptionPlain?: string | null
}

export interface AshbyBoard {
  jobs: AshbyRawJob[]
  apiVersion?: string
  organizationName?: string
}

export interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string | null
}

export interface JobDetail extends JobResult {
  department: string | null
  team: string | null
  employmentType: string | null
  isRemote: boolean | null
  workplaceType: string | null
  applyUrl: string | null
  description: string | null
}

/** Fetch a single company's Ashby board. Returns null if the company token
 * doesn't resolve to a board (404). */
export async function fetchBoard(company: string): Promise<AshbyBoard | null> {
  const text = await jsonFetch(`${BOARD_URL}/${encodeURIComponent(company)}`)
  if (text === null) return null
  try {
    return JSON.parse(text) as AshbyBoard
  } catch {
    throw new Error(`Could not parse JSON response for company "${company}"`)
  }
}

/** Map a raw Ashby job + its board's company token to the shared result shape. */
export function mapJob(job: AshbyRawJob, company: string, organizationName?: string): JobResult {
  return {
    id: job.id,
    title: job.title,
    company: organizationName || company,
    location: job.location ?? null,
    date: job.publishedAt ?? null,
    url: job.jobUrl ?? job.applyUrl ?? null,
  }
}

/** Map a raw Ashby job to the detail shape, preferring descriptionPlain (already
 * plain text) and falling back to stripping descriptionHtml. */
export function mapJobDetail(job: AshbyRawJob, company: string, organizationName?: string): JobDetail {
  let description: string | null = null
  if (job.descriptionPlain && job.descriptionPlain.trim()) {
    description = job.descriptionPlain.trim()
  } else if (job.descriptionHtml) {
    description = htmlToText(job.descriptionHtml) || null
  }

  return {
    ...mapJob(job, company, organizationName),
    department: job.department ?? null,
    team: job.team ?? null,
    employmentType: job.employmentType ?? null,
    isRemote: typeof job.isRemote === "boolean" ? job.isRemote : null,
    workplaceType: job.workplaceType ?? null,
    applyUrl: job.applyUrl ?? null,
    description,
  }
}

/**
 * Convert a Unicode code point to a string. Uses `fromCodePoint` (not
 * `fromCharCode`) so supplementary-plane code points (e.g. emoji, U+1F600)
 * decode correctly, and drops out-of-range values instead of throwing.
 */
function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Numeric character references: decimal (&#233;) and hexadecimal (&#xE9;).
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

/** Strip Ashby's rich-text HTML description into readable plain text, keeping
 * paragraph/list-item/line breaks as newlines (unlike the generic `stripTags`,
 * which is line-agnostic and collapses everything to a single line). */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  const noTags = withBreaks.replace(/<[^>]+>/g, " ")
  const decoded = decodeHtmlEntities(noTags)
  return decoded
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Case-insensitive substring/word match of a query against a job title. */
export function matchesQuery(title: string, query: string | undefined): boolean {
  if (!query) return true
  return title.toLowerCase().includes(query.toLowerCase())
}

/** Case-insensitive substring match against location text, also matching
 * "remote" against the isRemote flag when the location string doesn't mention it. */
export function matchesLocation(
  location: string | null,
  isRemote: boolean | undefined,
  filter: string | undefined,
): boolean {
  if (!filter) return true
  const f = filter.toLowerCase()
  if (location && location.toLowerCase().includes(f)) return true
  if (f.includes("remote") && isRemote) return true
  return false
}

/** True if `publishedAt` is within `days` days of now (or `days` is the
 * "no filter" sentinel used by the CLI). */
export function withinJobAge(publishedAt: string | null | undefined, days: number): boolean {
  if (!days || days <= 0 || days >= 9999) return true
  if (!publishedAt) return true
  const published = Date.parse(publishedAt)
  if (isNaN(published)) return true
  const ageMs = Date.now() - published
  return ageMs <= days * 86400 * 1000
}

/** Small sleep helper used to space out sequential per-company requests. */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
