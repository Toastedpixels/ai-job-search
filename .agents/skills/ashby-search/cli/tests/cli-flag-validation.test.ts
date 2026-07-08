import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "./helpers";

// Ashby board token confirmed live during development (jobs.ashbyhq.com/linear).
// Used only for the couple of tests that need a real, always-populated board.
const LIVE_COMPANY = "linear";

function parsedStderr(stderr: string): { error?: string; code?: string } {
  try {
    return JSON.parse(stderr);
  } catch {
    return {};
  }
}

describe("Ashby CLI flag validation", () => {
  describe("--company requirement", () => {
    test("missing --company exits 1 with NO_COMPANY", async () => {
      const result = await runCLI(["search"]);
      expect(result.exitCode).not.toBe(0);
      const err = parsedStderr(result.stderr);
      expect(err.code).toBe("NO_COMPANY");
    });

    test("empty --company exits 1 with NO_COMPANY", async () => {
      const result = await runCLI(["search", "--company", ",, "]);
      expect(result.exitCode).not.toBe(0);
      const err = parsedStderr(result.stderr);
      expect(err.code).toBe("NO_COMPANY");
    });
  });

  describe("--jobage NaN validation", () => {
    test("non-numeric string exits 1 with BAD_ARG", async () => {
      const result = await runCLI(["search", "--company", LIVE_COMPANY, "--jobage", "foo"]);
      expect(result.exitCode).not.toBe(0);
      const err = parsedStderr(result.stderr);
      expect(err.code).toBe("BAD_ARG");
      expect(err.error).toMatch(/jobage/);
    });
  });

  describe("--page NaN validation", () => {
    test("non-numeric string exits 1 with BAD_ARG", async () => {
      const result = await runCLI(["search", "--company", LIVE_COMPANY, "--page", "abc"]);
      expect(result.exitCode).not.toBe(0);
      const err = parsedStderr(result.stderr);
      expect(err.code).toBe("BAD_ARG");
      expect(err.error).toMatch(/page/);
    });
  });

  describe("--limit NaN validation", () => {
    test("non-numeric string exits 1 with BAD_ARG", async () => {
      const result = await runCLI(["search", "--company", LIVE_COMPANY, "--limit", "xyz"]);
      expect(result.exitCode).not.toBe(0);
      const err = parsedStderr(result.stderr);
      expect(err.code).toBe("BAD_ARG");
      expect(err.error).toMatch(/limit/);
    });
  });

  describe("detail argument validation", () => {
    test("missing company and jobId exits 1 with NO_ID", async () => {
      const result = await runCLI(["detail"]);
      expect(result.exitCode).not.toBe(0);
      const err = parsedStderr(result.stderr);
      expect(err.code).toBe("NO_ID");
    });

    test("missing jobId exits 1 with NO_ID", async () => {
      const result = await runCLI(["detail", LIVE_COMPANY]);
      expect(result.exitCode).not.toBe(0);
      const err = parsedStderr(result.stderr);
      expect(err.code).toBe("NO_ID");
    });
  });

  describe("unknown command", () => {
    test("exits 1 with BAD_CMD", async () => {
      const result = await runCLI(["bogus"]);
      expect(result.exitCode).not.toBe(0);
      const err = parsedStderr(result.stderr);
      expect(err.code).toBe("BAD_CMD");
    });
  });

  // --- Live smoke tests (mandatory per the portal-skill contract: verified
  // against a real Ashby-hosted company board, not a mock). Network-dependent.
  describe("live search smoke test", () => {
    test("search against a real company board returns exit 0 with populated results", async () => {
      const result = await runCLI([
        "search",
        "--company",
        LIVE_COMPANY,
        "--limit",
        "5",
      ]);
      expect(result.exitCode).toBe(0);
      const body = parseJSON<{ meta: { count: number }; results: Array<Record<string, unknown>> }>(result);
      expect(body.results.length).toBeGreaterThan(0);
      for (const r of body.results) {
        expect(typeof r.id).toBe("string");
        expect(typeof r.title).toBe("string");
        expect(r.id).toBeTruthy();
        expect(r.title).toBeTruthy();
      }
    }, 30000);

    test("unknown company token yields zero results rather than crashing", async () => {
      const result = await runCLI(["search", "--company", "this-company-should-not-exist-xyz-123"]);
      expect(result.exitCode).toBe(0);
      const body = parseJSON<{ results: unknown[] }>(result);
      expect(body.results).toEqual([]);
    }, 30000);
  });

  describe("live detail smoke test", () => {
    test("detail on a real job id returns exit 0 with a description", async () => {
      const searchResult = await runCLI(["search", "--company", LIVE_COMPANY, "--limit", "1"]);
      const body = parseJSON<{ results: Array<{ id: string }> }>(searchResult);
      expect(body.results.length).toBeGreaterThan(0);
      const jobId = body.results[0].id;

      const detailResult = await runCLI(["detail", LIVE_COMPANY, jobId]);
      expect(detailResult.exitCode).toBe(0);
      const detail = parseJSON<{ id: string; title: string; description: string | null }>(detailResult);
      expect(detail.id).toBe(jobId);
      expect(detail.title).toBeTruthy();
    }, 30000);

    test("detail with a bogus job id exits 1 with NOT_FOUND", async () => {
      const result = await runCLI(["detail", LIVE_COMPANY, "bogus-job-id-does-not-exist"]);
      expect(result.exitCode).not.toBe(0);
      const err = parsedStderr(result.stderr);
      expect(err.code).toBe("NOT_FOUND");
    }, 30000);
  });
});
