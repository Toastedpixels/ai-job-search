# Template: ats-resume-classic

## Research basis (verified sources only)

This template's format decisions are grounded in these specific sources -- not unsourced "resume trend" marketing blog claims. An earlier research pass for this template pulled stats like "recruiters are 1.4x more likely to prefer 2-page resumes for entry-level candidates" from resume-builder SaaS marketing blogs (resumepolished.com, meritamerica.org, resumeoptimizerpro.com, gainrep.com, qwyse.com, and similar) with no cited study behind the number. Those claims were retracted. Everything below traces to an identifiable institution or a company whose core product is the thing being described.

| Claim | Source | What it actually says |
|---|---|---|
| Font 10-11pt, margins 0.5-1in, single column, no headers/footers/tables/graphics, standard section titles | [UC Berkeley Career Engagement](https://career.berkeley.edu/prepare-for-success/resumes/) | Explicit formatting rules for student/recent-grad resumes, including an ATS-compatibility do/don't list |
| Single-column + reverse-chronological + standard headings scores highest; columns/tables/headers/footers/icons are the most common parsing failures | [Jobscan](https://www.jobscan.co/blog/20-ats-friendly-resume-templates/) | First-party technical finding -- Jobscan's core product is ATS-parsing simulation, so this is closer to internal test data than marketing copy |
| 1-page resume is the standard expectation for candidates with under 2 years of professional experience | NACE (National Association of Colleges and Employers) Job Outlook data, as cited in [Career Directions LLC's summary of SHRM/hiring-manager practices](https://careerdirectionsllc.com/hiring-managers-look-resumes-letters/) | Long-standing, widely-cited early-career resume-length standard |
| Bullet formula: Action verb + Project + Result, quantified where possible; lead with impact as an alternative structure; avoid generic verbs ("worked," "helped") in favor of specific ones ("led," "built") | [Yale Office of Career Strategy](https://ocs.yale.edu/resources/writing-impactful-resume-bullets/) | Includes before/after bullet conversions demonstrating the formula |
| PAR (Project-Action-Result) accomplishment-statement structure; strong action verbs | MIT Career Advising & Professional Development, cited via [MIT CAPD resource search](https://capd.mit.edu/resources/resume-action-verbs/) | Same underlying formula as Yale's, independently corroborated |

**Bottom line from this research:** the template's existing format (10.5pt font, 0.6in margins, single column, no tables/icons, standard section labels, 1-page target) was already compliant with every verified source above before this pass -- no wholesale redesign was justified. The concrete changes made were: renaming "Experience" to "Professional Experience" (the more standard label per Berkeley/Jobscan), and updating the bullet placeholder guidance to explicitly reference the Action+Project+Result formula.

- **Type:** CV
- **Engine:** lualatex or xelatex (both fontspec-capable; nothing engine-specific here)
- **Page limit:** genuinely targets 1 page. This matches NACE's standard for candidates with under 2 years of professional experience (see "Research basis" above), not just an arbitrary design choice -- and is also why the previous `ats-flex-resume` template's 2-page result on the same real candidate content was treated as a problem to fix, not an acceptable outcome. Flows to 2 pages only if content truly does not fit after applying the relevance-weighted cutting rules in `05-cv-templates.md`.
- **Fonts:** TeX Gyre Heros, loaded via `fontspec` (`\setmainfont{TeX Gyre Heros}`) -- a free, metric-compatible Helvetica clone, one of the most commonly recommended ATS-safe resume fonts. Checked other common resume-font picks (Carlito/Calibri clone, Lato, Open Sans, PT Sans) against a live test compile: none are available on a stock MiKTeX install without adding font packages. Only `tex-gyre` fonts (Heros/Termes/etc.) are guaranteed present out of the box, so this is the safest "good resume font" choice that stays zero-dependency. No bundled font files, no `xltxtra`/`xunicode` needed. 10.5pt body.
- **Class/packages:** standard `article` class; `geometry`, `fontspec`, `titlesec`, `enumitem`, `hyperref`, `needspace` (all standard, no custom `.cls`, no `xcolor`)

## Compile command

    cd cv && lualatex -interaction=nonstopmode main_<company>.tex

Expected output: `Output written on main_<company>.pdf (1 page, ...)`. If it comes out at 2 pages with only a couple of lines of overflow, prefer trimming per the relevance-weighted rules below over shrinking margins/font size. 3+ pages is a failure.

## Modeled on

This template combines the candidate's own real, previously-1-page resume structure with the verified sources above. Match its structure when tailoring:
- **One-line contact header** directly under the name: `City, State | Phone | Email | LinkedIn URL` -- not split across two centered lines, which costs vertical space for no benefit.
- **Section order:** Summary -> Professional Experience -> Education -> Skills and Certifications. Professional Experience comes immediately after Summary (not after a separate skills block) -- this is the order the reference resume uses and it gets a reader to concrete evidence faster. (No verified source requires moving Skills before Experience; an earlier "skills-first hybrid format" claim from marketing blogs was not corroborated by any of the sources in "Research basis" and was dropped rather than acted on.)
- **"Professional Experience", not "Experience"** -- Berkeley and Jobscan both cite standard section labels (Education, Experience/Professional Experience, Skills) as the ATS-safe convention; "Professional Experience" is the more common of the two acceptable forms.
- **Skills and Certifications is the last section**, written as terse `Category: comma, separated, items` lines -- not full-sentence "Core Competencies" bullets with explanatory clauses. This is the single biggest space saver versus the previous template's design and is a deliberate content-density choice modeled on the reference resume, not a corner cut.
- **No section-heading rule line.** ALL CAPS bold section labels only, separated by whitespace -- matches the reference resume's look and saves a small amount of vertical space per section versus a `\titlerule`.

## Bullet-writing formula (build instructions for drafting Professional Experience content)

Every bullet should follow one of these two structures (Yale OCS / MIT CAPD -- see "Research basis"):

1. **Action + Project + Result:** action verb -> what you built/did -> quantified result. Example (Yale, before/after): *before* "Worked with a student leadership committee to increase member participation" -> *after* "Led a 5-person leadership team to increase student participation by 100% from 50 to 100 members by creating a stronger social media presence."
2. **Lead with impact:** state the impact first, then how it was measured, then what you specifically did. Useful when the achievement itself (e.g. a promotion) is the strongest opening word.

Rules that follow from this:
- **Quantify when the underlying data genuinely supports a number** (%, $, count, time). Don't force a number into every bullet -- an honest unquantified bullet is correct when no real metric exists; a fabricated one is not acceptable under any circumstance.
- **Use specific action verbs, not generic ones.** Yale explicitly contrasts "led," "created," "developed" (strong) against "worked," "helped" (generic). Check every bullet in a draft against this list before finalizing.
- **Don't just list responsibilities.** A bullet that only describes a task ("Responsible for X") without a project or result attached reads as a job description, not an accomplishment -- restructure it to name what was built/done and what changed as a result.
- **Individual contribution over team credit** where accurate -- Yale notes recruiters weight bullets that name the candidate's specific action higher than ones that credit "the team" generically, though never misrepresent a group effort as solo work.

## Style rules

- Single column. No photo, no icons anywhere. The header line is plain text with `\textbar` separators; the LinkedIn URL is shown as literal visible text (e.g. `linkedin.com/in/handle`), not hidden behind a generic "LinkedIn" link label -- a non-clickable render (printed copy, some ATS previews) must still show the actual address.
- **No tables anywhere in Professional Experience or Education.** Each entry uses `\cvheader{Title}{Company, Location}{Dates}`: `Title | Dates` inline on one line (pipe-separated, matching the header contact line -- not a dash), `Company, Location` on the next. No `tabular`/`tabularx`, and no `\hfill` right-alignment either (see Known Pitfalls -- `\hfill` columns were found to scramble `pdftotext` reading order in the prior template).
- **No dash-like characters anywhere** -- bullet marker and date ranges use a literal single hyphen (`label=-`, `[Start]-[End]`), and the title/date separator is a pipe, not a dash. See Known Pitfalls for why `--` (two hyphens) must never be used in this template: LaTeX silently ligatures it into an en dash.
- Fully monochrome -- no `xcolor`. The only typographic differentiation is bold/italic/caps, not color.
- Every Professional Experience bullet follows the Action+Project+Result or lead-with-impact formula above. Never add a number the candidate's actual profile data doesn't support.

## Page budget (1-page target)

| Section | Budget |
|---------|--------|
| Summary | 2-4 lines |
| Professional Experience | most recent role: 4 bullets; next: 3; then 2; oldest: 1-2. Total across all roles should stay near 10-12 bullets for a 1-page fit at 10.5pt with 0.6in margins. |
| Education | 1-2 entries, 1 line each -- if a 2nd (older/lower-level) credential is what's pushing the resume to 2 pages, cutting it is the correct move once a higher degree is in progress or complete, matching "Last-resort structural cuts" in `05-cv-templates.md`, not a truthfulness issue (the credential is simply omitted, not misrepresented). |
| Skills and Certifications | 3-4 category lines + 1 certifications line, comma-separated, no explanatory sentences |

If a candidate's content still doesn't fit 1 page after tightening Skills/Certifications and considering the Education cut above, apply the full relevance-weighted cutting logic in `05-cv-templates.md` (cut the lowest-relevance bullet first, regardless of which role it's under) before accepting a 2nd page.

### Using the page well, not just fitting it

An earlier version of this template's default spacing (`itemsep=0pt`, `titlespacing` before/after `6pt`/`2pt`, `3pt` between jobs) left roughly 40% of the page blank for a typical 3-4 job candidate -- technically "1 page" but visually thin. The current defaults (`itemsep=0.5pt`, `titlespacing` `7pt`/`2pt`, `4pt` between jobs, `4pt` after the header) were tuned live against real candidate content to use most of the page without overflowing.

**If you need to adjust again, prefer title/item spacing over font size or margins.** Both were tried and reverted during tuning: increasing font size from 10.5pt to 11pt, or margins from 0.6in to 0.7-0.85in, pushed a fitting 1-pager to 2 pages -- these costs compound across *every wrapped line* in the document (font) or *every line, via re-wrapping into a narrower column* (margins), not just once per section like a `\vspace`/`titlespacing` bump does. A change that looks small in isolation (10.5pt -> 11pt) can consume far more vertical space than a `\vspace` increase of the same visual size once multiplied across ~45 lines of body text.

## Residual finding: `pdftotext` can misplace short fragments from two-line-wrapped bullets (poppler-specific, not a document defect)

During real-content testing, `pdftotext -layout` (and even plain `pdftotext` with no `-layout`) occasionally dropped a short 2-3 word fragment from the *middle* of a two-line-wrapped bullet (e.g. "HR systems," went missing from its sentence and reappeared, concatenated with an unrelated fragment from a different bullet, several lines later in the extraction). The PDF **renders correctly** -- this is invisible on screen and only shows up in the text layer.

This was root-caused, not just noticed: it persisted across `-layout` vs. plain mode, ragged-right vs. justified text, with/without `\needspace`, and with/without legacy Type1 vs. OpenType fonts -- ruling out all of those as the cause. Cross-checking the same PDF with an independent, non-poppler parser (Python's `pypdf`) extracted the exact same text **completely and correctly**, with no missing or displaced fragments. This confirms the underlying PDF content stream is well-formed and the issue is specific to poppler's `pdftotext` line-reconstruction heuristic for this particular line-wrap pattern, not a defect this template (or any achievable LaTeX change) can fix.

**Practical implication:** `05-cv-templates.md`'s Step 5d ATS check uses `pdftotext` as the standard tool. If it reports a short fragment that looks displaced or duplicated elsewhere in the output (rather than a clean, contiguous omission), don't assume the document is broken -- cross-check with a second extractor (e.g. `python3 -c "from pypdf import PdfReader; print(PdfReader('file.pdf').pages[0].extract_text())"`) before concluding there's a real defect to fix. Real ATS systems use a range of PDF parsers, not exclusively poppler, so a poppler-only artifact is a lower-confidence risk than a fragment that's genuinely missing from the content stream itself (which pypdf would also show as missing).

## Known pitfalls

(Carried forward from real-world testing of the previous `ats-flex-resume` template -- both bugs would recur here without these fixes, since this template reuses the same `\cvheader` pattern.)

- **`\hfill`-based right-aligned dates scramble `pdftotext -layout` reading order.** Confirmed live: a date extracted attached to a different entry than the one it visually sat next to. This template's `\cvheader` puts the date inline after the title instead of right-aligning it. Do not reintroduce `\hfill` for dates without re-running the `pdftotext -layout` check.
- **`--` (two hyphens) silently ligatures into an en dash, not a plain hyphen -- never use it in this template's content.** An earlier version of this template used `label=--` for the bullet marker and `[Start]--[End]` for date ranges, both by mistake: LaTeX's typography engine automatically converts two consecutive hyphens into a single en-dash glyph (`-` -> `\N{EN DASH}`) at typeset time, and three into an em dash. This is why bullets and date ranges rendered with dash-like characters that read as heavier/different from a plain hyphen even though the source "looked like" ASCII hyphens. Fixed by using a single `-` everywhere (bullet marker, date ranges) and a pipe (`\textbar`) instead of a dash for the title/date separator. If you ever need a genuine plain hyphen mid-word (e.g. "self-hosted"), a single `-` is correct and safe; just never write `--` anywhere in body content.
- **`\textbullet` as an itemize marker can extract as `�` (replacement character)**, not a bullet, under some font/engine combinations. This template uses a literal ASCII `-` instead, which sidesteps the risk entirely.
- **`\needspace{N\baselineskip}` before every `\cvheader{}` is required** to stop a bullet list from splitting mid-entry across a page break (confirmed live in a real resume built from the sibling `ats-flex-resume` template). This does not force an overall page count -- it only keeps one job/degree block from breaking internally.
- **Do not place `\vspace{...}` between `\item` entries inside an `itemize` list** -- it can produce an oversized gap before one bullet. Only use `\vspace{3pt}` *between* `\cvheader{}` blocks.
- **No `xcolor`/color anywhere** -- adding an accent color is a deliberate aesthetic change; do it in a copy, not this file.
