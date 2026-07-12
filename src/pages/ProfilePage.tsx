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
import { useStore } from '../store/useStore'

type SectionKey =
  | 'basics'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'totals'

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
  3: [['basics', 'skills', 'totals'], ['experience'], ['education', 'projects']],
}

/**
 * Column each custom section is appended to. Round-robin rather than all in one
 * column: custom sections are usually short, so spreading them keeps any single
 * column from running away. Experience already owns the middle column at three,
 * so it is skipped.
 */
function customSectionColumn(index: number, columns: ColumnCount): number {
  if (columns === 1) return 0
  if (columns === 2) return index % 2
  const spread = [0, 2] // skip the experience column
  return spread[index % spread.length]
}

export function ProfilePage() {
  const columns = useResponsiveColumns()
  const custom = useStore((s) => s.profile.custom)

  const layout: ReactNode[][] = COLUMN_LAYOUT[columns].map((column) =>
    column.map((key) => {
      const Editor = SECTIONS[key]
      return <Editor key={key} />
    }),
  )

  custom.forEach((section, i) => {
    layout[customSectionColumn(i, columns)].push(
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
