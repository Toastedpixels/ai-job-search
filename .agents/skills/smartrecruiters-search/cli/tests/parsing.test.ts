import { describe, test, expect } from "bun:test";
import {
  decodeHtmlEntities,
  htmlToText,
  joinLocation,
  toJobResult,
  toJobDetailResult,
  postingsUrl,
  postingDetailUrl,
  type SRPostingRaw,
  type SRPostingDetailRaw,
} from "../src/helpers";

function posting(overrides: Partial<SRPostingRaw> = {}): SRPostingRaw {
  return {
    id: "744000136572149",
    name: "Assistant General Manager, Miami",
    releasedDate: "2026-07-08T22:22:31.747Z",
    company: { identifier: "Equinox", name: "Equinox" },
    location: { city: "Miami", region: "FL", country: "us", fullLocation: "Miami, FL, United States" },
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

describe("htmlToText", () => {
  test("strips tags and preserves paragraph/list breaks as newlines", () => {
    const raw = "<p>First</p><ul><li>One</li><li>Two</li></ul>";
    const text = htmlToText(raw);
    expect(text).toContain("First");
    expect(text).toContain("One");
    expect(text).toContain("Two");
    expect(text?.split("\n").length).toBeGreaterThan(1);
  });

  test("decodes entities in single-encoded jobAd section text", () => {
    expect(htmlToText("<p>Partner with FP&amp;A team</p>")).toBe("Partner with FP&A team");
  });

  test("returns null for empty/missing content", () => {
    expect(htmlToText(null)).toBeNull();
    expect(htmlToText(undefined)).toBeNull();
    expect(htmlToText("")).toBeNull();
  });
});

describe("joinLocation", () => {
  test("prefers fullLocation when present", () => {
    expect(joinLocation({ city: "Miami", fullLocation: "Miami, FL, United States" })).toBe(
      "Miami, FL, United States",
    );
  });

  test("joins city/region/country when fullLocation is absent", () => {
    expect(joinLocation({ city: "Miami", region: "FL", country: "us" })).toBe("Miami, FL, us");
  });

  test("falls back to Remote when marked remote with no parts", () => {
    expect(joinLocation({ remote: true })).toBe("Remote");
  });

  test("returns null for missing location", () => {
    expect(joinLocation(null)).toBeNull();
    expect(joinLocation(undefined)).toBeNull();
  });
});

describe("toJobResult", () => {
  test("maps a raw posting to the shared result shape", () => {
    const r = toJobResult(posting(), "Equinox");
    expect(r).toEqual({
      id: "744000136572149",
      title: "Assistant General Manager, Miami",
      company: "Equinox",
      location: "Miami, FL, United States",
      date: "2026-07-08T22:22:31.747Z",
      url: "https://jobs.smartrecruiters.com/Equinox/744000136572149",
    });
  });

  test("falls back to the company token when company.name is absent", () => {
    const r = toJobResult(posting({ company: null }), "Equinox");
    expect(r.company).toBe("Equinox");
  });

  test("uses null (not omission) for missing location/date", () => {
    const r = toJobResult(posting({ location: null, releasedDate: null }), "Equinox");
    expect(r.location).toBeNull();
    expect(r.date).toBeNull();
  });
});

describe("toJobDetailResult", () => {
  function detailPosting(overrides: Partial<SRPostingDetailRaw> = {}): SRPostingDetailRaw {
    return {
      ...posting(),
      postingUrl: "https://jobs.smartrecruiters.com/Equinox/744000136572149-assistant-general-manager-miami",
      applyUrl: "https://jobs.smartrecruiters.com/Equinox/744000136572149-assistant-general-manager-miami?oga=true",
      typeOfEmployment: { label: "Full-time" },
      experienceLevel: { label: "Not Applicable" },
      department: { label: "Club - Management - Operations" },
      jobAd: {
        sections: {
          jobDescription: { title: "Job Description", text: "<p>Great role</p>" },
          qualifications: { title: "Qualifications", text: "<p>3+ years</p>" },
        },
      },
      ...overrides,
    };
  }

  test("prefers postingUrl over the constructed list URL", () => {
    const r = toJobDetailResult(detailPosting(), "Equinox");
    expect(r.url).toBe(
      "https://jobs.smartrecruiters.com/Equinox/744000136572149-assistant-general-manager-miami",
    );
  });

  test("joins jobAd sections into one description", () => {
    const r = toJobDetailResult(detailPosting(), "Equinox");
    expect(r.description).toContain("Great role");
    expect(r.description).toContain("3+ years");
  });

  test("maps employmentType/experienceLevel/department and applyUrl", () => {
    const r = toJobDetailResult(detailPosting(), "Equinox");
    expect(r.employmentType).toBe("Full-time");
    expect(r.experienceLevel).toBe("Not Applicable");
    expect(r.department).toBe("Club - Management - Operations");
    expect(r.applyUrl).toBe(
      "https://jobs.smartrecruiters.com/Equinox/744000136572149-assistant-general-manager-miami?oga=true",
    );
  });

  test("missing jobAd sections produce a null description, not empty string", () => {
    const r = toJobDetailResult(detailPosting({ jobAd: undefined }), "Equinox");
    expect(r.description).toBeNull();
  });
});

describe("postingsUrl / postingDetailUrl", () => {
  test("builds a search URL with q/offset/limit", () => {
    const url = postingsUrl("Equinox", { q: "manager", offset: 20, limit: 20 });
    expect(url).toBe(
      "https://api.smartrecruiters.com/v1/companies/Equinox/postings?q=manager&offset=20&limit=20",
    );
  });

  test("defaults offset to 0 and limit to 20 when omitted", () => {
    const url = postingsUrl("Equinox");
    expect(url).toBe("https://api.smartrecruiters.com/v1/companies/Equinox/postings?offset=0&limit=20");
  });

  test("builds a detail URL", () => {
    expect(postingDetailUrl("Equinox", "744000136572149")).toBe(
      "https://api.smartrecruiters.com/v1/companies/Equinox/postings/744000136572149",
    );
  });
});
