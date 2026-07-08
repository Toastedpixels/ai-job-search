// Data source: Greenhouse's public, unauthenticated job-board API
// (boards-api.greenhouse.io). This is the same JSON feed Greenhouse-hosted
// company career pages embed client-side — no authentication required.
// Unlike LinkedIn/Jobindex, the API is per-company: there is no global
// keyword search across all Greenhouse-hosted boards. A "company" here means
// the board's URL token, e.g. a company at boards.greenhouse.io/acmeinc has
// token "acmeinc".

export function boardUrl(company: string, withContent = false): string {
  const q = withContent ? "?content=true" : ""
  return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(company)}/jobs${q}`
}

export function jobUrl(company: string, jobId: string): string {
  return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(company)}/jobs/${encodeURIComponent(jobId)}?content=true`
}

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

/**
 * Fetch JSON with exponential backoff + jitter on 429/5xx (~6 retries).
 * Returns `null` on a 404 rather than throwing, so callers can treat a
 * missing company board / job as "no results" instead of a hard failure.
 */
export async function jsonFetch<T = unknown>(url: string): Promise<T | null> {
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
    return (await response.json()) as T
  }
  throw new Error("Request failed after max retries")
}

export interface GreenhouseJobRaw {
  id: number
  title: string
  updated_at?: string | null
  first_published?: string | null
  absolute_url?: string | null
  company_name?: string | null
  location?: { name?: string | null } | null
  content?: string | null
  departments?: { name?: string | null }[] | null
  offices?: { name?: string | null }[] | null
}

export interface GreenhouseBoardResponse {
  jobs: GreenhouseJobRaw[]
}

export interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string | null
}

export interface JobDetailResult extends JobResult {
  description: string | null
  departments: string | null
  offices: string | null
}

/**
 * Convert a Unicode code point to a string. Uses `fromCodePoint` (not
 * `fromCharCode`) so supplementary-plane code points (e.g. emoji) decode
 * correctly, and drops out-of-range values instead of throwing.
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

/**
 * Greenhouse's `content` field is HTML markup that has been HTML-entity
 * *double*-encoded (observed live: `FP&A` round-trips as `FP&amp;amp;A`).
 * A single decodeHtmlEntities pass only unwraps one layer (leaving literal
 * `&lt;p&gt;` as real `<p>` tags, but inner entities like `&amp;A` still
 * encoded) — so we decode twice before stripping tags, then once more
 * afterward in case any entities were exposed only after tag removal.
 */
export function htmlContentToText(raw: string | null | undefined): string | null {
  if (!raw) return null
  let s = decodeHtmlEntities(raw)
  s = decodeHtmlEntities(s)
  s = s.replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  // Strip remaining tags without collapsing the newlines we just inserted
  // (stripTags's \s+ collapse would flatten them back to spaces).
  s = s.replace(/<[^>]+>/g, "")
  s = s.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n")
  s = decodeHtmlEntities(s)
  return s.replace(/\n{3,}/g, "\n\n").trim() || null
}

/** Map a raw Greenhouse job (list or detail) to the shared search-result shape. */
export function toJobResult(job: GreenhouseJobRaw, companyToken: string): JobResult {
  return {
    id: String(job.id),
    title: job.title,
    company: job.company_name || companyToken,
    location: job.location?.name || null,
    date: job.updated_at || job.first_published || null,
    url: job.absolute_url || null,
  }
}

export function toJobDetailResult(job: GreenhouseJobRaw, companyToken: string): JobDetailResult {
  const base = toJobResult(job, companyToken)
  const departments = (job.departments || [])
    .map((d) => d?.name)
    .filter((n): n is string => !!n)
    .join(", ")
  const offices = (job.offices || [])
    .map((o) => o?.name)
    .filter((n): n is string => !!n)
    .join(", ")
  return {
    ...base,
    description: htmlContentToText(job.content),
    departments: departments || null,
    offices: offices || null,
  }
}
