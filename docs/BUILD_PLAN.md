# CV Maker - Build Plan

A personal, local-first CV maker. Built because existing tools lack the four
features that matter most to me.

## Goals (the reason this exists)

1. **Multiple tailored versions** - one master profile → many role-specific CV
   variants, no re-typing.
2. **Full design control** - layout, typography, spacing, columns, sections all
   adjustable; not locked into rigid templates.
3. **ATS-friendly + PDF fidelity** - exports parse cleanly in applicant-tracking
   systems *and* look exactly right as PDF.
4. **Structured data / import-export** - the CV is JSON I own, version-control-able,
   importable/exportable.

## Non-goals (v1)

- No backend, no accounts, no cloud sync (local web app - data stays in the browser
  + exportable files).
- No collaboration / multi-user.
- No AI content generation (can bolt on later).

---

## The one hard decision: how to produce the PDF

This is the crux, because "full design control" and "ATS-friendly" pull in opposite
directions if you pick the wrong tool.

| Approach | Fidelity | ATS-safe? | Design control | Verdict |
|---|---|---|---|---|
| `html2canvas` → image PDF | perfect | **No** (rasterized, zero selectable text) | high | ✗ reject |
| Programmatic PDF (`@react-pdf/renderer`) | perfect | Yes | high but rebuild layout in a PDF DSL | fallback |
| **Browser print pipeline (`@media print` + `@page`)** | high | **Yes** (real text) | high (it's just CSS) | ✓ **primary** |

**Decision: render the CV as semantic HTML and export via the browser's native print
pipeline.** Real, selectable text (ATS parses it), near-perfect fidelity, and design
is just CSS - no second rendering engine to fight. `@react-pdf/renderer` stays on the
bench as a fallback only if print pagination proves too limiting.

**ATS constraint that shapes rendering:** ATS parsers favor a single logical reading
order, real `<h1>/<h2>` headings, standard section names, and no text-in-columns
tricks that scramble reading order. So themes must degrade to a clean linear document.
We build one strictly-ATS theme and validate it (see Milestone 5).

---

## Tech stack

- **Vite + React + TypeScript** - chosen.
- **Zod** - schema is the single source of truth: it validates JSON imports *and*
  generates the TypeScript types for the whole data model.
- **Zustand + persist middleware** - app state, persisted to `localStorage` (a CV is
  small; 5 MB is plenty). Migrate to IndexedDB only if size ever demands it.
- **react-hook-form + Zod resolver** - the section editors.
- **React Router** - `/profile` (master editor), `/variants`, `/variant/:id` (tailor +
  preview).
- **Styling** - Tailwind for the *app chrome* only. The **CV document** is rendered
  with plain CSS + CSS custom properties (design tokens) so the print stylesheet stays
  clean and predictable. Keep these two worlds separate.
- **react-to-print** (thin wrapper over `window.print()`) for the export button.

---

## Data model (sketch)

```ts
// Zod schemas → types. This is the file everything else hangs off of.
MasterProfile = {
  basics: { name, headline, email, phone, location, links[] }
  experience: Item[]   // each item has a stable id
  education:  Item[]
  skills:     SkillGroup[]
  projects:   Item[]
  custom:     Section[]   // user-defined sections
}

CVVariant = {
  id, name                       // e.g. "Backend - Acme Corp"
  basedOn: MasterProfile         // reference, not a copy
  include: { [itemId]: boolean } // which master items appear
  order:   Section[]             // section + item ordering for THIS variant
  overrides: { [itemId]: Partial<Item> } // per-variant tweaks (e.g. shorter bullet)
  theme:   ThemeConfig           // design tokens for this variant
}
```

The variant-references-master + include/override model is what delivers Feature #1
without data duplication: edit the master once, every variant updates.

---

## Milestones

Each milestone is independently shippable and demoable.

### M0 - Scaffold
- Vite + React + TS project, ESLint/Prettier, folder structure, Tailwind, routing shell.
- **Done when:** `npm run dev` shows an empty app with nav; `npm run build` passes.

### M1 - Data model + persistence + import/export
- Zod schemas for `MasterProfile` and `CVVariant`; derived TS types.
- Zustand store persisted to localStorage.
- Export-to-JSON and import-from-JSON (with Zod validation on import).
- **Done when:** I can hand-edit a JSON file, import it, and see it round-trip out.
  *(Delivers Feature #4.)*

### M2 - Master profile editor
- react-hook-form editors for every section (basics, experience, education, skills,
  projects, custom sections). Add/remove/reorder items (drag or up/down).
- **Done when:** I can enter my full CV once and it persists across reloads.

### M3 - Variant system
- Create/duplicate/delete variants. Per-variant item include-toggles, reordering, and
  field overrides. Master edits propagate to all variants.
- **Done when:** two variants share a master but show different subsets/order.
  *(Delivers Feature #1.)*

### M4 - Rendering + live preview + first theme
- CV document renderer (semantic HTML, token-driven CSS). Live side-by-side preview.
- One clean default theme.
- **Done when:** editing the profile updates the preview in real time.

### M5 - Export + ATS validation
- Print stylesheet (`@page` margins, page-break control, paged preview).
- Export button → PDF via print pipeline.
- **One strict single-column ATS theme.** Validate by running an exported PDF through
  an ATS-style text extractor (e.g. `pdf.js`/`pdftotext`) and asserting sections,
  headings, and reading order come out intact.
- **Done when:** exported PDF looks right *and* extracts to clean structured text.
  *(Delivers Feature #3.)*

### M6 - Design controls
- UI to edit theme tokens per variant: font family/size, spacing/density, colors,
  1- vs 2-column, section visibility, margins.
- Second, more visual (non-ATS) theme to prove the theming system generalizes.
- **Done when:** I can restyle a variant substantially without touching code.
  *(Delivers Feature #2.)*

### M7 - Polish (optional / later)
- LinkedIn or JSON-Resume import mapping.
- Multiple export presets, keyboard shortcuts, undo/redo.
- Backup/restore of the whole dataset.

---

## Sequencing & risk

- **Front-load M5's ATS check into M4.** The riskiest requirement is fidelity + ATS
  together; get a print export working against the first theme early so pagination
  surprises surface before we've built six themes on a wrong assumption.
- Data model (M1) is the spine - get the Zod schemas right before building editors on
  top of them; reshaping later is the expensive mistake.
- Everything else is standard CRUD UI and low-risk.

## Suggested first move

Build M0 + M1 together: scaffold plus the Zod data model and JSON import/export. That
gives a testable spine (structured data you own) before any UI polish.
