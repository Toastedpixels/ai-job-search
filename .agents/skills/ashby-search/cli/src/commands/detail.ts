import { fetchBoard, mapJobDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  company: string
  jobId: string
  format: "json" | "plain"
}

/**
 * Ashby's public posting-api has no separate single-job detail endpoint that
 * works unauthenticated — a live probe against
 * `posting-api/job-board/<company>/<jobId>` returned 401 Unauthorized for both
 * a real and a bogus job ID (confirmed against jobs.ashbyhq.com/linear), so
 * that route requires an API key and isn't usable here. Instead, `detail`
 * fetches the full board for the company (the same call `search` makes) and
 * finds the matching job by id client-side.
 */
export async function runDetail(opts: DetailOpts): Promise<number> {
  try {
    const board = await fetchBoard(opts.company)
    if (board === null) {
      writeError(`Unknown Ashby company board "${opts.company}"`, "NOT_FOUND")
      return 1
    }
    const job = board.jobs.find((j) => j.id === opts.jobId)
    if (!job) {
      writeError(`No job with id "${opts.jobId}" on "${opts.company}"'s board`, "NOT_FOUND")
      return 1
    }
    const detail = mapJobDetail(job, opts.company, board.organizationName)

    if (opts.format === "plain") {
      const lines = [
        detail.title,
        `${detail.company || "—"} · ${detail.location || "—"}`,
        "",
        detail.department ? `Department: ${detail.department}` : "",
        detail.team ? `Team: ${detail.team}` : "",
        detail.employmentType ? `Employment: ${detail.employmentType}` : "",
        detail.workplaceType ? `Workplace: ${detail.workplaceType}` : "",
        "",
        detail.description || "(no description)",
        "",
        `URL: ${detail.url || "—"}`,
        detail.applyUrl ? `Apply: ${detail.applyUrl}` : "",
      ].filter((l) => l !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
