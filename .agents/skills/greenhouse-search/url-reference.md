# Greenhouse Job Board API Reference

Public, unauthenticated `boards-api.greenhouse.io` endpoints used by this skill.
This is the same JSON feed Greenhouse-hosted career pages fetch client-side to
render their job listings — no credentials required. Verified live against
`toast`, `datadog`, and `hubspot` (2026-07-08).

> Per-company only: there is no global keyword search across every employer
> hosted on Greenhouse. Every request needs the company's board token.

## List jobs for a company

```
GET https://boards-api.greenhouse.io/v1/boards/{company}/jobs
GET https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true
```

`{company}` is the board token (the slug in `boards.greenhouse.io/<token>`).

Without `?content=true`, each job omits the `content` (description) field —
this skill uses the bare form for `search` (lighter/faster over potentially
hundreds of postings) and the `?content=true` form for `detail`.

Response shape (verified live, Toast board, 294 jobs at time of testing):

```json
{
  "jobs": [
    {
      "id": 8044902,
      "title": "Accounting Specialist",
      "company_name": "Toast",
      "updated_at": "2026-07-07T06:13:55-04:00",
      "first_published": "2026-07-07T06:13:55-04:00",
      "requisition_id": "R14712",
      "absolute_url": "https://careers.toasttab.com/jobs?gh_jid=8044902",
      "location": { "name": "Chennai" },
      "departments": [{ "id": 65606, "name": "G & A : Finance GL Accounting", "child_ids": [], "parent_id": null }],
      "offices": [{ "id": 83703, "name": "Chennai, India", "location": "Chennai, Tamil Nadu, India", "child_ids": [], "parent_id": null }],
      "metadata": [{ "id": 206197, "name": "External Posting Category", "value": "G & A", "value_type": "single_select" }],
      "data_compliance": [{ "type": "gdpr", "requires_consent": false, "...": "..." }],
      "internal_job_id": 3486859,
      "language": "en",
      "application_deadline": null,
      "ai_disclaimer": false,
      "include_ai_disclaimer": false,
      "ai_opt_out_request_url": null
    }
  ]
}
```

Field notes:
- `company_name` — a real display name **is** present in the live response
  (the task spec assumed it might not be — it is, at least for Toast/Datadog/
  HubSpot). The CLI uses it when present and falls back to the raw `--company`
  token otherwise, in case some boards omit it.
- `location.name` — free text, often just a city (`"Chennai"`) but sometimes
  `"Remote, USA"` or similar; not a structured country/region field.
- `updated_at` / `first_published` — ISO 8601 with offset. `updated_at` bumps
  on any edit to the posting (including cosmetic ones), so it's an approximation
  of "freshness," not a strict "posted date."
- `absolute_url` — the public apply-page URL (often on the company's own
  careers subdomain rather than `boards.greenhouse.io` directly).
- `content` (only with `?content=true`) — **HTML-entity double-encoded HTML**.
  A literal `<p>` in the description is stored as the *text* `&lt;p&gt;`, and
  entities inside the markup are themselves escaped again (observed live:
  `FP&A` serializes as `FP&amp;amp;A`). Decode HTML entities **twice** before
  stripping tags, or inner entities remain half-decoded (e.g. `FP&amp;A`
  instead of `FP&A`).
- No pagination parameters exist — the endpoint returns the board's entire
  open-jobs list in a single response (Toast returned all 294 jobs in one call).

## Single job detail

```
GET https://boards-api.greenhouse.io/v1/boards/{company}/jobs/{jobId}
GET https://boards-api.greenhouse.io/v1/boards/{company}/jobs/{jobId}?content=true
```

Same job object shape as the list endpoint. This skill always requests
`?content=true` for `detail` since the description is the point of the call.

## Error behavior (verified live)

- Unknown/invalid `{company}` token → `404` (e.g. `servicenow`, `adobe`, and
  `salesforce` all 404'd during verification — they either don't use Greenhouse
  or use a different/nonstandard token).
- Unknown `{jobId}` on a valid company board → `404`.
- The CLI treats `404` as "no data" (`null`/empty), not a crash — `search`
  reports the company as missing rather than failing the whole request, and
  `detail` reports `{"error":"Job not found","code":"NOT_FOUND"}`.

## Verified company tokens (as of 2026-07-08)

| Token | Works |
|-------|-------|
| `toast` | Yes |
| `datadog` | Yes |
| `hubspot` | Yes |
| `servicenow` | No (404) |
| `adobe` | No (404) |
| `salesforce` | No (404) |

`servicenow`/`adobe`/`salesforce` not resolving doesn't necessarily mean those
companies don't use Greenhouse — larger enterprises sometimes use a custom/
non-obvious board token or an embedded-only integration. If in doubt, search
`"<company> careers greenhouse"` to find their actual token.
