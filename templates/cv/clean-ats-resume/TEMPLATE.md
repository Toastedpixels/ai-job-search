# Template: clean-ats-resume

- **Type:** CV
- **Engine:** pdflatex
- **Page limit:** 1 page
- **Fonts:** Latin Modern Sans (system/TeX-distribution font via `lmodern` + `\sfdefault` -- no bundled font files, no `fontspec`, works on any TeX install)
- **Class/packages:** standard `article` class; `geometry`, `titlesec`, `enumitem`, `xcolor`, `hyperref` (all standard TeX Live/MiKTeX packages, no custom `.cls`)

## Compile command

    cd cv && pdflatex -interaction=nonstopmode main_<company>.tex

Expected output: `Output written on main_<company>.pdf (1 page, ...)`. Any page count other than 1 is a failure that must be fixed before presenting to the user.

## Style rules

- Single column, no photo, no icon fonts anywhere (contact line is plain text separated by `\textbar`) -- this is deliberately the most ATS-safe contact-line format available: no glyph-name noise (`MOBILE-ALT`, `Envelope`) in the extracted text layer at all, unlike icon-based templates.
- One accent color (`accent`, default `#1F3864` navy) used only for the name and section headings. Everything else is black. Change the hex in the `\definecolor{accent}{HTML}{...}` line to restyle.
- Section order is fixed: Summary -> Core Skills -> Professional Experience -> Education -> Certifications. Do not reorder -- Professional Experience must always follow Core Skills so the reader hits concrete evidence right after the skills claim.
- Each job entry uses the `\cvheader{Title}{Company, Location}{Dates}` command for a consistent two-line block (title+dates on one line, company/location on the next), followed by a manually-written `itemize` block for bullets.
- Certifications section is a single pipe-separated line, not a list -- delete the whole section if the candidate has none rather than leaving a placeholder line.
- Hard 1-page limit. Budget: Summary 2-3 lines; Core Skills 3 categories, 1 line each; Professional Experience 2-3 roles (4-5 bullets most recent, 2-3 older); Education 1-2 entries, 1 line each; Certifications 1 line.

## Known pitfalls

- **Do not put `\vspace{...}` between `\item` entries inside an `itemize` list** -- same failure mode as the stock moderncv template: it can produce an oversized gap before one bullet. Only use `\vspace{4pt}` *between* `\cvheader{}` blocks (i.e. between jobs), never inside a bullet list.
- **1-page budget is tight.** If content overflows to a second page, cut using relevance-weighted logic (see `05-cv-templates.md` -> "Relevance-weighted cutting"): drop the lowest-relevance bullet first, regardless of which job it's under, before touching structural sections like Education.
- **`\titlerule` under each section heading** is intentional (the "clean" look comes from these thin rules) -- do not remove it when tailoring content, only when deliberately restyling.
- Because there is no bundled font and no `fontspec`, this template has none of the xelatex/lualatex font-loading fragility the stock templates can hit (e.g. missing `fontawesome5`/`xunicode` packages hanging MiKTeX's auto-installer) -- `pdflatex` with standard packages is the most portable option in this repo.
