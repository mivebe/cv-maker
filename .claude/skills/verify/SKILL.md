---
name: verify
description: Build, launch and drive the CV Maker app to verify changes at runtime.
---

# Verifying CV Maker changes

Vite + React SPA, no tests. Verification = drive the real app in a browser.

## Launch

```powershell
npm run dev   # background; picks the first free port from 5173 upward -
              # READ the output for the actual port (other instances often run)
```

## Routes (HashRouter!)

- `http://localhost:<port>/#/profile` - master profile editors
- `http://localhost:<port>/#/variants` - variant cards (no anchors; click the
  "Edit" **button** to open `/#/variant/:id`)

## Drive it

No Playwright in the repo. Install `playwright-core` in the scratchpad and use
the system browser: `chromium.launch({ channel: 'chrome' })`. A fresh browser
context gets the seeded sample data (localStorage `cv-maker:v2`).

Gotchas that cost time:
- The reorder-mode toggle is `button[aria-label^="Reordering"]` in the header;
  drag & drop only works after switching mode there (persisted in
  `cv-maker:reorder-mode:v1`).
- dnd-kit drags need a >5px pointer move after mousedown before they engage,
  and must START on a non-interactive spot (not button/input/label).
- Live preview overflow checks: walk up from `.cv-root` comparing
  scrollWidth/clientWidth.
- The Rearrange dialog's mini boxes are `[class*="cursor-grab"]` inside
  `[role="dialog"]`; section geometry is measured from the live preview via
  `.cv-section[data-hl-id]`.

## Checks worth re-running after touching editors/preview

- SuggestInput: clicking a field must NOT open the list; typing must.
- CVPreview: no horizontal scrollbar at any pane width.
- Reorder: arrows animate (FLIP); drag mode hides arrows, shows landing slot.
