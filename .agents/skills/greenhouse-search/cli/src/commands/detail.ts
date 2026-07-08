import { jobUrl, jsonFetch, toJobDetailResult, writeError, type GreenhouseJobRaw } from "../helpers.js"

export interface DetailOpts {
  company: string
  id: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  try {
    const job = await jsonFetch<GreenhouseJobRaw>(jobUrl(opts.company, opts.id))
    if (!job) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }
    const detail = toJobDetailResult(job, opts.company)

    if (opts.format === "plain") {
      const lines = [
        detail.title,
        `${detail.company || "—"} · ${detail.location || "—"}`,
        "",
        detail.departments ? `Department: ${detail.departments}` : "",
        detail.offices ? `Office(s): ${detail.offices}` : "",
        "",
        detail.description || "(no description)",
        "",
        `URL: ${detail.url || "—"}`,
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
