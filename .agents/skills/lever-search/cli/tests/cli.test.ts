import { describe, expect, test } from "bun:test";
import { runCLI, parseJSON } from "./helpers.js";

describe("flag validation (no network required)", () => {
  test("search without --company exits 1 with a JSON error on stderr", async () => {
    const result = await runCLI(["search", "-q", "engineer"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr) as { error: string; code: string };
    expect(err.code).toBe("NO_COMPANY");
  });

  test("search with a non-numeric --jobage exits 1 with a JSON error", async () => {
    const result = await runCLI(["search", "-c", "acme", "--jobage", "soon"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr) as { error: string; code: string };
    expect(err.code).toBe("BAD_ARG");
  });

  test("detail without company+postingId exits 1 with a JSON error", async () => {
    const result = await runCLI(["detail"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr) as { error: string; code: string };
    expect(err.code).toBe("NO_ID");
  });

  test("detail with only a company (no postingId) exits 1 with a JSON error", async () => {
    const result = await runCLI(["detail", "acme"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr) as { error: string; code: string };
    expect(err.code).toBe("NO_ID");
  });

  test("unknown command exits 1 with a JSON error", async () => {
    const result = await runCLI(["bogus"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr) as { error: string; code: string };
    expect(err.code).toBe("BAD_CMD");
  });

  test("no command prints help and exits 1", async () => {
    const result = await runCLI([]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("lever-cli");
  });
});

describe("live smoke test (real network — Lever's public postings API)", () => {
  test("search against a verified real Lever board returns real, well-formed results", async () => {
    const result = await runCLI(["search", "-c", "palantir", "--limit", "5"]);
    const parsed = parseJSON<{ meta: { count: number }; results: any[] }>(result);
    expect(parsed.results.length).toBeGreaterThan(0);
    expect(parsed.results.length).toBeLessThanOrEqual(5);
    for (const job of parsed.results) {
      expect(typeof job.id).toBe("string");
      expect(job.id.length).toBeGreaterThan(0);
      expect(typeof job.title).toBe("string");
      expect(job.title.length).toBeGreaterThan(0);
      expect(job.title).not.toContain("<");
      expect(job.url).toContain("jobs.lever.co/palantir");
    }
  }, 30000);

  test("detail against a real posting id returns readable, tag-free description text", async () => {
    const searchResult = await runCLI(["search", "-c", "palantir", "--limit", "1"]);
    const parsed = parseJSON<{ results: { id: string }[] }>(searchResult);
    expect(parsed.results.length).toBe(1);
    const id = parsed.results[0].id;

    const detailResult = await runCLI(["detail", "palantir", id, "--format", "plain"]);
    expect(detailResult.exitCode).toBe(0);
    expect(detailResult.stdout.length).toBeGreaterThan(0);
    expect(detailResult.stdout).not.toContain("<p>");
    expect(detailResult.stdout).not.toContain("<li>");
  }, 30000);

  test("an unknown company token returns zero results, not an error", async () => {
    const result = await runCLI(["search", "-c", "this-company-should-not-exist-12345"]);
    expect(result.exitCode).toBe(0);
    const parsed = parseJSON<{ results: any[] }>(result);
    expect(parsed.results.length).toBe(0);
  }, 30000);
});
