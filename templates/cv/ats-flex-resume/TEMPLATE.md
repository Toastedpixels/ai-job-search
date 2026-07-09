# Template: ats-flex-resume

- **Type:** CV
- **Engine:** lualatex (xelatex also works unchanged -- no `fontspec`/custom fonts are used, so nothing here is engine-specific)
- **Page limit:** 1 page by default; flows to 2 pages only if the content genuinely requires it. Never force-fit via font-size reduction, margin shrinking, or aggressive `\vspace` compression -- let a second page happen naturally rather than cramming.
- **Fonts:** Latin Modern Sans (system/TeX-distribution font via `lmodern` + `\sfdefault` -- no bundled font files)
- **Class/packages:** standard `article` class; `geometry`, `titlesec`, `enumitem`, `hyperref` (all standard, no custom `.cls`, no `xcolor`)

## Compile command

    cd cv && lualatex -interaction=nonstopmode main_<company>.tex

Expected output: `Output written on main_<company>.pdf (1 page, ...)` for typical content, or `(2 pages, ...)` for a candidate with enough distinct roles/bullets that 1 page would require cutting real signal. Any page count above 2 is a failure -- cut content per the relevance-weighted rules in `05-cv-templates.md` rather than letting it run to 3 pages.

## Style rules

- Single column. No photo, no icons anywhere -- the contact line is plain text separated by `\textbar` (`phone | email | LinkedIn | city, state`), which extracts as clean literal text with zero glyph-name noise.
- **No tables anywhere in Professional Experience or Education.** Each entry uses the `\cvheader{Title}{Company, Location}{Dates}` command, which right-aligns the dates with a single `\hfill` on an ordinary text line -- not `tabular`/`tabularx`. Tables risk an ATS parser reading cells out of visual order; this template avoids that risk entirely.
- Fully monochrome -- no `xcolor`, no accent color. Section headings are small-caps bold with a thin `\titlerule` underneath; that is the only visual distinction from body text.
- Section order is fixed: Professional Summary -> Core Competencies -> Professional Experience -> Education -> Certifications. Professional Experience must directly follow Core Competencies so concrete evidence follows the skills claim immediately.
- Certifications is a single pipe-separated line, not a list. Delete the whole section if the candidate has none rather than leaving a placeholder line.
- Every Professional Experience bullet should lead with an action verb and include a number wherever the underlying achievement is genuinely measurable. Do not add a number that is not supported by the candidate's actual profile data -- an unquantified bullet is preferable to a fabricated one.

## Page budget (1-page target; 2-page allowance)

| Section | 1-page budget | If flowing to page 2 |
|---------|---------------|----------------------|
| Professional Summary | 2-3 lines | unchanged |
| Core Competencies | 3-4 categories, 1 line each | unchanged |
| Professional Experience | most recent role: 4 bullets; older roles: 2-3 bullets each | keep full bullet counts; let the natural page break fall between roles, not mid-bullet-list |
| Education | 1-2 entries, 1 line each | unchanged |
| Certifications | 1 line | unchanged |

If a candidate has 4+ substantive roles with genuinely distinct, non-redundant achievements, 2 pages is the correct outcome -- do not delete a real, relevant, quantified bullet purely to force 1 page. Cut using the relevance-weighted logic in `05-cv-templates.md` only when a bullet is low-relevance or redundant, not just to hit a page count.

## Known pitfalls

- **Do not place `\vspace{...}` between `\item` entries inside an `itemize` list** -- same failure mode as every other template in this repo: it can produce an oversized gap before one bullet. Only use `\vspace{5pt}` *between* `\cvheader{}` blocks (i.e. between jobs/degrees), never inside a bullet list.
- **No `xcolor`/color anywhere** -- if you're tempted to add an accent color for visual polish, that's a deliberate change to this template's monochrome design; do it in a copy, not this file, since the "maximum ATS-parser compatibility" pitch depends on staying colorless.
- Because there is no bundled font and no `fontspec`, this template has none of the font-loading fragility the stock templates (and the `xunicode`/`xltxtra` chain under classic XeTeX) can hit -- `lualatex`/`xelatex` with standard packages only is the most portable option available.
- This template intentionally does **not** force a page count with `\enlargethispage`/`\needspace` tricks the way the stock moderncv template does -- that's a deliberate contrast with the 2-page-forced stock template, not an oversight.
