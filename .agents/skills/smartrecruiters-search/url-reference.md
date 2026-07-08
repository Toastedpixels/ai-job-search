# SmartRecruiters API URL Reference

Public, unauthenticated postings API used by this skill. Verified live on
2026-07-08 against real company boards (Equinox, Visa, Cardinal Health).

## No global search (verified live)

The task brief for this skill asked us to check whether a global,
cross-company keyword search exists. It does not:

```
GET https://api.smartrecruiters.com/v1/postings?q=engineer         -> 404
GET https://api.smartrecruiters.com/v1/postings/search?q=engineer  -> 404
GET https://api.smartrecruiters.com/v1/companies?q=...             -> 404 (wrong path)
```

Only the per-company endpoints below exist and are public. This skill is
therefore **company-scoped**, matching `greenhouse-search`/`lever-search`/
`ashby-search` in this repo rather than `linkedin-search`.

## Search (list postings for a company)

```
GET https://api.smartrecruiters.com/v1/companies/{company}/postings
```

`{company}` is the SmartRecruiters identifier from the public career-page URL
(`jobs.smartrecruiters.com/<identifier>`), e.g. `Equinox`. Case-insensitive
against the API — `equinox`, `Equinox`, and `EQUINOX` all resolve — but it must
be the real registered identifier: an unrelated string returns
`{"totalFound": 0, "content": []}` with HTTP 200, not a 404 or error.

Query params (verified live):

| Param | Meaning | Verified behavior |
|-------|---------|--------------------|
| `q` | Keyword filter | Works server-side — `q=manager` on Equinox reduced `totalFound` from 677 to 549. |
| `city` | City filter | Works but **exact-case only** — `city=Miami` matched, `city=miami` and `city=Mia` (partial) both returned `totalFound: 0`. Too brittle for a free-text `--location` flag; not used by this CLI. |
| `country` | Country filter | Works (`country=us` on Equinox: `totalFound: 636` of 677). Not exposed as a CLI flag (out of scope for this task; `--location` client-side filtering covers it). |
| `offset` | Pagination offset | Works as expected — `offset=5&limit=2` returned the 6th/7th postings. |
| `limit` | Page size | Works, **capped at 100 server-side** — requesting `limit=500` returned `"limit":100` in the response with 100 items, not 500. Default (omitted) is `100`. |
| `updatedAfter` | Attempted date filter | **Does not work** — tried live with a recent ISO timestamp; `totalFound` was unchanged (677, same as no filter). This CLI filters `--jobage` client-side against `releasedDate` instead. |

Response shape (list):

```json
{
  "offset": 0,
  "limit": 100,
  "totalFound": 677,
  "content": [
    {
      "id": "744000136572149",
      "name": "Assistant General Manager, Miami",
      "uuid": "...",
      "jobAdId": "...",
      "refNumber": "REF358E",
      "company": { "identifier": "Equinox", "name": "Equinox" },
      "releasedDate": "2026-07-08T22:22:31.747Z",
      "location": {
        "city": "Miami", "region": "FL", "country": "us",
        "remote": false, "hybrid": false,
        "fullLocation": "Miami, FL, United States"
      },
      "industry": { "id": "...", "label": "..." },
      "department": { "id": "...", "label": "..." },
      "function": { "id": "...", "label": "..." },
      "typeOfEmployment": { "id": "permanent", "label": "Full-time" },
      "experienceLevel": { "id": "...", "label": "..." },
      "visibility": "PUBLIC",
      "ref": "https://api.smartrecruiters.com/v1/companies/Equinox/postings/744000136572149",
      "language": { "code": "en", "label": "English" }
    }
  ]
}
```

Note: `ref` in the list response is the **API** URL, not a public job page —
this CLI constructs `https://jobs.smartrecruiters.com/{company}/{id}` for list
results (confirmed live to resolve correctly, SmartRecruiters serves it without
a slug), and uses the detail endpoint's `postingUrl` (which includes the SEO
slug) when available.

## Detail (single posting)

```
GET https://api.smartrecruiters.com/v1/companies/{company}/postings/{postingId}
```

Adds, beyond the list fields: `postingUrl` (real public URL with slug, e.g.
`https://jobs.smartrecruiters.com/Equinox/744000136572149-assistant-general-manager-miami`),
`applyUrl`, `referralUrl`, and `jobAd.sections`:

```json
{
  "jobAd": {
    "sections": {
      "companyDescription": { "title": "Company Description", "text": "<p>...</p>" },
      "jobDescription": { "title": "Job Description", "text": "<p>...</p>" },
      "qualifications": { "title": "Qualifications", "text": "<p>...</p>" },
      "additionalInformation": { "title": "Additional Information", "text": "<p>...</p>" }
    }
  }
}
```

Section `text` is single-encoded HTML (unlike Greenhouse's double-encoded
`content` field) — one pass of tag-stripping and entity-decoding is
sufficient. This CLI joins `jobDescription`, `qualifications`, and
`additionalInformation` into the `description` field (omits
`companyDescription`, which is generic company boilerplate repeated on every
posting).

## Validated companies (live, 2026-07-08)

| Identifier | Result |
|------------|--------|
| `Equinox` | 677 open postings — used as the primary validation company for this skill. |
| `Visa` | 2 open postings — confirms multi-company behavior. |
| `CardinalHealth1` | 1 posting, dated 2020 (stale) — real Cardinal Health data (location: Dublin, OH, their HQ) but likely migrated off SmartRecruiters since. |
| `CardinalHealth`, `Abbott`, `Baxter`, `UnitedHealthGroup`, `Cigna`, `DHL`, `UPS`, `FedEx` (and common variants) | All returned `totalFound: 0` under the obvious identifier guesses — either not on SmartRecruiters today, or use a non-obvious identifier not discoverable without checking their live careers page. |

## Notes

- No authentication required.
- Respect rate limits — the CLI backs off on 429/5xx with exponential backoff + jitter (~6 retries), same pattern as `linkedin-search`/`greenhouse-search`.
- A 404 from the postings/detail endpoint is treated as "not found", not an error.
