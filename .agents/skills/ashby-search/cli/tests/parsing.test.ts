import { describe, test, expect } from "bun:test";
import {
  mapJob,
  mapJobDetail,
  matchesQuery,
  matchesLocation,
  withinJobAge,
  decodeHtmlEntities,
  htmlToText,
  type AshbyRawJob,
} from "../src/helpers";

function rawJob(overrides: Partial<AshbyRawJob> = {}): AshbyRawJob {
  return {
    id: "job-123",
    title: "Senior Engineer",
    department: "Engineering",
    team: "Platform",
    employmentType: "FullTime",
    location: "Remote - US",
    publishedAt: new Date().toISOString(),
    isListed: true,
    isRemote: true,
    workplaceType: "Remote",
    jobUrl: "https://jobs.ashbyhq.com/acme/job-123",
    applyUrl: "https://jobs.ashbyhq.com/acme/job-123/application",
    descriptionHtml: "<p>Build things.</p><ul><li>Ship code</li></ul>",
    descriptionPlain: null,
    ...overrides,
  };
}

describe("mapJob", () => {
  test("maps id/title/company/location/date/url with company token fallback", () => {
    const job = rawJob();
    const result = mapJob(job, "acme");
    expect(result).toEqual({
      id: "job-123",
      title: "Senior Engineer",
      company: "acme",
      location: "Remote - US",
      date: job.publishedAt,
      url: "https://jobs.ashbyhq.com/acme/job-123",
    });
  });

  test("prefers organizationName over the raw company token when present", () => {
    const result = mapJob(rawJob(), "acme", "Acme Inc.");
    expect(result.company).toBe("Acme Inc.");
  });

  test("falls back to applyUrl when jobUrl is missing", () => {
    const result = mapJob(rawJob({ jobUrl: null }), "acme");
    expect(result.url).toBe("https://jobs.ashbyhq.com/acme/job-123/application");
  });

  test("uses null (not omission) for missing location", () => {
    const result = mapJob(rawJob({ location: null }), "acme");
    expect(result.location).toBeNull();
    expect("location" in result).toBe(true);
  });
});

describe("mapJobDetail", () => {
  test("prefers descriptionPlain over descriptionHtml when present", () => {
    const detail = mapJobDetail(rawJob({ descriptionPlain: "Plain text description." }), "acme");
    expect(detail.description).toBe("Plain text description.");
  });

  test("strips HTML tags and decodes entities when descriptionPlain is absent", () => {
    const detail = mapJobDetail(
      rawJob({ descriptionPlain: null, descriptionHtml: "<p>Caf&#xE9; team &amp; friends</p>" }),
      "acme",
    );
    expect(detail.description).toBe("Café team & friends");
  });

  test("carries department/team/employmentType/workplaceType/applyUrl through", () => {
    const detail = mapJobDetail(rawJob(), "acme");
    expect(detail.department).toBe("Engineering");
    expect(detail.team).toBe("Platform");
    expect(detail.employmentType).toBe("FullTime");
    expect(detail.workplaceType).toBe("Remote");
    expect(detail.applyUrl).toBe("https://jobs.ashbyhq.com/acme/job-123/application");
    expect(detail.isRemote).toBe(true);
  });

  test("uses null for missing optional detail fields", () => {
    const detail = mapJobDetail(
      rawJob({ department: null, team: null, employmentType: null, workplaceType: null }),
      "acme",
    );
    expect(detail.department).toBeNull();
    expect(detail.team).toBeNull();
    expect(detail.employmentType).toBeNull();
    expect(detail.workplaceType).toBeNull();
  });
});

describe("decodeHtmlEntities", () => {
  test("decodes hexadecimal numeric entities (&#xE9;)", () => {
    expect(decodeHtmlEntities("Caf&#xE9;")).toBe("Café");
  });

  test("decodes decimal numeric entities (&#233;)", () => {
    expect(decodeHtmlEntities("Caf&#233;")).toBe("Café");
  });

  test("decodes supplementary-plane code points (&#128512;)", () => {
    expect(decodeHtmlEntities("Growth &#128512;")).toBe("Growth 😀");
  });

  test("decodes basic named entities", () => {
    expect(decodeHtmlEntities("Tom &amp; Jerry &lt;3&gt;")).toBe("Tom & Jerry <3>");
  });
});

describe("htmlToText", () => {
  test("keeps paragraph and list-item breaks as newlines", () => {
    const text = htmlToText("<p>First.</p><ul><li>One</li><li>Two</li></ul>");
    expect(text).toBe("First.\nOne\nTwo");
  });

  test("collapses excess blank lines", () => {
    const text = htmlToText("<p>A</p><p></p><p></p><p>B</p>");
    expect(text.includes("\n\n\n")).toBe(false);
  });
});

describe("matchesQuery", () => {
  test("no query matches everything", () => {
    expect(matchesQuery("Senior Engineer", undefined)).toBe(true);
  });

  test("case-insensitive substring match", () => {
    expect(matchesQuery("Senior Backend Engineer", "ENGINEER")).toBe(true);
    expect(matchesQuery("Product Designer", "engineer")).toBe(false);
  });
});

describe("matchesLocation", () => {
  test("no filter matches everything", () => {
    expect(matchesLocation("Berlin, Germany", false, undefined)).toBe(true);
  });

  test("substring match against location text", () => {
    expect(matchesLocation("Berlin, Germany", false, "berlin")).toBe(true);
    expect(matchesLocation("Paris, France", false, "berlin")).toBe(false);
  });

  test("'remote' filter also matches the isRemote flag when location text doesn't say remote", () => {
    expect(matchesLocation("United States", true, "remote")).toBe(true);
    expect(matchesLocation("United States", false, "remote")).toBe(false);
  });
});

describe("withinJobAge", () => {
  test("sentinel 9999 (no filter) accepts anything", () => {
    expect(withinJobAge("2000-01-01T00:00:00.000Z", 9999)).toBe(true);
  });

  test("accepts a job published within the window", () => {
    const now = new Date().toISOString();
    expect(withinJobAge(now, 7)).toBe(true);
  });

  test("rejects a job published outside the window", () => {
    const old = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
    expect(withinJobAge(old, 7)).toBe(false);
  });

  test("missing publishedAt is not filtered out", () => {
    expect(withinJobAge(null, 7)).toBe(true);
  });
});
