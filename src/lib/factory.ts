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
      phone: '',
      location: '',
      summary: '',
      links: [],
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    custom: [],
  }
}

export function newLink(): Link {
  return { id: newId('lnk'), label: '', url: '' }
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
  }
}

export function newCustomSection(): CustomSection {
  return { id: newId('csec'), title: 'New Section', items: [] }
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
    overrides: {},
    basicsOverride: {},
    theme: themeFromPreset('classic'),
  }
}
