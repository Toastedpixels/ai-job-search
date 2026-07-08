# Ashby Job Board API Reference

Public, unauthenticated `posting-api` used by this skill. **Per-company** — there is
no global search endpoint across every employer hosted on Ashby.

Everything below was confirmed with real, live requests (not just documentation)
against `jobs.ashbyhq.com/linear` and `jobs.ashbyhq.com/ramp` during development.

## Board (search)

```
GET https://api.ashbyhq.com/posting-api/job-board/<company>
```

`<company>` is the board token — the slug in `jobs.ashbyhq.com/<company>`.

- Returns `200` with the full board in one response (no pagination parameters —
  all open, listed jobs come back at once). Linear's board returned 24 jobs;
  Ramp's returned 127. This CLI implements `--page`/`--limit` as a **client-side**
  slice over the (optionally filtered) result set.
- Returns `404` for an unknown/mistyped company token. The CLI treats this as an
  empty result set for that token rather than an error, so a multi-company search
  degrades gracefully if one token is wrong.
- No query parameters are needed or supported for filtering server-side; `--query`,
  `--location`, and `--jobage` are all applied client-side by this CLI after fetching
  the full board.

### Response shape (confirmed live)

```json
{
  "jobs": [
    {
      "id": "d3bc1ced-3ce4-4086-a050-555055dbb1ff",
      "title": "Senior / Staff Fullstack Engineer",
      "department": "Product",
      "team": "Engineering",
      "employmentType": "FullTime",
      "location": "Europe",
      "secondaryLocations": [],
      "publishedAt": "2021-04-27T20:13:45.158+00:00",
      "isListed": true,
      "isRemote": true,
      "workplaceType": "Remote",
      "address": { "postalAddress": { "addressCountry": "European Union" } },
      "jobUrl": "https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff",
      "applyUrl": "https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff/application",
      "descriptionHtml": "<p>...</p>",
      "descriptionPlain": "..."
    }
  ],
  "apiVersion": "..."
}
```

Top-level keys observed: **`jobs`, `apiVersion`** — that's it. **There is no
`organizationName` field on the envelope**, on either board tested, contrary to
some third-party write-ups of this API. This CLI's `company` result field
therefore falls back to the board token you passed rather than a "nicer" display
name from the API.

`descriptionPlain` was present and populated on every job checked, so `detail`
prefers it and only falls back to stripping `descriptionHtml` when it's absent
or empty.

## Detail (single job) — NOT publicly available unauthenticated

The spec this skill was built from suggested probing
`posting-api/job-board/<company>/<jobId>` as a possible detail route. Live-tested
against Linear's board with both a real job id and a bogus one:

```
GET https://api.ashbyhq.com/posting-api/job-board/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff
→ 401 Unauthorized

GET https://api.ashbyhq.com/posting-api/job-board/linear/bogus-id-123
→ 401 Unauthorized
```

Both returned `401 Unauthorized` (a real API key is required), so this route is
**not usable** by an unauthenticated public CLI. `detail` instead re-fetches the
company's full board (the same request `search` makes) and finds the matching
job by `id` client-side. This costs one extra request per `detail` call but needs
no additional endpoint.

## Notes

- Browser-like `User-Agent` header is sent on every request (matching this repo's
  other portal CLIs), though Ashby's API did not appear to require it in testing.
- Exponential backoff with jitter on `429`/`5xx` (~6 attempts), matching the
  portal-skill contract.
- Respect rate limits — keep request volume low; multi-company searches are
  sequential with a short delay between companies, never parallel.
