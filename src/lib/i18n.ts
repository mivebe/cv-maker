/**
 * The languages a variant can be written in, and the handful of words the
 * renderer prints itself rather than taking from the document: "Present" and
 * the four language stages. Also the section headings the ATS check accepts.
 * Month names come from `Intl`, so they need no table here.
 *
 * Everything else on the page is the user's own text, which a translated
 * variant overrides like any other tailoring (see lib/translate).
 */

export interface LanguageInfo {
  /** BCP 47 tag; also what `Intl` gets, so Serbian asks for Cyrillic. */
  code: string
  /** English name, for the prompt and for sorting. */
  name: string
  /** The language's own name for itself, for menus and card badges. */
  native: string
  /** Printed for an ongoing role instead of an end date. */
  present: string
  /** Beginner -> native, matching LANGUAGE_STAGES in lib/sections. */
  stages: readonly [string, string, string, string]
  /**
   * Section headings an ATS parser recognises in this language, lowercase
   * ("опит", "образование"). English ones are accepted in every language.
   */
  headings: readonly string[]
}

export const LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    native: 'English',
    present: 'Present',
    stages: ['Beginner', 'Intermediate', 'Professional', 'Native'],
    headings: [
      'experience',
      'work experience',
      'professional experience',
      'employment',
      'education',
      'skills',
      'projects',
    ],
  },
  {
    code: 'bg',
    name: 'Bulgarian',
    native: 'Български',
    present: 'настояще',
    stages: ['Начинаещ', 'Среден', 'Професионален', 'Майчин'],
    headings: [
      'опит',
      'професионален опит',
      'трудов опит',
      'образование',
      'умения',
      'проекти',
    ],
  },
  {
    code: 'ru',
    name: 'Russian',
    native: 'Русский',
    present: 'настоящее время',
    stages: ['Начальный', 'Средний', 'Профессиональный', 'Родной'],
    headings: [
      'опыт',
      'опыт работы',
      'профессиональный опыт',
      'образование',
      'навыки',
      'проекты',
    ],
  },
  {
    code: 'uk',
    name: 'Ukrainian',
    native: 'Українська',
    present: 'дотепер',
    stages: ['Початковий', 'Середній', 'Професійний', 'Рідний'],
    headings: [
      'досвід',
      'досвід роботи',
      'професійний досвід',
      'освіта',
      'навички',
      'проєкти',
      'проекти',
    ],
  },
  {
    code: 'sr-Cyrl',
    name: 'Serbian (Cyrillic)',
    native: 'Српски',
    present: 'до данас',
    stages: ['Почетни', 'Средњи', 'Професионални', 'Матерњи'],
    headings: [
      'искуство',
      'радно искуство',
      'професионално искуство',
      'образовање',
      'вештине',
      'пројекти',
    ],
  },
  {
    code: 'mk',
    name: 'Macedonian',
    native: 'Македонски',
    present: 'до денес',
    stages: ['Почетен', 'Среден', 'Професионален', 'Мајчин'],
    headings: [
      'искуство',
      'работно искуство',
      'професионално искуство',
      'образование',
      'вештини',
      'проекти',
    ],
  },
  {
    code: 'be',
    name: 'Belarusian',
    native: 'Беларуская',
    present: 'дагэтуль',
    stages: ['Пачатковы', 'Сярэдні', 'Прафесійны', 'Родны'],
    headings: [
      'вопыт',
      'вопыт работы',
      'прафесійны вопыт',
      'адукацыя',
      'навыкі',
      'праекты',
    ],
  },
  {
    code: 'de',
    name: 'German',
    native: 'Deutsch',
    present: 'heute',
    stages: [
      'Grundkenntnisse',
      'Mittelstufe',
      'Verhandlungssicher',
      'Muttersprache',
    ],
    headings: [
      'erfahrung',
      'berufserfahrung',
      'ausbildung',
      'bildung',
      'kenntnisse',
      'fähigkeiten',
      'projekte',
    ],
  },
  {
    code: 'fr',
    name: 'French',
    native: 'Français',
    present: "aujourd'hui",
    stages: ['Débutant', 'Intermédiaire', 'Professionnel', 'Langue maternelle'],
    headings: [
      'expérience',
      'expérience professionnelle',
      'formation',
      'éducation',
      'compétences',
      'projets',
    ],
  },
  {
    code: 'es',
    name: 'Spanish',
    native: 'Español',
    present: 'actualidad',
    stages: ['Principiante', 'Intermedio', 'Profesional', 'Nativo'],
    headings: [
      'experiencia',
      'experiencia laboral',
      'experiencia profesional',
      'educación',
      'formación',
      'habilidades',
      'competencias',
      'proyectos',
    ],
  },
  {
    code: 'it',
    name: 'Italian',
    native: 'Italiano',
    present: 'presente',
    stages: ['Principiante', 'Intermedio', 'Professionale', 'Madrelingua'],
    headings: [
      'esperienza',
      'esperienza lavorativa',
      'esperienza professionale',
      'istruzione',
      'formazione',
      'competenze',
      'progetti',
    ],
  },
  {
    code: 'pt',
    name: 'Portuguese',
    native: 'Português',
    present: 'atual',
    stages: ['Iniciante', 'Intermediário', 'Profissional', 'Nativo'],
    headings: [
      'experiência',
      'experiência profissional',
      'educação',
      'formação',
      'competências',
      'habilidades',
      'projetos',
    ],
  },
  {
    code: 'nl',
    name: 'Dutch',
    native: 'Nederlands',
    present: 'heden',
    stages: ['Beginner', 'Gemiddeld', 'Professioneel', 'Moedertaal'],
    headings: [
      'ervaring',
      'werkervaring',
      'opleiding',
      'vaardigheden',
      'projecten',
    ],
  },
  {
    code: 'pl',
    name: 'Polish',
    native: 'Polski',
    present: 'obecnie',
    stages: ['Podstawowy', 'Średniozaawansowany', 'Zawodowy', 'Ojczysty'],
    headings: [
      'doświadczenie',
      'doświadczenie zawodowe',
      'wykształcenie',
      'umiejętności',
      'projekty',
    ],
  },
  {
    code: 'cs',
    name: 'Czech',
    native: 'Čeština',
    present: 'současnost',
    stages: ['Začátečník', 'Středně pokročilý', 'Profesionální', 'Rodilý'],
    headings: [
      'praxe',
      'pracovní zkušenosti',
      'zkušenosti',
      'vzdělání',
      'dovednosti',
      'projekty',
    ],
  },
  {
    code: 'ro',
    name: 'Romanian',
    native: 'Română',
    present: 'prezent',
    stages: ['Începător', 'Intermediar', 'Profesional', 'Nativ'],
    headings: [
      'experiență',
      'experiență profesională',
      'educație',
      'studii',
      'competențe',
      'abilități',
      'proiecte',
    ],
  },
  {
    code: 'el',
    name: 'Greek',
    native: 'Ελληνικά',
    present: 'σήμερα',
    stages: ['Αρχάριος', 'Μέσος', 'Επαγγελματικός', 'Μητρική'],
    headings: [
      'εμπειρία',
      'επαγγελματική εμπειρία',
      'εκπαίδευση',
      'δεξιότητες',
      'έργα',
    ],
  },
  {
    code: 'tr',
    name: 'Turkish',
    native: 'Türkçe',
    present: 'günümüz',
    stages: ['Başlangıç', 'Orta', 'Profesyonel', 'Ana dil'],
    headings: [
      'deneyim',
      'iş deneyimi',
      'eğitim',
      'beceriler',
      'yetenekler',
      'projeler',
    ],
  },
]

export const DEFAULT_LANGUAGE = 'en'

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]))

/** Unknown codes (a hand-edited import) fall back to English words. */
export function languageInfo(code: string | undefined): LanguageInfo {
  return BY_CODE.get(code ?? DEFAULT_LANGUAGE) ?? LANGUAGES[0]
}

/** Short badge text: `EN`, `BG`, `SR`. */
export function languageBadge(code: string | undefined): string {
  return (code ?? DEFAULT_LANGUAGE).split('-')[0].toUpperCase()
}

const monthCache = new Map<string, string[]>()

/**
 * Month names in `code`, standalone form ("март", not "марта"), as `Intl`
 * gives them. English keeps the hand-written table in lib/dates so existing
 * CVs render byte for byte as before.
 */
export function monthNames(code: string, width: 'long' | 'short'): string[] {
  const cacheKey = `${code}|${width}`
  const hit = monthCache.get(cacheKey)
  if (hit) return hit
  let names: string[]
  try {
    const fmt = new Intl.DateTimeFormat(code, { month: width })
    names = Array.from({ length: 12 }, (_, i) =>
      fmt.format(new Date(2000, i, 1)),
    )
    // Some locales (Bulgarian) have no short month names and give "03"; a CV
    // wants a word, so cut the long name instead.
    if (width === 'short' && names.some((n) => /^\d+$/.test(n)))
      names = monthNames(code, 'long').map((n) => n.slice(0, 3))
  } catch {
    names = []
  }
  monthCache.set(cacheKey, names)
  return names
}
