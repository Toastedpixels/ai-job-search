import { POSTINGS_BASE, jsonFetch, toJobDetail, writeError, type LeverPosting } from "../helpers.js"

export interface DetailOpts {
  company: string
  postingId: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  try {
    const url = `${POSTINGS_BASE}/${encodeURIComponent(opts.company)}/${encodeURIComponent(opts.postingId)}?mode=json`
    const posting = await jsonFetch<LeverPosting>(url)
    if (!posting) {
      writeError("Posting not found", "NOT_FOUND")
      return 1
    }
    const job = toJobDetail(posting, opts.company)

    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company} · ${job.location || "—"}`,
        "",
        job.team ? `Team: ${job.team}` : "",
        job.commitment ? `Commitment: ${job.commitment}` : "",
        job.workplaceType ? `Workplace: ${job.workplaceType}` : "",
        job.country ? `Country: ${job.country}` : "",
        "",
        job.description || "(no description)",
        "",
        `URL: ${job.url}`,
        job.applyUrl ? `Apply: ${job.applyUrl}` : "",
      ].filter((l) => l !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
