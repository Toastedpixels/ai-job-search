// Data source: Lever's public, unauthenticated "postings" API — the same JSON feed
// Lever-hosted career sites (jobs.lever.co/<company>) embed on their own pages.
// Unlike LinkedIn, this endpoint is company-scoped: there is no global keyword
// search across all Lever-hosted boards, only per-company postings.

export const POSTINGS_BASE = "https://api.lever.co/v0/postings"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

/**
 * Fetch JSON with exponential backoff + jitter on 429/5xx. Returns null on a 404
 * (unknown company token or unknown posting id) instead of throwing.
 */
export async function jsonFetch<T>(url: string): Promise<T | null> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
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

/** Raw shape of a single item in a Lever postings-list response. */
export interface LeverPosting {
  id: string
  text: string
  categories?: {
    location?: string | null
    team?: string | null
    commitment?: string | null
    department?: string | null
    allLocations?: string[]
  }
  createdAt?: number
  country?: string | null
  workplaceType?: string | null
  hostedUrl?: string
  applyUrl?: string
  description?: string | null
  descriptionPlain?: string | null
  descriptionBody?: string | null
  descriptionBodyPlain?: string | null
  opening?: string | null
  openingPlain?: string | null
  additional?: string | null
  additionalPlain?: string | null
  lists?: { text: string; content: string }[]
}

export interface JobResult {
  id: string
  title: string
  company: string
  location: string | null
  date: string | null
  url: string
}

export interface JobDetail extends JobResult {
  team: string | null
  commitment: string | null
  workplaceType: string | null
  country: string | null
  applyUrl: string | null
  description: string | null
}

function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  trade: "™",
  copy: "©",
  reg: "®",
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m)
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

/** Strip HTML while preserving paragraph/list-item breaks as newlines. */
export function htmlToPlainText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, "")).replace(/\n{3,}/g, "\n\n").trim()
}

export function clean(html: string): string {
  return decodeHtmlEntities(stripTags(html))
}

/** Map a raw Lever posting + the company token used to fetch it to our result shape. */
export function toJobResult(p: LeverPosting, company: string): JobResult {
  return {
    id: p.id,
    title: p.text ? clean(p.text) : "(untitled)",
    company,
    location: p.categories?.location ?? null,
    date: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    url: p.hostedUrl ?? `https://jobs.lever.co/${company}/${p.id}`,
  }
}

export function toJobDetail(p: LeverPosting, company: string): JobDetail {
  const base = toJobResult(p, company)
  const descParts: string[] = []
  if (p.opening) descParts.push(htmlToPlainText(p.opening))
  if (p.description) descParts.push(htmlToPlainText(p.description))
  if (p.descriptionBody) descParts.push(htmlToPlainText(p.descriptionBody))
  for (const list of p.lists ?? []) {
    const heading = list.text ? clean(list.text) : ""
    const body = htmlToPlainText(list.content ?? "")
    descParts.push([heading, body].filter(Boolean).join("\n"))
  }
  if (p.additional) descParts.push(htmlToPlainText(p.additional))
  const description = descParts.filter(Boolean).join("\n\n").trim() || null

  return {
    ...base,
    team: p.categories?.team ?? null,
    commitment: p.categories?.commitment ?? null,
    workplaceType: p.workplaceType ?? null,
    country: p.country ?? null,
    applyUrl: p.applyUrl ?? null,
    description,
  }
}

/** Filter+match helpers used by search. */
export function matchesQuery(title: string, query: string | undefined): boolean {
  if (!query) return true
  return title.toLowerCase().includes(query.toLowerCase())
}

export function matchesLocation(location: string | null, location2: string | undefined): boolean {
  if (!location2) return true
  return (location ?? "").toLowerCase().includes(location2.toLowerCase())
}

export function withinJobAge(date: string | null, jobage: number): boolean {
  if (!jobage || jobage >= 9999) return true
  if (!date) return true // unknown date: don't exclude
  const cutoff = Date.now() - jobage * 86400 * 1000
  return new Date(date).getTime() >= cutoff
}
