# Template: ats-resume-classic

- **Type:** CV
- **Engine:** lualatex or xelatex (both fontspec-capable; nothing engine-specific here)
- **Page limit:** genuinely targets 1 page for a candidate with 3-4 real roles and a compact skills section (not just "allow up to 2" -- this template exists specifically because the previous `ats-flex-resume` template ran to 2 pages with the same real candidate content). Flows to 2 pages only if content truly does not fit after applying the relevance-weighted cutting rules in `05-cv-templates.md`.
- **Fonts:** TeX Gyre Heros, loaded via `fontspec` (`\setmainfont{TeX Gyre Heros}`) -- a free, metric-compatible Helvetica clone, one of the most commonly recommended ATS-safe resume fonts. Checked other common resume-font picks (Carlito/Calibri clone, Lato, Open Sans, PT Sans) against a live test compile: none are available on a stock MiKTeX install without adding font packages. Only `tex-gyre` fonts (Heros/Termes/etc.) are guaranteed present out of the box, so this is the safest "good resume font" choice that stays zero-dependency. No bundled font files, no `xltxtra`/`xunicode` needed. 10.5pt body.
- **Class/packages:** standard `article` class; `geometry`, `fontspec`, `titlesec`, `enumitem`, `hyperref`, `needspace` (all standard, no custom `.cls`, no `xcolor`)

## Compile command

    cd cv && lualatex -interaction=nonstopmode main_<company>.tex

Expected output: `Output written on main_<company>.pdf (1 page, ...)`. If it comes out at 2 pages with only a couple of lines of overflow, prefer trimming per the relevance-weighted rules below over shrinking margins/font size. 3+ pages is a failure.

## Modeled on

This template is deliberately modeled on the candidate's own real, previously-1-page resume -- not an invented aesthetic. Match its structure when tailoring:
- **One-line contact header** directly under the name: `City, State | Phone | Email | LinkedIn URL` -- not split across two centered lines, which costs vertical space for no benefit.
- **Section order:** Summary -> Experience -> Education -> Skills and Certifications. Experience comes immediately after Summary (not after a separate skills block) -- this is the order the reference resume uses and it gets a reader to concrete evidence faster.
- **Skills and Certifications is the last section**, written as terse `Category: comma, separated, items` lines -- not full-sentence "Core Competencies" bullets with explanatory clauses. This is the single biggest space saver versus the previous template's design and is a deliberate content-density choice modeled on the reference resume, not a corner cut.
- **No section-heading rule line.** ALL CAPS bold section labels only, separated by whitespace -- matches the reference resume's look and saves a small amount of vertical space per section versus a `\titlerule`.

## Style rules

- Single column. No photo, no icons anywhere. The header line is plain text with `\textbar` separators; the LinkedIn URL is shown as literal visible text (e.g. `linkedin.com/in/handle`), not hidden behind a generic "LinkedIn" link label -- a non-clickable render (printed copy, some ATS previews) must still show the actual address.
- **No tables anywhere in Experience or Education.** Each entry uses `\cvheader{Title}{Company, Location}{Dates}`: `Title | Dates` inline on one line (pipe-separated, matching the header contact line -- not a dash), `Company, Location` on the next. No `tabular`/`tabularx`, and no `\hfill` right-alignment either (see Known Pitfalls -- `\hfill` columns were found to scramble `pdftotext` reading order in the prior template).
- **No dash-like characters anywhere** -- bullet marker and date ranges use a literal single hyphen (`label=-`, `[Start]-[End]`), and the title/date separator is a pipe, not a dash. See Known Pitfalls for why `--` (two hyphens) must never be used in this template: LaTeX silently ligatures it into an en dash.
- Fully monochrome -- no `xcolor`. The only typographic differentiation is bold/italic/caps, not color.
- Every Experience bullet should lead with an action verb and include a number wherever the underlying achievement is genuinely measurable. Never add a number the candidate's actual profile data doesn't support.

## Page budget (1-page target)

| Section | Budget |
|---------|--------|
| Summary | 2-4 lines |
| Experience | most recent role: 4 bullets; next: 3; then 2; oldest: 1-2. Total across all roles should stay near 10-12 bullets for a 1-page fit at 10.5pt with 0.6in margins. |
| Education | 1-2 entries, 1 line each -- if a 2nd (older/lower-level) credential is what's pushing the resume to 2 pages, cutting it is the correct move once a higher degree is in progress or complete, matching "Last-resort structural cuts" in `05-cv-templates.md`, not a truthfulness issue (the credential is simply omitted, not misrepresented). |
| Skills and Certifications | 3-4 category lines + 1 certifications line, comma-separated, no explanatory sentences |

If a candidate's content still doesn't fit 1 page after tightening Skills/Certifications and considering the Education cut above, apply the full relevance-weighted cutting logic in `05-cv-templates.md` (cut the lowest-relevance bullet first, regardless of which role it's under) before accepting a 2nd page.

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
