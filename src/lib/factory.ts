import type {
  CustomItem,
  CustomSection,
  CVVariant,
  EducationItem,
  ExperienceItem,
  Link,
  MasterProfile,
  ProjectItem,
  SkillGroup,
  TotalItem,
} from '../schema'
import { newId } from './id'
import { allSectionKeys } from './sections'
import { themeFromPreset } from '../cv/themes'

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
    experience: [],
    education: [],
    skills: [],
    projects: [],
    custom: [],
    totals: [],
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

export function newCustomSection(): CustomSection {
  return {
    id: newId('csec'),
    title: 'New Section',
    items: [],
    subtitle: '',
    display: 'items',
    columns: 1,
  }
}

export function newTotal(): TotalItem {
  return { id: newId('tot'), label: '', value: '', icon: '' }
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
    sectionOrder: allSectionKeys(profile),
    hiddenSections: [],
    sectionTitles: {},
    sectionLayout: {},
    overrides: {},
    basicsOverride: {},
    theme: themeFromPreset('showcase'),
  }
}
