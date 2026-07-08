import { describe, expect, test } from "bun:test";
import {
  toJobResult,
  toJobDetail,
  matchesQuery,
  matchesLocation,
  withinJobAge,
  htmlToPlainText,
  decodeHtmlEntities,
  type LeverPosting,
} from "../src/helpers.js";

const samplePosting: LeverPosting = {
  id: "0bbfd4f4-41ff-4ec6-b73f-5200efd5d4d3",
  text: "Software Engineer &amp; Data Platform",
  categories: {
    location: "Palo Alto, CA",
    team: "Engineering",
    commitment: "Full-time",
  },
  createdAt: 1700000000000,
  country: "US",
  workplaceType: "hybrid",
  hostedUrl: "https://jobs.lever.co/acme/0bbfd4f4-41ff-4ec6-b73f-5200efd5d4d3",
  applyUrl: "https://jobs.lever.co/acme/0bbfd4f4-41ff-4ec6-b73f-5200efd5d4d3/apply",
  opening: "<p>We are hiring.</p>",
  description: "<p>Do the work.</p><ul><li>Item one</li><li>Item two</li></ul>",
  lists: [{ text: "Requirements", content: "<li>3+ years experience</li>" }],
};

describe("toJobResult", () => {
  test("maps a raw posting to the shared result shape", () => {
    const result = toJobResult(samplePosting, "acme");
    expect(result.id).toBe(samplePosting.id);
    expect(result.title).toBe("Software Engineer & Data Platform");
    expect(result.company).toBe("acme");
    expect(result.location).toBe("Palo Alto, CA");
    expect(result.url).toBe(samplePosting.hostedUrl);
    expect(result.date).toBe(new Date(1700000000000).toISOString());
  });

  test("falls back to a constructed URL when hostedUrl is missing", () => {
    const { hostedUrl, ...rest } = samplePosting;
    const result = toJobResult(rest as LeverPosting, "acme");
    expect(result.url).toBe(`https://jobs.lever.co/acme/${samplePosting.id}`);
  });

  test("uses null for missing location instead of omitting the field", () => {
    const result = toJobResult({ ...samplePosting, categories: undefined }, "acme");
    expect(result.location).toBeNull();
  });
});

describe("toJobDetail", () => {
  test("strips HTML from description fields into readable plain text", () => {
    const detail = toJobDetail(samplePosting, "acme");
    expect(detail.description).not.toBeNull();
    expect(detail.description).not.toContain("<");
    expect(detail.description).toContain("We are hiring.");
    expect(detail.description).toContain("Do the work.");
    expect(detail.description).toContain("Item one");
    expect(detail.description).toContain("Requirements");
    expect(detail.description).toContain("3+ years experience");
    expect(detail.team).toBe("Engineering");
    expect(detail.commitment).toBe("Full-time");
    expect(detail.workplaceType).toBe("hybrid");
  });
});

describe("decodeHtmlEntities / htmlToPlainText", () => {
  test("decodes common entities", () => {
    expect(decodeHtmlEntities("Tom &amp; Jerry &#39;s")).toBe("Tom & Jerry 's");
  });

  test("preserves paragraph breaks as newlines", () => {
    const out = htmlToPlainText("<p>First</p><p>Second</p>");
    expect(out).toBe("First\nSecond");
  });
});

describe("matchesQuery", () => {
  test("case-insensitive substring match", () => {
    expect(matchesQuery("Senior Software Engineer", "engineer")).toBe(true);
    expect(matchesQuery("Senior Software Engineer", "ENGINEER")).toBe(true);
    expect(matchesQuery("Senior Software Engineer", "designer")).toBe(false);
  });

  test("no query matches everything", () => {
    expect(matchesQuery("Anything", undefined)).toBe(true);
  });
});

describe("matchesLocation", () => {
  test("case-insensitive substring match", () => {
    expect(matchesLocation("Palo Alto, CA", "palo alto")).toBe(true);
    expect(matchesLocation("Palo Alto, CA", "new york")).toBe(false);
  });

  test("null location never matches a real filter", () => {
    expect(matchesLocation(null, "new york")).toBe(false);
  });

  test("no location filter matches everything", () => {
    expect(matchesLocation(null, undefined)).toBe(true);
  });
});

describe("withinJobAge", () => {
  test("recent date within window passes", () => {
    const recent = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    expect(withinJobAge(recent, 7)).toBe(true);
  });

  test("old date outside window fails", () => {
    const old = new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString();
    expect(withinJobAge(old, 7)).toBe(false);
  });

  test("jobage 9999 (default/unset) always passes", () => {
    const old = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString();
    expect(withinJobAge(old, 9999)).toBe(true);
  });

  test("missing date is never excluded", () => {
    expect(withinJobAge(null, 7)).toBe(true);
  });
});
