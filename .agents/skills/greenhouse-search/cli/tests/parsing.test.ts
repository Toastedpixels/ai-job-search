import { describe, test, expect } from "bun:test";
import {
  decodeHtmlEntities,
  htmlContentToText,
  toJobResult,
  toJobDetailResult,
  type GreenhouseJobRaw,
} from "../src/helpers";

function job(overrides: Partial<GreenhouseJobRaw> = {}): GreenhouseJobRaw {
  return {
    id: 12345,
    title: "Software Engineer",
    updated_at: "2026-07-01T00:00:00-04:00",
    absolute_url: "https://careers.example.com/jobs?gh_jid=12345",
    company_name: "Acme Inc",
    location: { name: "Remote" },
    content: null,
    departments: null,
    offices: null,
    ...overrides,
  };
}

describe("decodeHtmlEntities", () => {
  test("decodes basic entities", () => {
    expect(decodeHtmlEntities("Tom &amp; Jerry")).toBe("Tom & Jerry");
    expect(decodeHtmlEntities("&lt;p&gt;hi&lt;/p&gt;")).toBe("<p>hi</p>");
    expect(decodeHtmlEntities("It&#39;s")).toBe("It's");
  });

  test("decodes numeric and hex code points, including supplementary plane", () => {
    expect(decodeHtmlEntities("caf&#233;")).toBe("café");
    expect(decodeHtmlEntities("caf&#xE9;")).toBe("café");
    expect(decodeHtmlEntities("Growth &#128512;")).toBe("Growth 😀");
  });

  test("&nbsp; becomes a plain space", () => {
    expect(decodeHtmlEntities("A&nbsp;B")).toBe("A B");
  });
});

describe("htmlContentToText (Greenhouse double-encodes content)", () => {
  test("unwraps entity-encoded HTML tags into readable text", () => {
    const raw = "&lt;p&gt;Hello world&lt;/p&gt;";
    expect(htmlContentToText(raw)).toBe("Hello world");
  });

  test("fully decodes double-encoded entities (observed live: FP&A -> &amp;amp;)", () => {
    const raw = "&lt;p&gt;Partner with FP&amp;amp;A team&lt;/p&gt;";
    expect(htmlContentToText(raw)).toBe("Partner with FP&A team");
  });

  test("preserves paragraph/list breaks as newlines", () => {
    const raw = "&lt;p&gt;First&lt;/p&gt;&lt;ul&gt;&lt;li&gt;One&lt;/li&gt;&lt;li&gt;Two&lt;/li&gt;&lt;/ul&gt;";
    const text = htmlContentToText(raw);
    expect(text).toContain("First");
    expect(text).toContain("One");
    expect(text).toContain("Two");
    expect(text?.split("\n").length).toBeGreaterThan(1);
  });

  test("returns null for empty/missing content", () => {
    expect(htmlContentToText(null)).toBeNull();
    expect(htmlContentToText(undefined)).toBeNull();
    expect(htmlContentToText("")).toBeNull();
  });
});

describe("toJobResult", () => {
  test("maps raw Greenhouse job to the shared result shape", () => {
    const r = toJobResult(job(), "acme");
    expect(r).toEqual({
      id: "12345",
      title: "Software Engineer",
      company: "Acme Inc",
      location: "Remote",
      date: "2026-07-01T00:00:00-04:00",
      url: "https://careers.example.com/jobs?gh_jid=12345",
    });
  });

  test("falls back to the company token when company_name is absent", () => {
    const r = toJobResult(job({ company_name: null }), "acme");
    expect(r.company).toBe("acme");
  });

  test("uses null (not omission) for missing location/url/date", () => {
    const r = toJobResult(
      job({ location: null, absolute_url: null, updated_at: null, first_published: null }),
      "acme",
    );
    expect(r.location).toBeNull();
    expect(r.url).toBeNull();
    expect(r.date).toBeNull();
  });
});

describe("toJobDetailResult", () => {
  test("includes decoded description and joined departments/offices", () => {
    const r = toJobDetailResult(
      job({
        content: "&lt;p&gt;Great role&lt;/p&gt;",
        departments: [{ name: "Engineering" }, { name: "Platform" }],
        offices: [{ name: "Remote - US" }],
      }),
      "acme",
    );
    expect(r.description).toBe("Great role");
    expect(r.departments).toBe("Engineering, Platform");
    expect(r.offices).toBe("Remote - US");
  });

  test("null departments/offices become null, not empty string", () => {
    const r = toJobDetailResult(job({ departments: null, offices: null }), "acme");
    expect(r.departments).toBeNull();
    expect(r.offices).toBeNull();
  });
});
