# Lever Postings API Reference

Public, unauthenticated `postings` API used by this skill. **Per-company** — each
Lever-hosted employer has its own board token, and there is no endpoint that
searches across all of them at once.

Verified live against `https://api.lever.co/v0/postings/palantir?mode=json`
(270 open postings at time of testing) and `https://api.lever.co/v0/postings/angellist?mode=json`.

## Search (list postings for one company)

```
GET https://api.lever.co/v0/postings/<company>?mode=json
```

`<company>` is the Lever board token, i.e. the path segment in `jobs.lever.co/<company>`.

Returns a **JSON array** of posting objects (not wrapped in an envelope). Observed fields
on each posting (from a real Palantir response):

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | Posting ID, used in the detail URL and `hostedUrl` |
| `text` | string | Job title (may contain HTML entities, e.g. `&amp;`) |
| `categories.location` | string \| undefined | Primary location, e.g. `"Palo Alto, CA"` |
| `categories.allLocations` | string[] \| undefined | All locations if multi-location |
| `categories.team` | string \| undefined | Team/department |
| `categories.commitment` | string \| undefined | e.g. `"Full-time"` |
| `createdAt` | number | Unix ms timestamp the posting was created |
| `country` | string \| undefined | e.g. `"US"` |
| `workplaceType` | string \| undefined | e.g. `"hybrid"`, `"remote"`, `"onsite"` |
| `hostedUrl` | string | Public posting URL, `https://jobs.lever.co/<company>/<id>` |
| `applyUrl` | string | Direct apply-form URL |
| `description` / `descriptionPlain` | string | Rich HTML / plain-text job description |
| `descriptionBody` / `descriptionBodyPlain` | string | Additional body HTML/plain-text |
| `opening` / `openingPlain` | string | Intro/opening paragraph HTML/plain-text |
| `additional` / `additionalPlain` | string | Trailing/benefits HTML/plain-text |
| `lists` | `{ text, content }[]` | Named sub-sections (e.g. "Requirements") with HTML content |

**Behavior notes observed live:**
- A token for a real Lever customer with **no current openings** (e.g. `lever` itself,
  `netflix`, `plaid` at time of testing) returns HTTP 200 with an **empty array `[]`**.
- A token that is **not a real Lever customer** returns **HTTP 404**.
- Both cases are treated the same way by this CLI's `search` — zero results, not an error.

## Detail (single posting)

```
GET https://api.lever.co/v0/postings/<company>/<postingId>?mode=json
```

Returns a **single JSON object** with the same fields as one element of the search
array above (not wrapped). A non-existent `<postingId>` (or a `<company>` that isn't
a real customer) returns HTTP 404 — the CLI's `detail` command surfaces this as
`{ "error": "Posting not found", "code": "NOT_FOUND" }` on stderr with exit code 1.

## Notes

- No authentication required.
- Respect rate limits — the CLI backs off on 429/5xx with exponential backoff + jitter (~6 retries).
- When passing multiple `--company` tokens to `search`, the CLI fetches them sequentially
  with a ~400ms delay between requests, not in parallel.
- Deviation from the pre-build spec: the original design assumed `company` in the mapped
  result would default to the token passed in "unless the API response includes a nicer
  display name." The real Lever postings payload does **not** include a company display
  name field anywhere on the posting object, so `company` in results is always the token
  as passed by the caller.
