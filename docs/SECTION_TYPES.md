# CV Maker - Section Types

Adds four new section types (chart, slider list, title list, languages) and a set of
per-section display settings. Along the way it fixes the reason those were expensive:
the profile currently has a fixed shape, so every new section type costs ~13 files.

This plan replaces that fixed shape with **one ordered array of sections**. After it,
a new section type costs a schema member, a renderer, and an editor.

---

## The problem this solves

Today the profile is a record with one named array per built-in section:

```ts
masterProfileSchema = z.object({
  basics, experience, education, skills, projects, custom, totals, branding
})
```

There is no section union in the schema. The union exists only downstream, in
`resolve.ts`, derived from those fixed keys. That leaves **five parallel vocabularies**
that must be kept in sync by hand:

| Vocabulary | Where | Values |
|---|---|---|
| Profile keys | `MasterProfile` | `basics, experience, education, skills, projects, custom, totals, branding` |
| Section keys | `lib/sections.ts` | `experience, education, skills, projects, totals`, `custom:<id>` |
| Resolved kinds | `lib/resolve.ts` | `experience, education, skills, projects, custom, totals, banner` |
| Editor keys | `pages/ProfilePage.tsx` | `basics, experience, education, skills, projects, totals, branding` |
| List sections | `store/useStore.ts` | `experience, education, skills, projects, totals` |

Three consequences:

1. **You get exactly one of each.** One Experience section, one Skills section. You
   cannot have "Engineering Experience" and "Teaching Experience" as separate blocks,
   and you cannot remove Experience entirely.
2. **`custom` is already the generic section.** It has the superset item shape and the
   only per-section option bag in the app (`display`, `columns`). The built-in kinds
   are effectively hard-coded special cases of it.
3. **A new kind costs ~13 files.** Only `reconcileSectionOrder` and the persist
   `migrate` are automatic; nothing else is registry-driven.

---

## The model

One array. Every section is an instance with an id, a kind, and a title.

```ts
// src/schema/profile.ts

export const sectionBaseSchema = z.object({
  id: z.string(),
  /** Heading text. Empty falls back to the kind's default label ("Experience"). */
  title: z.string().default(''),
  /** Small line under the section title. */
  subtitle: z.string().default(''),
  options: sectionOptionsSchema,
})

export const sectionSchema = z.discriminatedUnion('kind', [
  sectionBaseSchema.extend({ kind: z.literal('experience'), items: z.array(experienceItemSchema) }),
  sectionBaseSchema.extend({ kind: z.literal('education'),  items: z.array(educationItemSchema) }),
  sectionBaseSchema.extend({ kind: z.literal('skills'),     items: z.array(skillGroupSchema) }),
  sectionBaseSchema.extend({ kind: z.literal('projects'),   items: z.array(projectItemSchema) }),
  sectionBaseSchema.extend({ kind: z.literal('totals'),     items: z.array(totalItemSchema) }),
  sectionBaseSchema.extend({ kind: z.literal('items'),      items: z.array(customItemSchema) }),
  sectionBaseSchema.extend({ kind: z.literal('banner'),     items: z.array(z.never()).default([]) }),
  // new
  sectionBaseSchema.extend({ kind: z.literal('chart'),      items: z.array(chartItemSchema) }),
  sectionBaseSchema.extend({ kind: z.literal('sliders'),    items: z.array(sliderItemSchema) }),
  sectionBaseSchema.extend({ kind: z.literal('titleList'),  items: z.array(titleItemSchema) }),
  sectionBaseSchema.extend({ kind: z.literal('languages'),  items: z.array(languageItemSchema) }),
])

export const masterProfileSchema = z.object({
  basics: basicsSchema,
  sections: z.array(sectionSchema).default([]),
  branding: brandingSchema,
})
```

`basics` and `branding` stay outside the array. They are not sections: one is the
document header, the other is a watermark. Neither orders, repeats, or can be absent
in the way a section can.

**`custom` stops being special.** It becomes `kind: 'items'`, one kind among eleven.
`banner` stays a kind rather than a display mode, because with an options bag per
section there is no longer a reason to smuggle it in as a mode of something else.

### Section key = section id

`sectionKey` disappears as a concept. The four variant maps key on `section.id`
directly, and `custom:<id>` prefixing goes away. That deletes most of `lib/sections.ts`:
`customSectionKey`, `isCustomSectionKey`, `customIdFromKey`, and `STANDARD_SECTIONS`.

What survives, reshaped by kind rather than by key:

```ts
// src/lib/sections.ts

export const SECTION_KINDS = [
  'experience', 'education', 'skills', 'projects', 'totals',
  'items', 'banner', 'chart', 'sliders', 'titleList', 'languages',
] as const
export type SectionKind = (typeof SECTION_KINDS)[number]

export const KIND_LABELS: Record<SectionKind, string> = {
  experience: 'Experience', education: 'Education', skills: 'Skills',
  projects: 'Projects', totals: 'Totals', items: 'Custom',
  banner: 'Banner', chart: 'Chart', sliders: 'Slider List',
  titleList: 'Title List', languages: 'Languages',
}

/** Where a newly added section lands. The user drags it after that. */
export const KIND_PLACEMENT: Record<SectionKind, SectionPlacement> = {
  experience: { column: 'main', pageBreakBefore: false },
  education:  { column: 'side', pageBreakBefore: false },
  skills:     { column: 'side', pageBreakBefore: false },
  projects:   { column: 'side', pageBreakBefore: false },
  totals:     { column: 'full', pageBreakBefore: false },
  items:      { column: 'main', pageBreakBefore: false },
  banner:     { column: 'full', pageBreakBefore: false },
  chart:      { column: 'side', pageBreakBefore: false },
  sliders:    { column: 'side', pageBreakBefore: false },
  titleList:  { column: 'side', pageBreakBefore: false },
  languages:  { column: 'side', pageBreakBefore: false },
}
```

`reconcileSectionOrder(savedOrder, profile)` keeps its job but now reconciles ids
against `profile.sections` instead of a static key list. Its forward-compat behaviour
is unchanged: keep known, drop stale, append new.

---

## Settings: where each one lives

Two rules decide the home of every setting.

**A setting lives on the section when it differs between two instances of the same
kind.** Two chart sections must be able to be one pie and one bar. Two slider lists
must be able to have different step counts. These are not style choices, they are
what the section *is*.

**A variant may override any of them.** Otherwise the `ats` preset loses its purpose:
its entire job is to strip decoration for one variant without touching the master.

So the section owns the values, and the variant carries two optional override layers:

```ts
// src/schema/variant.ts

export const variantSchema = z.object({
  // ... existing: id, name, targetRole, include, sectionOrder, hiddenSections,
  //     sectionTitles, sectionLayout, overrides, basicsOverride, theme

  /** Applied to every section. This is how an ATS variant strips decoration at once. */
  optionDefaults: sectionOptionsSchema.partial().default({}),
  /** sectionId -> option overrides, applied on top of optionDefaults. */
  sectionOptions: z.record(z.string(), sectionOptionsSchema.partial()).default({}),
})
```

Resolution order, in `resolve.ts`, four layers, most specific last:

```ts
const options = {
  ...KIND_OPTION_DEFAULTS[section.kind],  // the kind's sensible baseline
  ...section.options,                     // what the user set on this section
  ...variant.optionDefaults,              // this variant's blanket policy (ats)
  ...variant.sectionOptions[section.id],  // this variant, this section
}
```

`variant.optionDefaults` outranks `section.options` on purpose. It is a *policy*
("this variant has no icons anywhere"), and a policy that any section could opt out
of by simply having a value set would be no policy at all. Per-section escape from
the policy is still available, but it must be stated explicitly and per-variant, in
`sectionOptions`.

### The options bag

```ts
export const sectionOptionsSchema = z.object({
  // --- shared, honoured by any kind that has the field ---
  /** Hide the summary / details / description text. */
  showDescription: z.boolean().default(true),
  /** Hide the bullet list. */
  showHighlights: z.boolean().default(true),
  /** `below` keeps the date in the meta row; `right` moves it to the title row. */
  datePosition: z.enum(['below', 'right']).default('below'),
  /** Rule between stacked rows. */
  rowDividers: z.boolean().default(false),
  /** Gated by theme.showIcons; this can additionally suppress just this section. */
  showIcons: z.boolean().default(true),

  // --- chart ---
  chartType: z.enum(['pie', 'donut', 'bar', 'hbar']).default('pie'),
  chartMarker: z.enum(['letter', 'number', 'none']).default('letter'),
  chartPalette: z.enum(['accent', 'categorical']).default('accent'),
  chartShowValue: z.boolean().default(true),
  chartValueFormat: z.enum(['percent', 'raw']).default('percent'),

  // --- sliders ---
  sliderSteps: z.number().min(2).max(10).default(5),
  sliderStartLabel: z.string().default(''),
  sliderEndLabel: z.string().default(''),
  sliderShowLabels: z.boolean().default(true),

  // --- title list ---
  showSubtitle: z.boolean().default(true),

  // --- languages ---
  languageDisplay: z.enum(['slider', 'notches', 'words']).default('words'),
  languageShowLabels: z.boolean().default(true),

  // --- items / banner (carried over from customSectionSchema) ---
  display: z.enum(['items', 'banner']).default('items'),  // see note below
  columns: z.number().default(1),
})
```

One flat bag rather than a per-kind union, because `.partial()` on a union is
awkward and the override maps need `.partial()`. Irrelevant keys are inert: a
`languages` section carries a `chartType` it never reads. The cost is a slightly
untidy type; the benefit is that the two override layers are one-liners.

`display` is now redundant with `kind: 'banner'` and should be **dropped**. It is
listed above only to mark it as deliberately removed.

### What stays on ThemeConfig

Everything already there stays. These are document-wide look-and-feel, and none of
them varies between two sections of the same kind:

`preset, fontFamily, fontSize, lineHeight, density, accentColor, textColor,
headingColor, columns, pageMargin, dateFormat, uppercaseHeadings, uppercaseName,
headingRule, sectionGap, itemGap, sideColumnRatio, columnGap`, the 14 header/avatar
tokens, `showIcons, brandColorIcons, chipStyle, chipFill, bulletStyle, bulletColor,
bulletIndent, titleColor, linkColor, badgeColor`, and the 9 branding tokens.

Three existing tokens **move** to the options bag, since they are per-kind knobs
that were only on the theme because there was nowhere else to put them:

- `totalsColumns` → `options.columns`
- `totalsDivider` → `options.rowDividers`
- `itemDivider` → `options.rowDividers`

`skillStyle` stays on the theme: it is a chip-vs-list rendering choice that reads as
document style, and there is no case for two skills sections styled differently.

`theme.showIcons` stays and remains the master gate. `options.showIcons` can only
subtract: the render condition is `theme.showIcons && options.showIcons`. That way
the `ats` preset keeps stripping icons everywhere for free, with nothing to sync.

### Dropped from the request

**Date specificity.** `theme.dateFormat` already covers it, with values
`MMM yyyy | MMMM yyyy | MM/yyyy | yyyy-MM | yyyy`. `lib/dates.ts` already degrades
correctly (`if (!d.month || format === 'yyyy') return String(d.year)`), so a
year-only date renders as a year whatever the format asks. Nothing to build.

---

## New item schemas

Each kind gets only the fields it needs. `showDescription` / `showHighlights` /
`datePosition` are inert on kinds that have no such field, which is fine and expected.

```ts
export const chartItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  value: z.number().default(0),
  icon: iconRef,
})

export const sliderItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().default(''),
  /** 1..options.sliderSteps. Clamped at render. */
  value: z.number().default(1),
})

export const titleItemSchema = z.object({
  id: z.string(),
  icon: iconRef,
  title: z.string(),
  subtitle: z.string().default(''),
})

export const languageItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** 1..4, see LANGUAGE_STAGES. */
  level: z.number().min(1).max(4).default(1),
})
```

Chart legend rows are marker + title + value, no subtitle, so `chartItemSchema` has
no subtitle field.

---

## Section types

### Chart

A chart with a legend. Each slice/bar carries a marker (A, B, C or 1, 2, 3) that
matches its legend row. That linkage is the whole point: it lets the legend carry
the words while the chart carries only the shape, which keeps the chart readable at
CV scale.

Types: `pie`, `donut`, `bar`, `hbar`.

**Hand-rolled SVG, no chart library.** `src/cv/` is plain CSS by design so the print
output stays predictable, and a chart lib would pull ~100kb, fight that doctrine, and
risk PDF drift. These four shapes are a few dozen lines of path math.

Colours derive from `theme.accentColor` by rotating hue and lightness
(`chartPalette: 'accent'`), so a chart is on-brand in every preset without a second
palette to maintain. `'categorical'` switches to a fixed distinguishable ramp for
when the slices are unrelated categories rather than parts of one thing.

Values render as a percentage of the section total for `pie`/`donut`, raw for
`bar`/`hbar`. `chartValueFormat` can force either.

Layout is driven by width, not by a token (see *Narrow and wide* below): narrow puts
the chart above the legend, wide puts it left of the legend. In both, legend rows
stack.

```
narrow                      wide
┌────────────┐              ┌──────────┬─────────────────┐
│    ◕       │              │    ◕     │ [A] Frontend 45%│
├────────────┤              │          │ [B] Backend  30%│
│[A] Fe   45%│              │          │ [C] Infra    25%│
│[B] Be   30%│              └──────────┴─────────────────┘
│[C] Infra25%│
└────────────┘
```

### Slider list

Rows of title + a slider showing a level within the section's step count. Start and
end labels are section-level (typed once, e.g. "Novice" → "Expert"), with
`sliderShowLabels` hiding them independently of the text, so you can keep the wording
and turn it off for one variant.

```
narrow (1 col)                wide (auto-fit)
React      [───o─]            React    [───o─]   Python  [──o──]
Python     [──o──]            Go       [─o───]   Rust    [─o───]
```

### Title list

Rows of icon + title + subtitle. The compact "awards / certifications" shape.
`showSubtitle` and `showIcons` control the two optional parts.

### Languages

Four stages, fixed:

```ts
export const LANGUAGE_STAGES = ['Beginner', 'Intermediate', 'Professional', 'Native'] as const
```

Three display modes:

- `words` - the stage name to the right of the language.
- `notches` - four notches, filled to level, to the right of the language.
- `slider` - a slider *below* the language, with start ("Beginner"), end ("Native")
  and current (the stage name for that level) labels. `languageShowLabels` hides all
  three.

The labels are not typed. They come from `LANGUAGE_STAGES`, so there is nothing to
fill in and no way for the words and the notch count to disagree.

The slider mode is the only one that goes below the title, because a slider plus
three labels does not fit beside a language name in a side column.

```
words            notches           slider
German  Professional    German  [███░]     German
Spanish Beginner        Spanish [█░░░]     Beginner [──o─] Native
                                                 Professional
```

---

## Narrow and wide

Every new section reflows by width, with **no token and no column count to pick**.

`resolve.ts` already knows `column: 'main' | 'side' | 'full'`, but the section does
not need to be told: CSS `auto-fit` reads the actual width.

```css
.cv-titlelist,
.cv-sliders,
.cv-languages {
  display: grid;
  gap: var(--cv-gap) var(--cv-column-gap);
  grid-template-columns: repeat(auto-fit, minmax(var(--cv-list-min, 14em), 1fr));
}
```

The side column is narrow, so `auto-fit` yields one column. The main column is wide,
so it yields two or three. Drag a section to the sidebar and it reflows on its own.
Nothing overflows, nothing needs re-picking, and it stays correct when
`sideColumnRatio`, `columnGap` or `pageMargin` change.

The chart uses the same idea with a container query or a width-driven grid, since it
needs a two-up chart/legend split rather than a repeating track.

This is the one place the plan adds *less* machinery than the existing code: `totals`
does this with a `totalsColumns` token plus JS-computed `data-row-start` /
`data-row-end` attributes, because `:nth-child()` cannot take a column count. With
`auto-fit` there is no column count to pass.

Row dividers in an auto-fit grid have the same hazard the current code documents
("a divider between stacked items would misfire across grid cells"). Use
`border-top` on every row plus `:first-child` suppression only when the grid is
single-column; in a multi-column grid, dividers apply per row via the grid's own
row lines, drawn with a background gradient rather than per-cell borders.

---

## ATS

Each new kind must contribute real text to `lib/ats.ts`, and the `ats` preset must
render it as text. A pie chart with no text is invisible to a parser, and languages
are something recruiters actively filter on, so hiding these sections in the ATS
variant would lose real signal.

Extractor output per kind:

| Kind | Extracted text |
|---|---|
| `chart` | `Frontend 45%, Backend 30%, Infra 25%` |
| `sliders` | `React 4/5, Python 3/5` |
| `titleList` | `AWS Certified - 2024` |
| `languages` | `German - Professional, Spanish - Beginner` |

The `ats` preset sets `optionDefaults` so every section degrades at once:

```ts
ats.optionDefaults = {
  languageDisplay: 'words',   // no slider, no notches
  chartMarker: 'none',
  showIcons: false,
  rowDividers: false,
}
```

Chart under `ats` renders the legend only and skips the SVG entirely, since PDF text
extractors can choke on inline SVG. That is a render-time branch on
`theme.preset === 'ats'`, not an option, because it is a correctness rule rather
than a preference.

---

## The editor

`ProfilePage.tsx` today has a hard-coded `Record<SectionKey, ComponentType>`, a
fixed three-column `COLUMN_LAYOUT` table, and a `builtinWeight` switch. All three go.

```
[+ Add section ▾]
   Experience · Education · Skills · Projects · Totals
   Chart · Slider list · Title list · Languages · Custom · Banner

[Basics            ]   ← pinned, not a section
[Experience   ↑↓✕  ]
[Chart        ↑↓✕  ]
[Languages    ↑↓✕  ]
[Branding          ]   ← pinned, not a section
```

Cards render in `profile.sections` order. The registry is keyed by **kind, not
instance**, which is what makes a new kind cheap:

```ts
// src/pages/ProfilePage.tsx
const EDITORS: Record<SectionKind, ComponentType<{ id: string }>> = {
  experience: ExperienceEditor, education: EducationEditor, skills: SkillsEditor,
  projects: ProjectsEditor, totals: TotalsEditor, items: CustomItemsEditor,
  banner: BannerEditor, chart: ChartEditor, sliders: SliderListEditor,
  titleList: TitleListEditor, languages: LanguagesEditor,
}
```

Every editor takes a section `id` instead of reading a fixed profile key, and each
grows a settings block (a disclosure, so the common case stays uncluttered) bound to
that section's `options`.

`packCustomSections` and the shortest-column packing are removed. A single ordered
list of cards is what "any number of any kind, reorderable" actually looks like; the
old packing existed to lay out a fixed set of known cards.

`SliderField` in `ThemeEditor.tsx` is currently not exported. Lift it to
`@/components/app-ui` alongside `Field` / `SectionCard` / `EmptyHint` / `ItemControls`
so `sliderSteps` and the level inputs can use it.

`IconPicker` at `src/components/IconPicker.tsx` already exists and already matches
`design_mockup/icon_picker.png`. `titleList` and `chart` reuse it as-is.

---

## The store

The generic list machinery gets simpler, not harder. Today `ListSection` is a union
of five fixed keys with a parallel `ItemOf` map and a `FACTORIES` map, plus eight
bespoke actions for custom sections' extra nesting level. With one array, *every*
section has that nesting level, so the bespoke path becomes the only path:

```ts
addSection(kind: SectionKind): string
updateSection(id: string, patch: Partial<SectionBase>): void
updateSectionOptions(id: string, patch: Partial<SectionOptions>): void
removeSection(id: string): void
moveSection(id: string, dir: -1 | 1): void

addItem(sectionId: string): string
updateItem(sectionId: string, itemId: string, patch: object): void
removeItem(sectionId: string, itemId: string): void
moveItem(sectionId: string, itemId: string, dir: -1 | 1): void
```

`ListSection`, `ItemOf`, and the eight `*CustomSection` / `*CustomItem` actions are
deleted. `FACTORIES` survives, rekeyed by `SectionKind`, and gains
`newSection(kind)` which pairs a fresh id with `KIND_LABELS[kind]` as the title.

`addItem` needs the item factory for the section's kind, which it reads from the
section itself: `FACTORIES[getSection(sectionId).kind]()`.

---

## Persistence: nuke and reseed

**Decision: bump the persist key to `cv-maker:v2`. No migration, no safety net.**

The v6 → v7 shape change is not a field addition, so the current migrate strategy
(re-parse through the schemas, letting Zod defaults backfill) cannot do it. A real
migration would be ~40 lines and would need to survive `parseVariants` aborting the
whole migration if any single variant fails.

Given that the only data that exists is the sample plus one real CV that is already
exportable to JSON, that is not worth writing.

**Consequence, stated plainly: every profile saved in a browser under `cv-maker:v1`
becomes unreachable.** The blob stays in `localStorage` but the app never reads it
again. Export anything real to JSON before this ships.

The JSON import path (`schema` → `safeParse`) must reject v1 exports with a clear
message rather than silently producing an empty profile, since a v1 export will parse
as `{ sections: [] }` once `sections` has `.default([])`. Guard on the absence of a
`sections` key.

---

## Sample data

`lib/sample.ts` is the format's proof - "if the sample renders, the format is
expressible". It must exercise every new kind, and specifically the things that were
previously impossible:

- **Two Experience sections** ("Engineering", "Teaching") - proves N-per-kind.
- **Two Chart sections**, one `pie` and one `bar` - proves per-section `chartType`,
  which is the case that forced options onto the section rather than the theme.
- One `sliders`, one `titleList`, one `languages` section.
- One section placed `side` and one `main` **of the same kind**, to prove `auto-fit`
  reflow with no token.
- The `ats` variant sets `optionDefaults` to prove the blanket policy layer.
- One variant sets `sectionOptions` for a single section, to prove the per-section
  override layer beats the policy.

Ids stay stable hand-written strings, not generated, so variants can reference them
deterministically.

---

## Highlights: no change

Per-highlight show/hide already works the way you use it, via `OverrideList` in
`IncludeOverrideEditor.tsx`, for experience, projects and custom items. Highlights
stay `string[]`. No ids, no migration.

**The caveat, documented rather than fixed:** the first edit to a variant's highlight
list snapshots the master array into `variant.overrides[itemId].highlights`, and from
then on the two are decoupled. Later edits to that item's bullets on the master will
**not** reach that variant. "Reset to master" (`clearOverride`) is the only way back.

Deleting a bullet in a variant therefore looks like hiding but is really a fork. If
that bites later, the fix that fits the grain is giving highlights ids
(`{id, text}[]`) and reusing `variant.include`, which is already a flat
`Record<string, boolean>` and would accept a bullet id with no new machinery. That is
a real data migration and is explicitly out of scope here.

---

## Work order

Each step leaves the app building and rendering.

1. **Schema.** `sectionSchema`, `sectionOptionsSchema`, the four new item schemas,
   `masterProfileSchema.sections`. Types fall out of `z.infer`.
2. **Sections registry.** Rewrite `lib/sections.ts` around `SectionKind`. Delete the
   `custom:` key helpers.
3. **Store.** New section/item actions, `FACTORIES` rekeyed, persist key → v2.
   Delete `ListSection` / `ItemOf` / the eight custom actions.
4. **Resolve.** `ResolvedSection` becomes the schema union plus resolved `options`.
   Implement the four-layer merge.
5. **Sample.** Rewrite to the new shape with the coverage listed above. This is the
   first point the app renders again.
6. **Renderer.** Port the existing seven kinds to read `section.options`. No new
   kinds yet. `itemDivider` / `totalsColumns` / `totalsDivider` move off the theme.
7. **ProfilePage.** `EDITORS` by kind, Add Section menu, ordered cards. Delete
   `COLUMN_LAYOUT`, `builtinWeight`, `packCustomSections`. Existing editors take an
   `id` prop.
8. **ThemeEditor / VariantEditor.** Remove the three moved tokens; add the
   `optionDefaults` and per-section `sectionOptions` controls.
9. **New kinds, one at a time** - `titleList`, then `languages`, then `sliders`, then
   `chart`. Each is: item schema (done in 1), renderer, CSS, editor, `EDITORS` entry,
   `ats.ts` branch, sample content. `chart` is last because the SVG is the only real
   unknown.
10. **pagefit.** Mirror any new unbreakable box in `ATOMS`. `cv.css` and
    `pagefit.ts` must agree or pagination drifts from the print output.

Steps 1-8 are the refactor and buy nothing visible on their own. Step 9 is where the
four requested section types land, and each one is now a single-file-ish change,
which is the point of the preceding eight.

---

## Per-kind checklist for any future section type

After this plan, adding a kind is:

1. `schema/profile.ts` - item schema + a member on `sectionSchema`
2. `lib/sections.ts` - `SECTION_KINDS`, `KIND_LABELS`, `KIND_PLACEMENT`
3. `lib/factory.ts` - `newXItem()` + `FACTORIES` entry
4. `cv/CVDocument.tsx` - a renderer, spreading `{...hl(item.id)}` on its root
5. `cv/cv.css` - classes
6. `cv/pagefit.ts` - only if it introduces an unbreakable box
7. `components/editors/XEditor.tsx` + the `EDITORS` entry
8. `lib/ats.ts` - a text branch
9. `lib/sample.ts` - sample content

Nine touches, none of them a parallel vocabulary to keep in sync. Compare with the
thirteen today, four of which are lookup tables that TypeScript can only partly
police.

---

## Open risks

- **Chart SVG print fidelity.** Hand-rolled SVG in the browser print pipeline is
  unproven in this codebase. If pie/donut arcs render badly in PDF, the fallback is
  `hbar` only, which is plain divs and cannot drift. Validate early with a real
  print, not just screen.
- **`auto-fit` in the print pipeline.** Grid auto-placement across a page break is
  the kind of thing print engines get wrong. If a `languages` grid splits badly,
  `break-inside: avoid` on the grid is the escape, at the cost of it jumping whole to
  the next page.
- **Options bag as one flat type.** A `languages` section carrying `chartType` is
  untidy and TypeScript will not stop you reading the wrong option in the wrong
  renderer. Accepted for the `.partial()` ergonomics in the two override layers; if
  it causes real bugs, the fix is a per-kind options union plus a hand-written
  partial-merge per kind.
- **`optionDefaults` outranking `section.options`** is the surprising rule in the
  merge. It is correct for the ATS case but will read as a bug to whoever hits it
  first. It needs a comment at the merge site, not just here.
