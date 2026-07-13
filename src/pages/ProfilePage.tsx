import type { ComponentType, ReactNode } from 'react'
import { BasicsEditor } from '../components/editors/BasicsEditor'
import { ExperienceEditor } from '../components/editors/ExperienceEditor'
import { EducationEditor } from '../components/editors/EducationEditor'
import { SkillsEditor } from '../components/editors/SkillsEditor'
import { ProjectsEditor } from '../components/editors/ProjectsEditor'
import { TotalsEditor } from '../components/editors/TotalsEditor'
import {
  AddCustomSectionButton,
  CustomSectionCard,
} from '../components/editors/CustomSectionsEditor'
import {
  useResponsiveColumns,
  type ColumnCount,
} from '../hooks/useResponsiveColumns'
import type { CustomSection, MasterProfile } from '../schema/profile'
import { useStore } from '../store/useStore'

type SectionKey =
  'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'totals'

const SECTIONS: Record<SectionKey, ComponentType> = {
  basics: BasicsEditor,
  experience: ExperienceEditor,
  education: EducationEditor,
  skills: SkillsEditor,
  projects: ProjectsEditor,
  totals: TotalsEditor,
}

/**
 * Which sections live in which column, per column count. The assignment is
 * fixed rather than height-balanced on purpose: these are forms, and a card
 * that hops columns while you type is worse than a slightly uneven column.
 * Experience is by far the tallest section, so it gets a column to itself as
 * soon as there are three.
 */
const COLUMN_LAYOUT: Record<ColumnCount, SectionKey[][]> = {
  1: [['basics', 'experience', 'education', 'skills', 'projects', 'totals']],
  2: [
    ['basics', 'experience'],
    ['skills', 'education', 'projects', 'totals'],
  ],
  3: [
    ['basics', 'skills', 'totals'],
    ['experience'],
    ['education', 'projects'],
  ],
}

/**
 * Rough card height in "form rows". Only the ratios matter — these numbers feed
 * the packer below, never the DOM. They count what actually grows a card (items,
 * highlights, tags), so a card only moves when content is added or removed, not
 * while you type into it.
 */
function builtinWeight(key: SectionKey, profile: MasterProfile): number {
  switch (key) {
    case 'basics':
      return 14 + profile.basics.links.length * 2
    case 'experience':
      return (
        2 +
        sum(profile.experience, (e) => 9 + e.highlights.length + e.tags.length)
      )
    case 'education':
      return 2 + profile.education.length * 7
    case 'skills':
      return 2 + sum(profile.skills, (g) => 3 + g.skills.length)
    case 'projects':
      return 2 + sum(profile.projects, (p) => 7 + p.highlights.length)
    case 'totals':
      return 2 + profile.totals.length * 2
  }
}

function customWeight(section: CustomSection): number {
  if (section.display === 'banner') return 4
  return 3 + sum(section.items, (i) => 9 + i.highlights.length + i.tags.length)
}

function sum<T>(items: T[], weight: (item: T) => number): number {
  return items.reduce((total, item) => total + weight(item), 0)
}

/**
 * Custom sections go to whichever column is shortest so far. The built-in
 * sections are placed by the fixed table above (a form that reshuffles itself is
 * worse than an uneven column), so custom sections are the only slack the page
 * has — and they are the ones that vary wildly in size. Filling the shortest
 * column means the experience column gets its share once enough custom sections
 * pile up, instead of every one of them landing beside it.
 */
function packCustomSections(
  custom: CustomSection[],
  columns: ColumnCount,
  heights: number[],
): number[] {
  const running = [...heights]
  return custom.map((section) => {
    if (columns === 1) return 0
    let target = 0
    for (let i = 1; i < running.length; i++) {
      if (running[i] < running[target]) target = i
    }
    running[target] += customWeight(section)
    return target
  })
}

export function ProfilePage() {
  const columns = useResponsiveColumns()
  const profile = useStore((s) => s.profile)
  const custom = profile.custom

  const layout: ReactNode[][] = COLUMN_LAYOUT[columns].map((column) =>
    column.map((key) => {
      const Editor = SECTIONS[key]
      return <Editor key={key} />
    }),
  )

  const heights = COLUMN_LAYOUT[columns].map((column) =>
    sum(column, (key) => builtinWeight(key, profile)),
  )

  packCustomSections(custom, columns, heights).forEach((column, i) => {
    const section = custom[i]
    layout[column].push(
      <CustomSectionCard
        key={section.id}
        section={section}
        index={i}
        total={custom.length}
      />,
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Master Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your complete CV content, entered once. Every variant draws from
            this. Changes save automatically.
          </p>
        </div>
        <div className="shrink-0">
          <AddCustomSectionButton />
        </div>
      </div>

      <div
        className="grid items-start gap-4 sm:gap-6"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {layout.map((column, i) => (
          <div key={i} className="flex min-w-0 flex-col gap-4 sm:gap-6">
            {column}
          </div>
        ))}
      </div>
    </div>
  )
}
