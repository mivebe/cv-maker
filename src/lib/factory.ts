import type {
  Branding,
  ChartItem,
  CustomItem,
  CVVariant,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  Link,
  MasterProfile,
  ProjectItem,
  Section,
  SectionItem,
  SectionKind,
  SkillGroup,
  SliderItem,
  TitleItem,
  TotalItem,
} from '../schema'
import { newId } from './id'
import { KIND_LABELS } from './sections'
import { themeFromPreset } from '../cv/themes'

export function emptyBranding(): Branding {
  return {
    enabled: false,
    company: '',
    tagline: '',
    url: '',
    logo: '',
    logoAlt: '',
    accentColor: '',
    issuedFor: '',
    issuedDate: '',
    contact: '',
    note: '',
    reference: '',
  }
}

export function emptyProfile(): MasterProfile {
  return {
    basics: {
      name: '',
      headline: '',
      email: '',
      phoneCode: '',
      phone: '',
      location: '',
      summary: '',
      links: [],
      photo: '',
      photoAlt: '',
    },
    sections: [],
    branding: emptyBranding(),
  }
}

export function newLink(): Link {
  return { id: newId('lnk'), label: '', url: '', icon: 'link' }
}

export function newExperience(): ExperienceItem {
  return {
    id: newId('exp'),
    role: '',
    organization: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    summary: '',
    highlights: [],
    tagsLabel: '',
    tags: [],
  }
}

export function newEducation(): EducationItem {
  return {
    id: newId('edu'),
    degree: '',
    institution: '',
    location: '',
    startDate: '',
    endDate: '',
    details: '',
  }
}

export function newSkillGroup(): SkillGroup {
  return { id: newId('skg'), name: '', skills: [] }
}

export function newProject(): ProjectItem {
  return {
    id: newId('prj'),
    name: '',
    url: '',
    description: '',
    highlights: [],
    icon: 'globe',
    badge: '',
    meta: '',
  }
}

export function newCustomItem(): CustomItem {
  return {
    id: newId('cit'),
    title: '',
    subtitle: '',
    date: '',
    description: '',
    highlights: [],
    icon: '',
    meta: '',
    tagsLabel: '',
    tags: [],
  }
}

export function newTotal(): TotalItem {
  return { id: newId('tot'), label: '', value: '', icon: '' }
}

export function newChartItem(): ChartItem {
  return { id: newId('cht'), title: '', value: 0, icon: '' }
}

export function newSliderItem(): SliderItem {
  return { id: newId('sld'), title: '', subtitle: '', value: 1 }
}

export function newTitleItem(): TitleItem {
  return { id: newId('ttl'), icon: '', title: '', subtitle: '' }
}

export function newLanguageItem(): LanguageItem {
  return { id: newId('lng'), name: '', level: 1 }
}

/**
 * Item factory per kind, so the store's generic `addItem(sectionId)` can mint
 * the right item shape from the section it lands in. `banner` has no items.
 */
export const ITEM_FACTORIES: Record<
  SectionKind,
  () => SectionItem | null
> = {
  experience: newExperience,
  education: newEducation,
  skills: newSkillGroup,
  projects: newProject,
  totals: newTotal,
  items: newCustomItem,
  banner: () => null,
  chart: newChartItem,
  sliders: newSliderItem,
  titleList: newTitleItem,
  languages: newLanguageItem,
}

/** A fresh section of the given kind, titled with the kind's default label. */
export function newSection(kind: SectionKind): Section {
  return {
    id: newId('sec'),
    kind,
    title: KIND_LABELS[kind],
    subtitle: '',
    options: {},
    items: [],
  } as Section
}

export function newVariant(
  profile: MasterProfile,
  name = 'New Variant',
): CVVariant {
  return {
    id: newId('var'),
    name,
    targetRole: '',
    include: {},
    sectionOrder: profile.sections.map((s) => s.id),
    hiddenSections: [],
    sectionTitles: {},
    sectionLayout: {},
    optionDefaults: {},
    sectionOptions: {},
    overrides: {},
    basicsOverride: {},
    theme: themeFromPreset('showcase'),
  }
}
