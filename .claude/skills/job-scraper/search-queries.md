# Search Queries for Job Scraper

<!-- SETUP: Customize these queries based on your skills, target roles, and location -->

## Search Sites

**Important:** The installed CLI portal tools under `.agents/skills/` (jobbank-search, jobdanmark-search, jobindex-search, jobnet-search) are Danish-market-specific and do not apply to this US-based search. Every query below runs through the `WebSearch` fallback path (Step 1c in `SKILL.md`) until dedicated US portal CLIs are added via `/add-portal`.

Primary (US job market):
- **linkedin.com/jobs** - LinkedIn job listings (filter: United States / Florida)
- **indeed.com** - largest general US job board
- **builtin.com** - tech/startup-focused job board with regional editions (Built In Orlando/Tampa if available, plus national)
- **wellfound.com** (formerly AngelList Talent) - startup jobs
- **joinhandshake.com** - early-career/campus recruiting platform (strong fit for recent-grad programs)
- **hitmarker.net** - gaming industry jobs (for Riot Games, Epic Games, EA, etc.)

Secondary (ATS aggregators via `site:` filters - most mid-size/large employers post here):
- `site:boards.greenhouse.io`
- `site:jobs.lever.co`
- `site:jobs.ashbyhq.com`
- `site:myworkdayjobs.com`
- `site:jobs.smartrecruiters.com`

Tertiary (company career pages via Google):
- Direct Google searches with `site:` filters for named target companies (see Target Companies below)

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

- Minimum acceptable: $20/hour
- Preferred range: $24-$35/hour, depending on location and benefits
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

Consider running `/add-portal` to scaffold a dedicated CLI for a high-value US portal (e.g., Indeed or LinkedIn Jobs) once the WebSearch-fallback approach is validated - a CLI tool will be faster and more reliable than WebSearch for recurring `/scrape` runs.
