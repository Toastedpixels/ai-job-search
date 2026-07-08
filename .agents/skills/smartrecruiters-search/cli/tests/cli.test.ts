import { describe, test, expect } from "bun:test";
import { runCLI } from "./helpers";

describe("CLI flag validation", () => {
  test("search without --company exits 1 with a stderr JSON error", async () => {
    const result = await runCLI(["search", "--query", "engineer"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    const err = JSON.parse(result.stderr);
    expect(err.code).toBe("NO_COMPANY");
  });

  test("search with a non-numeric --jobage exits 1 with a stderr JSON error", async () => {
    const result = await runCLI(["search", "--company", "Equinox", "--jobage", "soon"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr);
    expect(err.code).toBe("BAD_ARG");
  });

  test("search with a non-numeric --page exits 1 with a stderr JSON error", async () => {
    const result = await runCLI(["search", "--company", "Equinox", "--page", "one"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr);
    expect(err.code).toBe("BAD_ARG");
  });

  test("detail without company/postingId exits 1 with a stderr JSON error", async () => {
    const result = await runCLI(["detail"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr);
    expect(err.code).toBe("NO_ID");
  });

  test("detail with only company (missing postingId) exits 1", async () => {
    const result = await runCLI(["detail", "Equinox"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr);
    expect(err.code).toBe("NO_ID");
  });

  test("unknown command exits 1 with a stderr JSON error", async () => {
    const result = await runCLI(["bogus"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr);
    expect(err.code).toBe("BAD_CMD");
  });

  test("no command prints help to stdout and exits 1", async () => {
    const result = await runCLI([]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("smartrecruiters-cli");
  });
});
