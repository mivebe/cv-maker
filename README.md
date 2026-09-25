# CV Maker

A personal, local-first CV maker. One master profile → many role-tailored CV
variants, with full design control and ATS-friendly PDF export. Everything lives
in your browser, and the whole document is JSON you own, export, and re-import.

No account, no server, no upload. `localStorage` is the database and the print
dialog is the exporter.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm run lint
npm run format
```

The app opens on sample data ("Alex Rivera") the first time. The **↺** button in
the header restores it at any point.

---

## How to use it

There are two ways to work with CV Maker, and they meet in the same place - the
JSON document. Pick either, or start with one and finish with the other.

### 1. App only - everything through the UI

The straightforward path. You never see the JSON.

1. **Reset to the sample** (**↺** in the header) so you have a full document to
   push around rather than an empty one.
2. **Master Profile** - replace the sample content with yours. Add, remove and
   reorder sections with **Add section** and the card controls; every section
   type can appear any number of times. Edits autosave.
3. **Variants** - create one CV per target role. A variant *references* the
   master, it does not copy it: fixing a typo in the master fixes it everywhere.
4. **Variant editor** - tailor and design:
   - **Content**: tailored headline/summary/location, which sections show, which
     items are included, per-item wording overrides.
   - **Design**: theme tokens (fonts, spacing, colors, 1 or 2 columns, avatar,
     bullets, chips, issuer branding) plus blanket section-option policies.
   - **ATS**: structural checks, the linear text an ATS actually reads, and a
     verifier that re-extracts text from a PDF you exported.
   - **Rearrange**: a measured miniature of the printed document - drag sections
     between columns and across pages, and the mini pages stay proportional to
     the real ones.
5. **Export PDF / Print** → *Save as PDF*. Real selectable text, not an image.

### 2. Data only - write the CV as data, with AI, then load it

The document is a plain, fully-specified JSON file. That makes the sample a
usable *specification*: hand it to an AI along with your real CV or your notes,
and get back a document the app will load.

1. **Reset to the sample**, then **Export JSON**. You now have `cv-data.json` -
   a complete, valid example of every section type, both override layers, and
   three variants with different themes.
2. **Give that file to an AI** (Claude, or whatever you use) with your own
   material - an old CV, a LinkedIn dump, a pile of notes - and ask for either:
   - *"Recreate my CV in exactly this JSON format, keeping the structure and
     conventions of the example"*, or
   - *"Build a new CV from scratch in this format targeting <role>"*.
3. **Import JSON** in the app. The file is validated against the schema on the
   way in; if something is off you get the exact failing path
   (`profile.sections.3.items.1.value`) instead of a silent half-import.
4. **Finish in the UI.** Photo, colors, spacing, page breaks - design is much
   faster to do with a live preview than to describe in text.

A prompt that works well:

> Here is `cv-data.json` from an app called CV Maker, and here is my current CV.
> Rewrite the JSON so it describes *me* instead of the sample person.
> Rules: keep `"version": 2`; keep the section `kind` values and the field names
> exactly as they are; every `id` must stay unique; and if you change or remove
> an `id`, update every reference to it in the `variants` array
> (`include`, `sectionOrder`, `hiddenSections`, `sectionTitles`,
> `sectionLayout`, `sectionOptions`, `overrides`). Leave `theme` objects alone.
> Do not invent new keys - anything not in the example will be rejected.

Things worth telling the AI, because they are where hand-written JSON goes
wrong:

- **Ids are the wiring.** Variants address master content by id. A renamed id
  silently drops an item out of a variant rather than erroring.
- **Absence means "included".** A new item you add to the master shows up in
  every variant without touching `include`. Same for sections: a variant whose
  `sectionOrder` doesn't mention a new section still gets it, appended at the
  end. So you can grow the profile and leave the variants alone.
- **Options are sparse on purpose.** A section only records the settings it
  explicitly overrides; leave the rest out and the kind's defaults apply.
- **`photo`, `logo` and image icons are data URLs.** Strip them before handing
  the file over - they are large, and nothing useful happens to them in a chat.
  Add the photo back in the app afterwards.
- **Design is the app's job.** Have the AI write content and structure; do the
  `theme` in the Design tab.

Both directions of this round-trip are lossless: what the app exports is exactly
what it persists, so the file is also a perfectly good backup and a sane thing to
keep in git.

### 3. In-app AI assistant - on your own free AI account

The sparkles button in the header opens an assistant docked beside the editor.
It can do everything the editor can: recreate a CV from an attached PDF or
text file, write one from scratch, tighten bullets, add a variant, restyle a
theme, or invent a character's CV.

It runs on **your** account with a **free** provider, called straight from the
browser - there is no CV Maker server and nobody pays:

- **OpenRouter** - click *Connect OpenRouter*, sign in, and you are back with
  a key; only free models are offered (about 50 requests a day).
- **Google Gemini** - paste a free key from
  [Google AI Studio](https://aistudio.google.com/apikey) (Flash-Lite allows a
  few hundred requests a day).

Keys stay in this browser's localStorage. Free tiers may log or train on what
you send, so your CV text should be something you are fine sharing. Photos and
logos are never sent. Each AI edit is validated against the schema and lands
as one step in the history, so Ctrl+Z undoes it.

---

## Features

1. **Many tailored versions, one source of truth** - each variant picks which
   items to include, how sections are ordered and placed, and can override
   wording per item, with no data duplication.
2. **Any number of any section type** - the profile is one ordered array of
   sections over 11 kinds: experience, education, skills, projects, totals,
   custom items, banner, chart, sliders, title list, languages. Two Experience
   sections ("Engineering", "Teaching") and two charts with different chart
   types are all expressible.
3. **Real design control** - fonts, sizes, density, explicit spacing, colors,
   1- or 2-column layout, header/avatar treatment, bullets, chips, page
   backgrounds, and issuer branding (letterhead, footer, watermark, edge stripe)
   for CVs sent out by an agency or studio.
4. **ATS-friendly with proof** - a built-in check predicts parse quality, shows
   the linear text a parser sees, and can verify an actual exported PDF by
   re-extracting its text with pdf.js.
5. **True-to-print preview** - pagination is predicted from real measured
   heights, so the preview's page breaks are the ones you get.
6. **Structured data you own** - Zod-validated JSON, exportable, hand-editable,
   version-controllable, re-importable.

## The app

- **Master Profile** (`/profile`) - all your content, entered once. Autosaves.
  `basics` and issuer `branding` are pinned; everything between them is the
  ordered section list.
- **Variants** (`/variants`) - create, open, duplicate, delete. Renaming and the
  target role live in the variant's own Content tab.
- **Variant editor** (`/variant/:id`) - Content / Design / ATS tabs, the
  Rearrange miniature, and a live preview beside the controls.
- **Header** - undo/redo, the history & saves panel, Export JSON, Import JSON,
  and settings.
- **Settings** (the gear) - every per-device preference in one place:
  appearance (light/dark/auto), how lists reorder (arrows or drag & drop),
  which page the app opens on (profile, variants, or wherever you were last),
  autosave and its interval, a keyboard-shortcut reference, and a Data group
  holding the destructive actions - reset to sample, clear everything, and
  forget the suggestions / recent colours / recent photos this browser kept -
  plus what all of that is costing in browser storage. None of it is part of
  the document, so none of it travels in an export.
- **Undo/redo** - `Ctrl+Z` / `Ctrl+Shift+Z` (`Ctrl+Y` too) anywhere, including
  while a field has focus. A burst of typing in one field undoes as one step.
- **History & saves panel** - a right-hand overlay, closed until the header
  button opens it.
  - *History* lists every change, newest first, named after what it touched
    ("Removed Experience - Acme Corp"). Clicking one applies that change again
    on top of the current document, as a new step - so a re-apply is itself
    undoable. An entry whose target no longer exists is greyed out. History is
    per session: the document is saved continuously, the stack of steps is not.
  - *Saves* keeps named copies in the browser, so downloading JSON is not the
    only way to hold on to a version. One save is active; `Ctrl+S` writes into
    it, autosave rewrites it on an interval (on, every 5 minutes by default,
    both changeable in the panel), and loading another makes that one active.
    Each save can be renamed, downloaded as JSON, or deleted.

## Data model

The exported and persisted document is `{ version: 2, profile, variants }`.

```jsonc
{
  "version": 2,
  "profile": {
    "basics":   { /* name, headline, contact, links, photo, summary */ },
    "sections": [ { "id": "…", "kind": "experience", "title": "", "options": {}, "items": [ … ] } ],
    "branding": { /* the issuing org: logo, tagline, footer note … */ }
  },
  "variants": [ { "id": "…", "name": "…", "include": {}, "sectionOrder": [],
                  "overrides": {}, "sectionOptions": {}, "theme": { … } } ]
}
```

- **Section** - `{ id, kind, title, subtitle, options, items }`. An empty
  `title` falls back to the kind's default label. `options` is **sparse**: only
  what was explicitly set.
- **Variant** - `include` (itemId → boolean), `sectionOrder`, `hiddenSections`,
  `sectionTitles`, `sectionLayout` (column + page break), `optionDefaults`,
  `sectionOptions`, per-item `overrides`, `basicsOverride`, and a `theme`.
- **Four-layer option merge**, most specific last:
  `KIND_OPTION_DEFAULTS` → `section.options` → `variant.optionDefaults` →
  `variant.sectionOptions[id]`. The variant's blanket policy deliberately
  outranks the section's own settings - that is what lets the ATS variant strip
  decoration everywhere in one move; the per-section escape hatch is
  `sectionOptions`.
- **v1 files are rejected**, loudly. v1 used one named array per section type;
  there is no migration, and [io.ts](src/lib/io.ts) says so rather than
  importing an empty profile.

## Architecture

- **Vite + React 19 + TypeScript**, React Router, Tailwind v4 + shadcn/ui for
  the app chrome.
- **Zod is the single source of truth** ([src/schema](src/schema)) - the schemas
  validate imports *and* generate every TS type in the app.
- **Zustand + persist** ([src/store/useStore.ts](src/store/useStore.ts)) -
  state persisted to `localStorage` under `cv-maker:v2` on every change.
- **Undo/redo is a store middleware**
  ([src/store/useHistory.ts](src/store/useHistory.ts)) - it snapshots
  `{ profile, variants }` before each mutation that changes them, and groups
  repeats of the same action on the same target inside 600ms into one step, so
  typing costs one undo rather than one per character. It also keeps the action
  and its arguments, which is what "apply this change again" replays, and
  [historyLabels.ts](src/store/historyLabels.ts) resolves those arguments into
  a readable label at record time - while both the before and after documents
  are still in hand, since a removal can only be named from the one that still
  had it. Snapshots are in memory only: writing them to `localStorage` would
  multiply the avatar data URL by the stack depth and hit the ~5MB quota.
- **Saves are hand-rolled localStorage**
  ([src/lib/saveStore.ts](src/lib/saveStore.ts)) rather than another `persist`
  store: each save is its own key (`cv-maker:save:<id>`) under a metadata index
  (`cv-maker:saves:v1`), so writing one does not rewrite the rest and the list
  renders without parsing every document. A write that would overflow the quota
  drops the oldest *autosaved* entries and retries; a save you made by hand is
  never deleted for you.
- **Variants resolve against the master** at render time
  ([src/lib/resolve.ts](src/lib/resolve.ts)): include → override → order →
  place → hide, plus the option merge.
- **The CV document is plain token-driven CSS**
  ([src/cv/cv.css](src/cv/cv.css)), not Tailwind, so the print stylesheet stays
  predictable. Theme tokens become CSS custom properties in
  [src/cv/themeVars.ts](src/cv/themeVars.ts). Charts are hand-rolled SVG for the
  same reason - no chart library in the print path.
- **Pagination** is measured in [src/cv/pagefit.ts](src/cv/pagefit.ts) and fed
  to both the preview and the Rearrange miniature.
- **Print/PDF** via `react-to-print` over `window.print()`; ATS text extraction
  via `pdfjs-dist`, lazy-loaded only when you use it.
- **Icons** come from a registry ([src/cv/icons](src/cv/icons)), with brand
  icons from `@mivebe/icons`. An icon field takes a registry key *or* an image
  URL / data URL.

## Docs

- [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) - the original design rationale.
- [docs/SECTION_TYPES.md](docs/SECTION_TYPES.md) - the sections-array refactor,
  the options model, and the per-kind checklist for adding a new section type.
