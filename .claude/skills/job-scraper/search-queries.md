# Search Queries for Job Scraper

<!-- SETUP: Customize these queries based on your skills, target roles, and location -->

## Search Sites

**Portal status:** The old Danish CLI tools (jobbank-search, jobdanmark-search, jobindex-search, jobnet-search) are archived under `.agents/skills/_archived/` and are no longer auto-discovered by `/scrape` (see `SKILL.md` Step 1b - it globs `.agents/skills/*/SKILL.md`, one level deep, which the archive folder is excluded from). Active US portals as of this configuration:

**Real CLI tools (installed, no auth, low request volume, all live-tested):**
- **linkedin-search** (`.agents/skills/linkedin-search/`) - global keyword + location search, works out of the box. Use for all Priority 1-4 role/location queries below. Confirmed working live for "Operations Coordinator"/"Marketing Analyst"/"Project Coordinator" in Orlando/Florida.
- **greenhouse-search** (`.agents/skills/greenhouse-search/`) - company-scoped (Greenhouse's public job-board API has no global search). Confirmed working targets from this profile's list: **Toast, Datadog, HubSpot**. Confirmed NOT on Greenhouse under the obvious token: ServiceNow, Adobe, Salesforce (may use a different or non-public ATS - fall back to WebSearch/company career page for those). Usage: `search -c toast[,datadog,hubspot] -q "<title>" --format table`.
- **lever-search** (`.agents/skills/lever-search/`) - company-scoped, same pattern. **None of this profile's target companies were found on Lever** (AdventHealth, Cigna, Boston Scientific, Abbott, Medtronic, Baxter, Cardinal Health, Microsoft, Adobe, Salesforce, DHL, UPS, FedEx, Ryder all 404'd). Keep for opportunistic use if a new target company turns out to use Lever.
- **ashby-search** (`.agents/skills/ashby-search/`) - company-scoped. Ashby skews toward startups/scale-ups; **no overlap found with this profile's target companies.** Its `detail` command has no separate API endpoint (requires an Ashby API key) - it re-fetches the full board and matches by id client-side, so `detail` is slightly slower on large boards.
- **smartrecruiters-search** (`.agents/skills/smartrecruiters-search/`) - confirmed company-scoped (no global postings API exists, verified live). Cardinal Health, Abbott, Baxter, UnitedHealth Group, Cigna, DHL, UPS, FedEx all returned zero/stale results under obvious identifiers - likely off SmartRecruiters now or using a different identifier. Re-check with the actual employer if you find one still using SmartRecruiters via their careers page URL.

For all four ATS CLIs, run each portal's own `SKILL.md`/`--help` for exact flags - don't guess. Discover a company's board token from their careers page URL (e.g. `boards.greenhouse.io/<token>`, `jobs.lever.co/<token>`, `jobs.ashbyhq.com/<token>`, `jobs.smartrecruiters.com/<token>`). **Bottom line: of this profile's specific target companies, only Toast, Datadog, and HubSpot were confirmed reachable via a dedicated ATS CLI (all three on Greenhouse) — most target companies (healthcare/pharma, aerospace, logistics, gaming) use ATS platforms without public APIs (Workday, iCIMS, etc.) and need the WebSearch/company-career-page path below.**

**WebSearch fallback only (no CLI - no public API, or scraping would fight anti-bot protection/violate ToS):**
- **indeed.com** - Cloudflare/anti-bot protected, ToS restricts automated access
- **builtin.com** - no public API
- **wellfound.com** (formerly AngelList Talent) - requires login for full listings, ToS prohibits scraping
- **hitmarker.net** - gaming industry jobs (Riot Games, Epic Games, EA, etc.) - no documented public API
- **joinhandshake.com** - early-career/campus recruiting platform, no public API

Tertiary (company career pages via Google, for employers not on any of the ATS platforms above):
- Direct Google searches with `site:` filters for named target companies, or `site:myworkdayjobs.com` for Workday-hosted boards (no public API found for Workday; WebSearch fallback)

## Query Categories

Queries are grouped by priority. Each query should be combined with your location terms (see Location Filter) where the site supports it.

### Priority 1: Business/Operations Analyst & Coordinator Roles

These match your strongest and most desired career direction.

```
site:linkedin.com/jobs "Business Operations Analyst" Orlando OR "Central Florida"
site:linkedin.com/jobs "Operations Coordinator" Orlando OR "Central Florida"
site:linkedin.com/jobs "Business Analyst" entry level Orlando OR Florida
site:indeed.com "Project Coordinator" Orlando
site:indeed.com "Program Coordinator" Florida
"Business Operations Coordinator" Orlando OR Tampa OR Jacksonville
```

### Priority 2: CRM, Marketing Ops & Reporting Roles

These match your CRM administration, dashboarding, and reporting experience.

```
site:linkedin.com/jobs "CRM Administrator" OR "CRM Coordinator" Florida
site:linkedin.com/jobs "Marketing Operations Coordinator" OR "Marketing Analyst" Orlando OR Florida
site:indeed.com "Reporting Analyst" OR "Reporting Coordinator" Florida
site:indeed.com "Revenue Operations Coordinator" OR "Sales Operations Coordinator" remote OR Florida
"Customer Success Operations" OR "Implementation Specialist" OR "Implementation Coordinator" Florida OR remote
```

### Priority 3: Adjacent Roles (HR, Quality, Client Services, Sector-Specific Ops)

Adjacent roles you could pivot into.

```
site:linkedin.com/jobs "HR Coordinator" OR "HR Operations Coordinator" Orlando OR Florida
site:linkedin.com/jobs "Client Success Specialist" OR "Client Services Coordinator" Florida
"Healthcare Operations Coordinator" Orlando OR "Central Florida"
"Supply Chain Coordinator" OR "Logistics Coordinator" OR "Quality Coordinator" OR "Continuous Improvement Coordinator" Florida
"Administrative Analyst" OR "Executive Assistant" OR "Office Manager" Orlando OR Florida
```

### Priority 4: Entry-Level/Graduate Programs & Broader Net

Structured early-career programs plus a wider net.

```
"Rotational Leadership Program" OR "Graduate Development Program" OR "Early Career Program" business
"University Relations Program" OR "Management Trainee" business operations
site:joinhandshake.com business operations analyst OR coordinator
"Junior Consultant" OR "Associate Consultant" entry level
"Business Development Representative" salary "no commission" OR "base salary"
```

## Target Companies

When running company-specific searches, combine the company name with the Priority 1/2 role titles above (e.g. `site:boards.greenhouse.io "AdventHealth" operations coordinator`).

**Healthcare / Pharma / Medical Devices:** AdventHealth, Orlando Health, CVS Health, UnitedHealth Group, Cigna, Pfizer, AbbVie, Johnson & Johnson, Boston Scientific, Abbott, Medtronic, Stryker, Baxter, Cardinal Health
**Technology:** Toast, HubSpot, Microsoft, Adobe, Salesforce, Datadog, ServiceNow
**Gaming:** Riot Games, Epic Games, Nintendo, EA, Sony Interactive Entertainment, Blizzard
**Aerospace & Defense:** Lockheed Martin, Northrop Grumman, RTX, L3Harris, Blue Origin, Boeing
**Logistics:** DHL, UPS, FedEx, Ryder

## Location Filter

When evaluating results, apply this priority order (highest priority first):

1. Orlando, FL (home base)
2. Central Florida (Kissimmee, Winter Park, Lake Mary, Sanford, etc.)
3. Tampa, FL
4. Jacksonville, FL
5. Miami, FL
6. Remote (US-based)
7. Boston, MA
8. NYC, NY
9. Anywhere in the U.S. - only if relocation assistance is offered or compensation makes self-funded relocation realistic

Flag roles outside this list (or with unclear location/remote policy) for the user to confirm before excluding.

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Salary Filter

- Minimum acceptable: $20/hour (~$42,000/year at full-time hours) - treat these as equivalent thresholds when a posting lists an annual salary instead of hourly
- Preferred range: $24-$35/hour (~$50,000-$73,000/year), depending on location and benefits
- Exclude commission-only compensation structures (except base-salary-plus-commission BDR roles)

## Deal-breaker Filter (exclude outright)

- Commission-only positions
- Insurance sales
- MLM opportunities
- Door-to-door sales
- Primarily cold-calling sales jobs

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. For example:
- "/scrape healthcare" -> Priority 1/2 queries + custom queries combining healthcare target companies with operations/coordinator titles
- "/scrape gaming" -> custom queries combining Hitmarker/gaming companies with marketing/operations titles

## Future Improvement

If a WebSearch-fallback-only portal (Indeed, Built In, Wellfound, Hitmarker, Handshake) turns out to expose a legitimate public API after all, revisit with `/add-portal` to give it a real CLI - a CLI tool will always be faster and more reliable than WebSearch for recurring `/scrape` runs.
