// Data source: SmartRecruiters' public, unauthenticated postings API
// (api.smartrecruiters.com/v1/companies/{company}/postings). This is the same
// feed SmartRecruiters-hosted career pages embed client-side — no
// authentication required.
//
// There is NO global keyword search across all SmartRecruiters-hosted boards
// (confirmed live: /v1/postings and /v1/postings/search both 404). This is
// COMPANY-SCOPED, same shape as greenhouse-search/lever-search/ashby-search in
// this repo. A "company" here is the SmartRecruiters identifier used in
// career-page URLs, e.g. jobs.smartrecruiters.com/Equinox has identifier
// "Equinox". The identifier lookup is case-insensitive against the API but
// must be the *real* registered identifier (an unrelated string returns
// totalFound: 0, not a 404).
//
// Unlike Greenhouse, SmartRecruiters' postings endpoint DOES support real
// server-side pagination (offset/limit, capped at 100 per page, confirmed
// live) and a server-side keyword filter (`q`). It has no working date filter
// (an `updatedAfter` param was tried live and had no effect on results), so
// --jobage is applied client-side against `releasedDate`. It also has a
// `city` param, but matching is exact-case and does not substring-match
// (confirmed live: `city=Miami` matches, `city=miami` and `city=Mia` do not)
// — too brittle for a free-text --location flag, so --location is applied
// client-side as a case-insensitive substring match against the joined
// city/region/country string instead.

export function postingsUrl(
  company: string,
  opts: { q?: string; offset?: number; limit?: number } = {},
): string {
  const params = new URLSearchParams()
  if (opts.q) params.set("q", opts.q)
  params.set("offset", String(opts.offset ?? 0))
  params.set("limit", String(opts.limit ?? 20))
  return `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings?${params.toString()}`
}

export function postingDetailUrl(company: string, postingId: string): string {
  return `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings/${encodeURIComponent(postingId)}`
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
 * missing company board / posting as "no results" instead of a hard failure.
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

export interface SRLocation {
  city?: string | null
  region?: string | null
  country?: string | null
  remote?: boolean | null
  fullLocation?: string | null
}

export interface SRPostingRaw {
  id: string
  name: string
  releasedDate?: string | null
  company?: { identifier?: string | null; name?: string | null } | null
  location?: SRLocation | null
  ref?: string | null
}

export interface SRPostingsResponse {
  offset: number
  limit: number
  totalFound: number
  content: SRPostingRaw[]
}

export interface SRJobAdSection {
  title?: string | null
  text?: string | null
}

export interface SRPostingDetailRaw extends SRPostingRaw {
  postingUrl?: string | null
  applyUrl?: string | null
  typeOfEmployment?: { label?: string | null } | null
  experienceLevel?: { label?: string | null } | null
  department?: { label?: string | null } | null
  function?: { label?: string | null } | null
  industry?: { label?: string | null } | null
  jobAd?: {
    sections?: {
      companyDescription?: SRJobAdSection
      jobDescription?: SRJobAdSection
      qualifications?: SRJobAdSection
      additionalInformation?: SRJobAdSection
    }
  } | null
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
  employmentType: string | null
  experienceLevel: string | null
  department: string | null
  applyUrl: string | null
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

/** SmartRecruiters' `jobAd` section text is plain (single-encoded) HTML —
 *  unlike Greenhouse's `content` field, one decode pass is sufficient. */
export function htmlToText(raw: string | null | undefined): string | null {
  if (!raw) return null
  let s = raw.replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  // Strip remaining tags without collapsing the newlines we just inserted
  // (stripTags's \s+ collapse would flatten them back to spaces).
  s = s.replace(/<[^>]+>/g, "")
  s = s.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n")
  s = decodeHtmlEntities(s)
  return s.replace(/\n{3,}/g, "\n\n").trim() || null
}

/** Join city/region/country into a single human-readable location string. */
export function joinLocation(loc: SRLocation | null | undefined): string | null {
  if (!loc) return null
  if (loc.fullLocation) return loc.fullLocation
  const parts = [loc.city, loc.region, loc.country].filter((p): p is string => !!p && p.trim() !== "")
  if (parts.length === 0) return loc.remote ? "Remote" : null
  return parts.join(", ")
}

/** Map a raw SmartRecruiters posting (list) to the shared search-result shape. */
export function toJobResult(posting: SRPostingRaw, companyToken: string): JobResult {
  return {
    id: posting.id,
    title: posting.name,
    company: posting.company?.name || companyToken,
    location: joinLocation(posting.location),
    date: posting.releasedDate || null,
    url: `https://jobs.smartrecruiters.com/${posting.company?.identifier || companyToken}/${posting.id}`,
  }
}

/** Map a raw SmartRecruiters posting (detail) to the shared detail shape. */
export function toJobDetailResult(posting: SRPostingDetailRaw, companyToken: string): JobDetailResult {
  const base = toJobResult(posting, companyToken)
  const sections = posting.jobAd?.sections
  const description = [
    htmlToText(sections?.jobDescription?.text),
    htmlToText(sections?.qualifications?.text),
    htmlToText(sections?.additionalInformation?.text),
  ]
    .filter((s): s is string => !!s)
    .join("\n\n")

  return {
    ...base,
    url: posting.postingUrl || base.url,
    description: description || null,
    employmentType: posting.typeOfEmployment?.label || null,
    experienceLevel: posting.experienceLevel?.label || null,
    department: posting.department?.label || posting.function?.label || null,
    applyUrl: posting.applyUrl || null,
  }
}
