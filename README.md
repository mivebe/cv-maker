# CV Maker

A personal, local-first CV maker. One master profile → many role-tailored CV
variants, with full design control and ATS-friendly PDF export. All data stays
in your browser and is exportable as JSON you own.

See [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) for the design rationale.

## Features

1. **Multiple tailored versions** - one master profile drives many variants.
   Each variant chooses which items to include, how to order sections, and can
   override wording per item, all without duplicating data.
2. **Full design control** - per-variant theme tokens: font, size, line height,
   density, colors, 1- or 2-column layout, page margin, heading style.
3. **ATS-friendly + PDF fidelity** - export via the browser's native print
   pipeline, so the PDF is real selectable text (not a rasterized image). A
   built-in ATS check predicts parse quality and can verify an exported PDF by
   extracting its text with pdf.js.
4. **Structured data** - the whole document is Zod-validated JSON you can
   export, hand-edit, version-control, and re-import.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run lint
```

The app loads with sample data on first run. Use **Reset** in the top bar to
reload it, or **Export/Import JSON** to move your data around.

## How it works

- **Master Profile** (`/profile`) - enter all your CV content once. Autosaves to
  `localStorage`.
- **Variants** (`/variants`) - create/duplicate/delete role-specific CVs.
- **Variant editor** (`/variant/:id`) - three tabs:
  - **Content** - variant name, tailored headline/summary, section order &
    visibility, per-item include toggles and text overrides.
  - **Design** - theme tokens (preset, fonts, spacing, colors, columns…).
  - **ATS** - structural checks, a "what an ATS reads" linear-text view, and a
    PDF verifier.
  - A live preview renders beside the controls; **Export PDF / Print** opens the
    print dialog (choose *Save as PDF*).

## Architecture

- **Vite + React + TypeScript**.
- **Zod is the single source of truth** ([src/schema](src/schema)): schemas
  validate JSON imports *and* generate all TS types.
- **Zustand + persist** ([src/store/useStore.ts](src/store/useStore.ts)) -
  normalized state persisted to `localStorage`.
- **Variants reference the master** ([src/lib/resolve.ts](src/lib/resolve.ts))
  and are resolved (include → override → order → hide) at render time, so master
  edits propagate to every variant automatically.
- **App chrome uses Tailwind; the CV document uses plain token-driven CSS**
  ([src/cv/cv.css](src/cv/cv.css)) so the print stylesheet stays predictable.
  Theme tokens map to CSS custom properties
  ([src/cv/themeVars.ts](src/cv/themeVars.ts)).
- **Print/PDF** via `react-to-print` over `window.print()`
  ([src/components/variant/ExportButton.tsx](src/components/variant/ExportButton.tsx));
  ATS text extraction via `pdfjs-dist`, lazy-loaded on demand.

## Data model

The exported/persisted document is `{ version, profile, variants }`:

- `MasterProfile` - basics, experience, education, skills, projects, and
  user-defined custom sections. Every item has a stable id.
- `CVVariant` - `include` map, `sectionOrder`, `hiddenSections`, per-item
  `overrides`, `basicsOverride`, and a `theme` (design tokens).
