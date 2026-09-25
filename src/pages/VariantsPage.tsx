import { useNavigate } from 'react-router-dom'
import {
  Copy,
  LayoutTemplate,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Type,
} from 'lucide-react'
import type { CVVariant, MasterProfile } from '../schema'
import { useStore } from '../store/useStore'
import { languageBadge, languageInfo } from '../lib/i18n'
import { outdatedKeys } from '../lib/translate'
import { resolveVariant } from '../lib/resolve'
import { atsChecks } from '../lib/ats'
import { EmptyHint } from '@/components/app-ui'
import { TranslateDialog } from '@/components/variant/TranslateDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { THEME_PRESET_LABELS } from '../cv/themes'

/** `"Geist Variable", "Helvetica Neue", …` -> `Geist`. */
function fontName(family: string): string {
  const first = family.split(',')[0] ?? ''
  return first
    .replace(/["']/g, '')
    .replace(/ Variable$/, '')
    .trim()
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** "Edited 3 days ago"; variants from before timestamps existed show nothing. */
function editedLabel(at: number | undefined): string | undefined {
  if (!at) return undefined
  const seconds = (at - Date.now()) / 1000
  for (const [unit, size] of UNITS)
    if (Math.abs(seconds) >= size)
      return `Edited ${relative.format(Math.round(seconds / size), unit)}`
  return 'Edited just now'
}

/**
 * A thumbnail page showing the layout: one solid column block, or a main and
 * a side block at the variant's own proportions.
 */
function ColumnsGlyph({ columns, ratio }: { columns: 1 | 2; ratio: number }) {
  // `ratio` is side:main (the grid is `1fr <ratio>fr`), so main's share is 1/(1+ratio).
  const inner = 10
  const main = 1 / (1 + Math.max(ratio, 0.1))
  const mainW = Math.round(inner * Math.min(Math.max(main, 0.35), 0.8) * 2) / 2
  return (
    <svg
      viewBox="0 0 14 16"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <rect x="0.75" y="0.75" width="12.5" height="14.5" rx="1.5" />
      {columns === 1 ? (
        <rect
          x="3"
          y="3"
          width={inner - 2}
          height="10"
          rx="0.5"
          fill="currentColor"
          stroke="none"
          opacity={0.55}
        />
      ) : (
        <>
          <rect
            x="2.5"
            y="3"
            width={mainW - 1}
            height="10"
            rx="0.5"
            fill="currentColor"
            stroke="none"
            opacity={0.55}
          />
          <rect
            x={2.5 + mainW + 0.5}
            y="3"
            width={inner - mainW - 1.5}
            height="10"
            rx="0.5"
            fill="currentColor"
            stroke="none"
            opacity={0.55}
          />
        </>
      )}
    </svg>
  )
}

/** True when every ATS check passes: the same verdict as the ATS tab. */
function isAtsSafe(profile: MasterProfile, v: CVVariant): boolean {
  return atsChecks(resolveVariant(profile, v), v.theme).every(
    (c) => c.level === 'pass',
  )
}

/** Design and freshness at a glance: what it looks like, when it last changed. */
function VariantFacts({
  variant: v,
  profile,
}: {
  variant: CVVariant
  profile: MasterProfile
}) {
  const edited = editedLabel(v.updatedAt)
  const outdated = outdatedKeys(profile, v).length
  return (
    <div className="space-y-1.5 rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
      <p className="flex min-w-0 items-center gap-2" title="Design preset">
        <LayoutTemplate className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate font-medium text-foreground/80">
          {THEME_PRESET_LABELS[v.theme.preset]}
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-1.5" title="Accent colour">
          {/* The ring keeps a near-black or near-white accent visible in either theme. */}
          <span
            className="size-3 shrink-0 rounded-full ring-1 ring-foreground/20 ring-offset-1 ring-offset-background"
            style={{ background: v.theme.accentColor }}
            aria-hidden
          />
          Accent
          <span className="font-mono text-[0.7rem] uppercase opacity-80">
            {v.theme.accentColor}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5" title="Font">
          <Type className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{fontName(v.theme.fontFamily)}</span>
        </span>
        <span className="flex items-center gap-1.5" title="Layout">
          <ColumnsGlyph
            columns={v.theme.columns}
            ratio={v.theme.sideColumnRatio}
          />
          {v.theme.columns} {v.theme.columns === 1 ? 'column' : 'columns'}
        </span>
      </div>
      {(edited || outdated > 0) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {edited && (
            <span title={new Date(v.updatedAt!).toLocaleString()}>
              {edited}
            </span>
          )}
          {outdated > 0 && (
            <Badge
              variant="outline"
              className="border-amber-500/50 text-amber-700 dark:text-amber-400"
              title="Master text changed since these fields were translated"
            >
              {outdated} outdated
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

export function VariantsPage() {
  const variants = useStore((s) => s.variants)
  const profile = useStore((s) => s.profile)
  const addVariant = useStore((s) => s.addVariant)
  const duplicateVariant = useStore((s) => s.duplicateVariant)
  const deleteVariant = useStore((s) => s.deleteVariant)
  const navigate = useNavigate()

  const onCreate = () => {
    const id = addVariant('New Variant')
    navigate(`/variant/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Variants
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Role-specific CVs built from your master profile. Each one picks its
            own sections, ordering, wording, and design.
          </p>
        </div>
        <Button variant="default" className="h-9 self-start" onClick={onCreate}>
          <Plus />
          New variant
        </Button>
      </div>

      {variants.length === 0 && (
        <EmptyHint>
          No variants yet. Create one to tailor your CV for a specific role.
        </EmptyHint>
      )}

      {/* Cards never shrink below what their four labelled buttons need. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,23rem),1fr))] gap-4">
        {variants.map((v) => (
          <Card
            key={v.id}
            className="group @container relative flex flex-col transition-[box-shadow,background-color,transform] duration-200 hover:bg-[color-mix(in_oklch,var(--card),var(--primary)_4%)] hover:shadow-lg hover:ring-2 hover:ring-primary/50 motion-safe:hover:-translate-y-0.5"
          >
            <CardHeader>
              <div className="flex min-w-0 items-start gap-3">
                {/* The ::after overlay stretches this button over the whole card,
                    so clicking anywhere opens the variant; the footer sits above it. */}
                <button
                  onClick={() => navigate(`/variant/${v.id}`)}
                  className="min-w-0 flex-1 text-left after:absolute after:inset-0 after:rounded-[inherit]"
                >
                  <CardTitle className="truncate transition-colors group-hover:text-primary">
                    {v.name}
                  </CardTitle>
                  <CardDescription className="mt-0.5 truncate text-xs">
                    {v.targetRole || 'No target role set'}
                  </CardDescription>
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                  {isAtsSafe(profile, v) && (
                    <Badge
                      variant="outline"
                      className="border-emerald-600/40 text-emerald-700 dark:border-emerald-400/40 dark:text-emerald-400"
                      title="Passes every check on the ATS tab"
                    >
                      <ShieldCheck />
                      ATS-safe
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="font-mono tracking-wide"
                    title={languageInfo(v.language).name}
                  >
                    {languageBadge(v.language)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <VariantFacts variant={v} profile={profile} />
            </CardContent>
            {/* One row when the card is wide enough, Delete at the far end away
                from the everyday actions; on a narrow card an even 2x2 grid
                rather than a ragged wrap. */}
            <CardFooter className="relative z-10 mt-auto grid grid-cols-2 gap-1.5 border-t pt-3 @min-[21rem]:flex @min-[21rem]:items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/variant/${v.id}`)}
              >
                <Pencil />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const id = duplicateVariant(v.id)
                  if (id) navigate(`/variant/${id}`)
                }}
              >
                <Copy />
                Duplicate
              </Button>
              <TranslateDialog variant={v} size="sm" />
              <Button
                variant="destructive"
                size="sm"
                className="@min-[21rem]:ml-auto"
                onClick={() => {
                  if (confirm(`Delete variant "${v.name}"?`))
                    deleteVariant(v.id)
                }}
              >
                <Trash2 />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
