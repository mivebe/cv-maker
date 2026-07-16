import { useState, type ComponentType } from 'react'
import { Plus } from 'lucide-react'
import { BasicsEditor } from '../components/editors/BasicsEditor'
import { BannerEditor } from '../components/editors/BannerEditor'
import { BrandingEditor } from '../components/editors/BrandingEditor'
import { ChartEditor } from '../components/editors/ChartEditor'
import { CustomItemsEditor } from '../components/editors/CustomItemsEditor'
import { EducationEditor } from '../components/editors/EducationEditor'
import { ExperienceEditor } from '../components/editors/ExperienceEditor'
import { LanguagesEditor } from '../components/editors/LanguagesEditor'
import { ProjectsEditor } from '../components/editors/ProjectsEditor'
import { SectionEditorCard } from '../components/editors/SectionShell'
import { SkillsEditor } from '../components/editors/SkillsEditor'
import { SliderListEditor } from '../components/editors/SliderListEditor'
import { TitleListEditor } from '../components/editors/TitleListEditor'
import { TotalsEditor } from '../components/editors/TotalsEditor'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { SectionKind } from '../schema'
import { KIND_LABELS, SECTION_KINDS } from '../lib/sections'
import { useStore } from '../store/useStore'

/**
 * The registry is keyed by KIND, not instance - that is what makes a new
 * section type cheap: one schema member, one renderer, one editor, one row
 * here.
 */
const EDITORS: Record<SectionKind, ComponentType<{ id: string }>> = {
  experience: ExperienceEditor,
  education: EducationEditor,
  skills: SkillsEditor,
  projects: ProjectsEditor,
  totals: TotalsEditor,
  items: CustomItemsEditor,
  banner: BannerEditor,
  chart: ChartEditor,
  sliders: SliderListEditor,
  titleList: TitleListEditor,
  languages: LanguagesEditor,
}

/** Label for each kind's add-item button; banner has no items. */
const ADD_LABELS: Partial<Record<SectionKind, string>> = {
  experience: 'Add role',
  education: 'Add education',
  skills: 'Add group',
  projects: 'Add project',
  totals: 'Add total',
  items: 'Add item',
  chart: 'Add slice',
  sliders: 'Add slider',
  titleList: 'Add entry',
  languages: 'Add language',
}

function AddSectionButton() {
  const addSection = useStore((s) => s.addSection)
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="default">
          <Plus />
          Add section
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5">
        <div className="grid gap-0.5">
          {SECTION_KINDS.map((kind) => (
            <Button
              key={kind}
              variant="ghost"
              className="justify-start"
              onClick={() => {
                addSection(kind)
                setOpen(false)
              }}
            >
              {KIND_LABELS[kind]}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function ProfilePage() {
  const sections = useStore((s) => s.profile.sections)
  const addItem = useStore((s) => s.addItem)

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
          <AddSectionButton />
        </div>
      </div>

      {/* One ordered list of cards, in profile.sections order: what "any
          number of any kind, reorderable" looks like. Basics and Branding are
          pinned - they are not sections. */}
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:gap-6">
        <BasicsEditor />

        {sections.map((section, i) => {
          const Editor = EDITORS[section.kind]
          const addLabel = ADD_LABELS[section.kind]
          return (
            <SectionEditorCard
              key={section.id}
              section={section}
              index={i}
              total={sections.length}
              action={
                addLabel && (
                  <Button variant="ghost" onClick={() => addItem(section.id)}>
                    <Plus />
                    {addLabel}
                  </Button>
                )
              }
            >
              <Editor id={section.id} />
            </SectionEditorCard>
          )
        })}

        <BrandingEditor />
      </div>
    </div>
  )
}
