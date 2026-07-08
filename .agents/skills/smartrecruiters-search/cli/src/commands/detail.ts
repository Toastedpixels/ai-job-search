import { postingDetailUrl, jsonFetch, toJobDetailResult, writeError, type SRPostingDetailRaw } from "../helpers.js"

export interface DetailOpts {
  company: string
  id: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  try {
    const posting = await jsonFetch<SRPostingDetailRaw>(postingDetailUrl(opts.company, opts.id))
    if (!posting) {
      writeError("Posting not found", "NOT_FOUND")
      return 1
    }
    const detail = toJobDetailResult(posting, opts.company)

    if (opts.format === "plain") {
      const lines = [
        detail.title,
        `${detail.company || "—"} · ${detail.location || "—"}`,
        "",
        detail.employmentType ? `Employment: ${detail.employmentType}` : "",
        detail.experienceLevel ? `Experience: ${detail.experienceLevel}` : "",
        detail.department ? `Department: ${detail.department}` : "",
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
