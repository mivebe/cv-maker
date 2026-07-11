import type { ComponentType } from 'react'
import { BasicsEditor } from '../components/editors/BasicsEditor'
import { ExperienceEditor } from '../components/editors/ExperienceEditor'
import { EducationEditor } from '../components/editors/EducationEditor'
import { SkillsEditor } from '../components/editors/SkillsEditor'
import { ProjectsEditor } from '../components/editors/ProjectsEditor'
import { CustomSectionsEditor } from '../components/editors/CustomSectionsEditor'
import { useResponsiveColumns, type ColumnCount } from '../hooks/useResponsiveColumns'

type SectionKey =
  | 'basics'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'custom'

const SECTIONS: Record<SectionKey, ComponentType> = {
  basics: BasicsEditor,
  experience: ExperienceEditor,
  education: EducationEditor,
  skills: SkillsEditor,
  projects: ProjectsEditor,
  custom: CustomSectionsEditor,
}

/**
 * Which sections live in which column, per column count. The assignment is
 * fixed rather than height-balanced on purpose: these are forms, and a card
 * that hops columns while you type is worse than a slightly uneven column.
 * Experience is by far the tallest section, so it gets a column to itself as
 * soon as there are three.
 */
const COLUMN_LAYOUT: Record<ColumnCount, SectionKey[][]> = {
  1: [['basics', 'experience', 'education', 'skills', 'projects', 'custom']],
  2: [
    ['basics', 'experience'],
    ['skills', 'education', 'projects', 'custom'],
  ],
  3: [
    ['basics', 'skills'],
    ['experience'],
    ['education', 'projects', 'custom'],
  ],
}

export function ProfilePage() {
  const columns = useResponsiveColumns()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Master Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your complete CV content, entered once. Every variant draws from this.
          Changes save automatically.
        </p>
      </div>

      <div
        className="grid items-start gap-4 sm:gap-6"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {COLUMN_LAYOUT[columns].map((column, i) => (
          <div key={i} className="flex min-w-0 flex-col gap-4 sm:gap-6">
            {column.map((key) => {
              const Editor = SECTIONS[key]
              return <Editor key={key} />
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
