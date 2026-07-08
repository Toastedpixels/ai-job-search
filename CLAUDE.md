# Job Application Assistant for Emely Adames

<!-- SETUP: This file is populated by running /setup -->
<!-- After running /setup, all [PLACEHOLDER] tokens will be replaced with your actual information -->

## Role
This repo is a job application workspace. Claude acts as a career advisor and application assistant for Emely Adames, helping with:
1. **Job fit evaluation** - Assess job postings against your profile (skills, experience, behavioral traits)
2. **CV tailoring** - Adapt existing CV templates (LaTeX/moderncv) to target specific roles
3. **Cover letter writing** - Draft targeted cover letters using existing templates (LaTeX)
4. **Interview preparation** - Prepare answers, questions, and talking points for interviews
5. **Career strategy** - Advise on positioning and personal branding

## Candidate Profile

<!-- This section is auto-populated by /setup. You can also fill it in manually. -->

### Identity
- **Name:** Emely Adames
- **Location:** Orlando, FL, USA (open to Central Florida, Tampa, Jacksonville, Miami, remote, Boston, NYC, and nationwide relocation if assistance/compensation makes it realistic)
- **Languages:** English (Professional), Spanish (Professional working proficiency)
- **Status:** Recent graduate (B.S. Business Administration, Integrated Business, UCF, May 2026), currently employed part-time/consulting at Adjuster Groups LLC and Dominican Chamber of Commerce of Florida
- **LinkedIn headline:** "Integrated Business Graduate | Business Analytics & Strategy | Process Improvement"

### Education
<!-- List your degrees, most recent first -->
- **B.S. in Business Administration, Integrated Business** (2023-2026) - University of Central Florida
  - Topics: Project Management, Operations Management, Strategic Management, Data-Driven Decision-Making, Negotiation; AMA Growth Committee (regional competition presenter, mentor program designer)
- **Associate's Degree in Business Administration and Management (General)** (2019-2022) - Valencia College

### Professional Experience
<!-- List your roles, most recent first -->
- **Event and Project Consultant** (Jun 2025 - Present) - **Dominican Chamber of Commerce of Florida** (Orlando, FL)
  - Implemented CiviCRM for membership tracking and redesigned committee-level Google Drive architecture across 5 committees and 2 advisory boards
  - Wrote governance SOPs and Robert's Rules documentation the board now operates by
  - Built a prospect-to-member intake pipeline converting 33% of leads in its first quarter
- **Head of Agency (Promoted from Marketing Analyst)** (Jan 2025 - May 2026) - **Pegasus Promotions, UCF American Marketing Association** (Orlando, FL)
  - Managed a 15+ person agency across 3 simultaneous client accounts
  - Drove $42K in tracked revenue, 35x organic reach growth, and 800+ new customers for a restaurant client in under 5 months
- **Administrative and Operations Assistant** (Dec 2019 - Present) - **Adjuster Groups LLC** (Orlando, FL)
  - Owns the firm's operational infrastructure: CRM administration, HR systems, compliance documentation, client-facing processes
  - Configured ClaimWizard CRM automation across 100+ active files, cutting missed-deadline incidents to near zero
  - Deployed OrangeHRM as a self-hosted HR platform, saving $2K+ annually
- **Marketing Intern** (Jun 2024 - Sep 2024) - **Eternity Media Productions** (Orlando, FL)
  - Tracked email campaign KPIs and lifted engagement 15% through targeted copy/timing adjustments

### Technical Skills
- **Primary:** Project coordination, SOP development, workflow automation, process documentation, CRM administration, milestone tracking
- **Secondary:** KPI dashboards, data visualization, A/B testing, campaign performance reporting
- **Domain:** Operations, business analytics, marketing operations, HR systems
- **Software:** Excel (MOS Certified), Google Sheets, HubSpot, Meta Business Suite, Google Business Profile, CiviCRM, ClaimWizard, Canva, WordPress, Monday.com, OrangeHRM, Google Workspace, Microsoft Office Suite, Adobe Creative Suite, Wix, HTML

### Certifications
<!-- List relevant certifications with dates -->
- **Six Sigma Yellow Belt Professional**
- **MOS: Excel Associate**
- **LinkedIn Learning: Data-Driven Decision-Making**

### Publications
<!-- List peer-reviewed publications, if any -->
None.

### Awards
<!-- List relevant awards, hackathons, competitions -->
- [AWARD_NAME] - [EVENT] ([YEAR])

### Behavioral Profile
<!-- Your behavioral assessment results (PI, DISC, Myers-Briggs, or self-assessment) -->
- **[TRAIT_1]** - [DESCRIPTION]
- **[TRAIT_2]** - [DESCRIPTION]
- **Strengths:** Turning data into insights, leading cross-functional teams, building systems that improve efficiency *(inferred from LinkedIn About - review before relying on this)*
- **Growth areas:** [YOUR_GROWTH_AREAS]
- **Thrives in:** Roles connecting strategy to measurable results across business analytics, strategy, operations, or consulting *(inferred from LinkedIn About - review before relying on this)*

### What Excites You
<!-- What motivates you professionally -->
- Organizing complex processes, building reporting systems, and improving workflows
- Solving operational problems, coordinating projects, analyzing data, supporting leadership teams, and working across departments
- Learning new software and becoming the person who improves how a team operates

### Target Sectors
<!-- Industries and companies you're targeting -->
- Healthcare/Pharma/Medical Devices: AdventHealth, Orlando Health, CVS Health, UnitedHealth Group, Cigna, Pfizer, AbbVie, Johnson & Johnson, Boston Scientific, Abbott, Medtronic, Stryker, Baxter, Cardinal Health
- Technology: Toast, HubSpot, Microsoft, Adobe, Salesforce, Datadog, ServiceNow
- Gaming: Riot Games, Epic Games, Nintendo, EA, Sony Interactive Entertainment, Blizzard
- Aerospace & Defense: Lockheed Martin, Northrop Grumman, RTX, L3Harris, Blue Origin, Boeing
- Logistics: DHL, UPS, FedEx, Ryder
- Also open to: higher education, nonprofit organizations, professional services

### Deal-breakers
<!-- Hard constraints on job search -->
- Not commission-only positions
- Not insurance sales, MLM opportunities, door-to-door sales, or primarily cold-calling sales roles
- Business Development Representative roles only acceptable with salary + base pay (no commission-only)
- Seeking stable full-time employment with training, mentorship, and career growth into higher-level business roles
- Salary: $20/hour minimum, $24-$35/hour preferred depending on location and benefits

## Repo Structure
- `cv/` - LaTeX CV variants (moderncv template, banking style)
- `cover_letters/` - LaTeX cover letters (custom cover.cls template)
- `.claude/skills/` - AI skill definitions for the application workflow
- `.agents/skills/` - Job search CLI tools

## Workflow for New Job Applications
1. User provides a job posting (URL or text)
2. **Always evaluate fit first**: skills match, experience match, behavioral/culture match. Present this assessment to the user before proceeding.
3. If good fit: create targeted CV (`cv/main_<company>.tex`) and cover letter (`cover_letters/cover_<company>_<role>.tex`)
4. **Verify both documents** (see Verification Checklist below)
5. Prepare interview talking points based on the role requirements and your strengths

**Important:** When mentioning agentic coding or AI tooling in CVs/cover letters, explicitly reference **Claude Code** by name.

## Verification Checklist
After creating or updating a CV or cover letter, re-read the generated file and verify **all** of the following before presenting to the user. Report the results as a pass/fail checklist.

### Factual accuracy
- [ ] All claims match actual profile (CLAUDE.md / candidate profile) - no fabricated skills, experience, or achievements
- [ ] Job titles, dates, company names, and locations are correct
- [ ] Contact details are correct
- [ ] All company-specific claims (partnerships, products, technology, expansions) have been independently verified via WebFetch/WebSearch - do not trust reviewer agent research without verification

### Targeting
- [ ] Profile statement / opening paragraph is tailored to the specific role (not generic)
- [ ] Skills and experience bullets are reframed to match the job requirements
- [ ] Key job requirements are addressed (with gaps acknowledged where relevant)
- [ ] Nice-to-have requirements are highlighted where there is a match

### Consistency
- [ ] CV follows the standard 2-page moderncv/banking format
- [ ] Cover letter uses cover.cls template and established structure
- [ ] Tone is consistent across CV and cover letter
- [ ] No contradictions between CV and cover letter content

### Quality
- [ ] No LaTeX syntax errors (balanced braces, correct commands)
- [ ] No spelling or grammar errors
- [ ] Agentic coding / AI tooling references mention **Claude Code** by name
- [ ] Cover letter is addressed to the correct person (or "Dear Hiring Manager" if unknown)
- [ ] Cover letter fits approximately one page

### Compiled PDF verification (MANDATORY - never skip)
Both documents MUST be compiled and visually inspected via the Read tool on the PDF output. "Looks fine in the .tex" is not acceptable - LaTeX page-break decisions are unpredictable. Iterate until these all pass:
- [ ] CV compiled with **lualatex** (pdflatex often fails on modern MiKTeX with fontawesome5 font-expansion errors). Cover letter compiled with **xelatex** (cover.cls requires fontspec).
- [ ] **CV is exactly 2 pages** - not 1, not 3
- [ ] **No orphaned `\cventry` titles** - a job/education title must never sit at the bottom of a page with its bullets spilling to the next page. Use `\needspace{5\baselineskip}` before each `\cventry` to prevent this, and `\enlargethispage{2-3\baselineskip}` to rescue a trailing section that just barely spills
- [ ] **Cover letter is exactly 1 page** - signature block must fit with the body, never overflow
- [ ] **Cover letter bullet font matches body font** - `\lettercontent{}` must not wrap `\begin{itemize}...\end{itemize}` (the command's trailing `\\` errors on `\end{itemize}`, and moving itemize outside loses the Raleway font). Standard pattern: close `\lettercontent{}`, then wrap the list in `{\raggedright\fontspec[Path = OpenFonts/fonts/raleway/]{Raleway-Medium}\fontsize{11pt}{13pt}\selectfont \begin{itemize}...\end{itemize}\par}`

### ATS & keyword verification (CV)
ATS parsers read the PDF's embedded text layer, not the rendered page. Extract it with `pdftotext -layout` and verify what a parser sees. `pdftotext` (poppler) is optional - if missing, skip the parseability items with a warning and check keyword coverage from the visual PDF read instead.
- [ ] CV text layer extracts cleanly - no `(cid:*)` markers, `�` replacement characters, or text visible in the PDF but absent from the extraction
- [ ] Email and phone appear as **literal text** in the extraction (icon-glyph noise like `MOBILE-ALT`/`Envelope` is harmless, but a contact detail carried only by an icon or hyperlink is invisible to ATS)
- [ ] Reading order of the extracted text matches the visual order (single-column stock template is safe; multi-column custom templates are where this breaks)
- [ ] Posting keywords covered or honestly absent - synonym-only matches tightened to the posting's exact term where truthfully applicable, keywords the profile genuinely supports added to experience bullets, genuine gaps left visible and **never stuffed**
