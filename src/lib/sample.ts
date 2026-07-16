import type { AppData } from '../schema'
import { themeFromPreset } from '../cv/themes'
import { reconcileSectionOrder } from './sections'

/**
 * Seed data so a first-time visitor sees a fully worked example instead of an
 * empty shell. The persona is fictional on purpose - this is a demo document,
 * not anyone's CV - but it is deliberately dense: it exercises every renderer
 * feature at once, and specifically the things the one-sections-array format
 * exists for:
 *
 * - TWO experience sections ("Experience", "Teaching & Mentoring") - N per kind.
 * - TWO chart sections, one `pie` (side column) and one `bar` (main column) -
 *   per-section chartType, and the same kind reflowing narrow vs wide.
 * - One sliders, one title list and one languages section.
 * - The `ats` variant strips decoration via `optionDefaults` (the blanket
 *   policy layer) and re-adds one thing via `sectionOptions` (the per-section
 *   layer beating the policy).
 *
 * Ids are stable strings (not generated) so variants can reference master
 * sections and items deterministically.
 */

/**
 * A fictional issuer's mark, inline for the same reason as the portrait. Being
 * an SVG data URL it also exercises the branding logo's main real-world form:
 * an image pasted into the editor, which has to survive JSON export.
 */
const PLACEHOLDER_LOGO =
  'data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2064%2064%27%3E%3Ccircle%20cx=%2732%27%20cy=%2732%27%20r=%2728%27%20fill=%27none%27%20stroke=%27%232f80ed%27%20stroke-width=%276%27/%3E%3Cpath%20d=%27M20%2042%20L32%2020%20L44%2042%27%20fill=%27none%27%20stroke=%27%232f80ed%27%20stroke-width=%276%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27/%3E%3C/svg%3E'

/** A neutral placeholder portrait, inline so the sample needs no asset files. */
const PLACEHOLDER_AVATAR =
  'data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%20200%20200%27%3E%3Crect%20width=%27200%27%20height=%27200%27%20fill=%27%231f2937%27/%3E%3Ccircle%20cx=%27100%27%20cy=%2778%27%20r=%2734%27%20fill=%27%2393c5fd%27/%3E%3Cpath%20d=%27M28%20190c8-40%2036-58%2072-58s64%2018%2072%2058z%27%20fill=%27%2393c5fd%27/%3E%3C/svg%3E'

const profile: AppData['profile'] = {
  basics: {
    name: 'Alex Rivera',
    headline: 'Senior Full Stack Engineer',
    email: 'alex.rivera@example.com',
    phoneCode: '+44',
    phone: '20 7946 0958',
    location: 'Remote / London, UK',
    summary:
      'Full stack engineer with **8 years** building product and platform: React front ends, Node services, and the CI that ships them. Comfortable owning a feature **from discovery to on-call** - and happiest where design, performance and data meet.',
    photo: PLACEHOLDER_AVATAR,
    photoAlt: 'Placeholder portrait',
    links: [
      {
        id: 'lnk_gh',
        label: 'GitHub',
        url: 'https://github.com/example',
        icon: 'github',
      },
      {
        id: 'lnk_li',
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/in/example',
        icon: 'linkedin',
      },
      {
        id: 'lnk_site',
        label: 'alexrivera.example.com',
        url: 'https://alexrivera.example.com',
        icon: 'globe',
      },
      {
        id: 'lnk_so',
        label: 'Stack Overflow',
        url: 'https://stackoverflow.com/users/1',
        icon: 'stackoverflow',
      },
    ],
  },

  sections: [
    {
      id: 'sec_experience',
      kind: 'experience',
      title: 'Experience',
      subtitle: '',
      options: {},
      items: [
        {
          id: 'exp_northwind',
          role: 'Senior Full Stack Engineer',
          organization: 'Northwind Labs',
          location: 'Remote',
          startDate: '02/2023',
          endDate: '',
          current: true,
          summary:
            'Second engineer on a design-tooling product that grew to **40k monthly users**.',
          tagsLabel: 'Stack',
          tags: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
          highlights: [
            'Rebuilt the editor canvas around an immutable document model, cutting **p95 interaction latency from 180ms to 40ms**.',
            'Designed the plugin API and its sandbox; **60+ community plugins** shipped in the first year.',
            'Led the migration from a monolith to four services without a single planned downtime window.',
            'Set up trunk-based delivery: **12 deploys a day**, mean recovery under 10 minutes.',
            'Mentored three engineers through their first production incidents and their first RFCs.',
          ],
        },
        {
          id: 'exp_helios',
          role: 'Front End Engineer',
          organization: 'Helios Interactive',
          location: 'Berlin, DE',
          startDate: '06/2020',
          endDate: '01/2023',
          current: false,
          summary: '',
          tagsLabel: 'Stack',
          tags: ['React', 'WebGL', 'Three.js', 'GSAP', 'Storybook'],
          highlights: [
            'Built the rendering layer for an interactive product configurator used by **9 automotive brands**.',
            'Cut first-paint on the 3D viewer by **2.4s** with asset streaming and a texture budget per device tier.',
            'Owned the shared component library: 80+ components, visual regression tests, adopted by 5 teams.',
            'Wrote the accessibility playbook; the flagship app went from **62 to 98 on Lighthouse a11y**.',
          ],
        },
        {
          id: 'exp_meridian',
          role: 'Software Engineer',
          organization: 'Meridian Financial',
          location: 'London, UK',
          startDate: '09/2018',
          endDate: '05/2020',
          current: false,
          summary: '',
          tagsLabel: '',
          tags: [],
          highlights: [
            'Worked on **3 micro-frontend** apps for a retail banking portal serving 1.2M customers.',
            'Built the reconciliation service that closed the books nightly - **zero missed runs in 18 months**.',
            'Introduced contract tests between front end and BFF, ending a recurring class of release bugs.',
          ],
        },
        {
          id: 'exp_freelance',
          role: 'Freelance Web Developer',
          organization: '',
          location: '',
          startDate: '01/2017',
          endDate: '08/2018',
          current: false,
          summary: '',
          tagsLabel: '',
          tags: [],
          highlights: [
            'Delivered **14 projects idea-to-production** for small businesses: build, design, SEO, handover.',
            'Worked directly with clients on scope, budget and maintenance retainers.',
          ],
        },
      ],
    },

    // A second experience section: the case the fixed-shape profile could not
    // express at all ("you get exactly one Experience").
    {
      id: 'sec_teaching',
      kind: 'experience',
      title: 'Teaching & Mentoring',
      subtitle: '',
      options: {},
      items: [
        {
          id: 'exp_lecturer',
          role: 'Guest Lecturer, Web Performance',
          organization: 'University of Example',
          location: 'London, UK',
          startDate: '10/2023',
          endDate: '',
          current: true,
          summary: '',
          tagsLabel: '',
          tags: [],
          highlights: [
            'Six-lecture module on rendering performance for the MSc programme; **~90 students a year**.',
          ],
        },
        {
          id: 'exp_bootcamp',
          role: 'Mentor',
          organization: 'Example Bootcamp',
          location: 'Remote',
          startDate: '03/2021',
          endDate: '12/2022',
          current: false,
          summary: '',
          tagsLabel: '',
          tags: [],
          highlights: [
            'Weekly 1:1s with career changers; **11 of 14 mentees** hired within three months of graduating.',
          ],
        },
      ],
    },

    {
      id: 'sec_education',
      kind: 'education',
      title: 'Education',
      subtitle: '',
      options: {},
      items: [
        {
          id: 'edu_msc',
          degree: 'MSc, Computer Science',
          institution: 'University of Example',
          location: 'London, UK',
          startDate: '2016',
          endDate: '2018',
          details: 'Thesis on incremental rendering for collaborative editors.',
        },
        {
          id: 'edu_bsc',
          degree: 'BSc, Software Engineering',
          institution: 'Example Institute of Technology',
          location: '',
          startDate: '2012',
          endDate: '2016',
          details: '',
        },
      ],
    },

    {
      id: 'sec_skills',
      kind: 'skills',
      title: 'Skills',
      subtitle: '',
      options: {},
      items: [
        {
          id: 'skg_lang',
          name: 'Languages & Core',
          skills: [
            'TypeScript',
            'JavaScript',
            'Python',
            'Go',
            'SQL',
            'HTML',
            'CSS',
            'OOP',
            'Functional programming',
          ],
        },
        {
          id: 'skg_frontend',
          name: 'Front End',
          skills: [
            'React',
            'Next.js',
            'Zustand',
            'Redux',
            'Tailwind CSS',
            'Vite',
            'Three.js',
            'WebGL',
            'GSAP',
            'Storybook',
            'Playwright',
          ],
        },
        {
          id: 'skg_platform',
          name: 'Back End & Platform',
          skills: [
            'Node.js',
            'Fastify',
            'GraphQL',
            'PostgreSQL',
            'Redis',
            'Docker',
            'Kubernetes',
            'AWS',
            'Terraform',
            'GitHub Actions',
            'OpenTelemetry',
          ],
        },
      ],
    },

    {
      id: 'sec_projects',
      kind: 'projects',
      title: 'Projects',
      subtitle: '',
      options: {},
      items: [
        {
          id: 'prj_atlas',
          name: 'atlas-ui',
          url: 'github.com/example/atlas-ui',
          description:
            'Headless component primitives with a print-safe layout mode.',
          highlights: [],
          icon: 'github',
          badge: '2.1k stars',
          meta: 'MIT',
        },
        {
          id: 'prj_ledger',
          name: 'ledger-cli',
          url: 'github.com/example/ledger-cli',
          description: 'A tiny double-entry bookkeeping CLI, written in Go.',
          highlights: [],
          icon: 'github',
          badge: '',
          meta: '',
        },
        {
          id: 'prj_playground',
          name: 'shader-playground',
          url: 'example.github.io/shader-playground',
          description: 'Live GLSL editor with a gallery of annotated examples.',
          highlights: [],
          icon: 'globe',
          badge: 'live',
          meta: '',
        },
        {
          id: 'prj_perfkit',
          name: 'perfkit',
          url: 'example.github.io/perfkit',
          description: 'Browser performance budgets as a CI check.',
          highlights: [],
          icon: 'globe',
          badge: 'live',
          meta: '',
        },
        {
          id: 'prj_notes',
          name: 'notes-sync',
          url: 'github.com/example/notes-sync',
          description: 'CRDT note syncing over WebRTC. Archived experiment.',
          highlights: [],
          icon: 'github',
          badge: 'archived',
          meta: '',
        },
      ],
    },

    // Chart #1: a pie in the side column (narrow -> chart above legend).
    {
      id: 'sec_focus',
      kind: 'chart',
      title: 'Focus Areas',
      subtitle: '',
      options: {},
      items: [
        { id: 'cha_frontend', title: 'Frontend', value: 45, icon: 'react' },
        { id: 'cha_backend', title: 'Backend', value: 30, icon: 'nodedotjs' },
        { id: 'cha_infra', title: 'Infra', value: 25, icon: 'docker' },
      ],
    },

    // Chart #2: a bar chart in the main column - same kind, different
    // chartType. This pair is the case that forced options onto the section
    // rather than the theme.
    {
      id: 'sec_week',
      kind: 'chart',
      title: 'A Typical Week',
      subtitle: 'Hours by activity',
      // No chartValueFormat: `auto` renders a bar chart's values raw.
      options: { chartType: 'bar' },
      items: [
        { id: 'chw_build', title: 'Building', value: 22, icon: '' },
        { id: 'chw_review', title: 'Code review', value: 8, icon: '' },
        { id: 'chw_mentor', title: 'Mentoring', value: 5, icon: '' },
        { id: 'chw_design', title: 'Design & RFCs', value: 5, icon: '' },
      ],
    },

    {
      id: 'sec_tooling',
      kind: 'sliders',
      title: 'Tooling Depth',
      subtitle: '',
      options: { sliderStartLabel: 'Novice', sliderEndLabel: 'Expert' },
      items: [
        { id: 'sli_react', title: 'React', subtitle: '', value: 5 },
        { id: 'sli_ts', title: 'TypeScript', subtitle: '', value: 5 },
        { id: 'sli_node', title: 'Node.js', subtitle: '', value: 4 },
        { id: 'sli_go', title: 'Go', subtitle: 'Services & CLIs', value: 3 },
        { id: 'sli_k8s', title: 'Kubernetes', subtitle: '', value: 3 },
      ],
    },

    {
      id: 'sec_certs',
      kind: 'titleList',
      title: 'Certifications',
      subtitle: '',
      options: {},
      items: [
        {
          id: 'ttl_aws',
          icon: 'amazonwebservices',
          title: 'AWS Solutions Architect – Associate',
          subtitle: '2024',
        },
        {
          id: 'ttl_cka',
          icon: 'kubernetes',
          title: 'Certified Kubernetes Administrator',
          subtitle: '2023',
        },
        {
          id: 'ttl_gcp',
          icon: 'googlecloud',
          title: 'GCP Professional Cloud Developer',
          subtitle: '2022',
        },
      ],
    },

    {
      id: 'sec_languages',
      kind: 'languages',
      title: 'Languages',
      subtitle: '',
      options: { languageDisplay: 'notches' },
      items: [
        { id: 'lang_en', name: 'English', level: 4 },
        { id: 'lang_de', name: 'German', level: 3 },
        { id: 'lang_es', name: 'Spanish', level: 1 },
      ],
    },

    {
      id: 'sec_banner',
      kind: 'banner',
      title: 'Selected Work & Community',
      subtitle: 'Side projects, talks and open source',
      options: {},
      items: [],
    },

    {
      id: 'sec_products',
      kind: 'items',
      title: 'Side Products',
      subtitle: '',
      options: {},
      items: [
        {
          id: 'cit_tidepool',
          title: 'Tidepool',
          subtitle: 'Offline-first habit tracker',
          date: '03/2024 – 01/2025',
          meta: 'iOS App Store & Google Play',
          icon: '',
          description: '',
          tagsLabel: 'TechStack',
          tags: ['React Native', 'Expo', 'SQLite', 'Fastify', 'Firebase'],
          highlights: [
            'Shipped solo to both stores; **4.7 stars** across 900+ ratings.',
            'Conflict-free local-first sync, so the app is fully usable on a plane.',
            'Wrote the store listings, the pricing model and the support flow.',
          ],
        },
        {
          id: 'cit_stacksmith',
          title: 'Stacksmith',
          subtitle: 'CI cost dashboard',
          date: '06/2023 – 11/2023',
          meta: 'Open beta',
          icon: '',
          description: '',
          tagsLabel: 'TechStack',
          tags: ['TypeScript', 'Next.js', 'PostgreSQL', 'GitHub Actions API'],
          highlights: [
            'Surfaces the **10 workflows burning the most CI minutes** in a repo, with a fix suggested per job.',
            'Saved the pilot team **~$1.4k/month** in runner spend within three weeks.',
          ],
        },
      ],
    },

    {
      id: 'sec_hardware',
      kind: 'items',
      title: 'Hardware & Tinkering',
      subtitle: '',
      options: {},
      items: [
        {
          id: 'cit_greenhouse',
          title: 'Greenhouse climate controller',
          subtitle: '',
          date: '09/2024 – 02/2025',
          meta: '',
          icon: '',
          description: '',
          tagsLabel: 'TechStack',
          tags: ['C/C++', 'ESP32', 'MQTT', 'Grafana'],
          highlights: [
            '**End-to-end ownership**: sensor selection, custom PCB, firmware, dashboard, deployment.',
            'Closed-loop vent and irrigation control; **cut water use by 30%** over a season.',
            'MQTT to a cloud broker, with a local fallback loop when the link drops.',
          ],
        },
      ],
    },

    {
      id: 'sec_talks',
      kind: 'items',
      title: 'Talks & Writing',
      subtitle: '',
      options: {},
      items: [
        {
          id: 'cit_talk_render',
          title: 'Rendering 10k nodes without dropping a frame',
          subtitle: '',
          date: '05/2025',
          meta: 'ExampleConf, Amsterdam',
          icon: '',
          description: '',
          tagsLabel: '',
          tags: [],
          highlights: [
            'Conference talk on virtualization, layout thrash and the cost of `getBoundingClientRect`.',
          ],
        },
        {
          id: 'cit_blog',
          title: 'Monthly engineering notes',
          subtitle: '',
          date: '2021 – present',
          meta: 'alexrivera.example.com/notes',
          icon: '',
          description: '',
          tagsLabel: '',
          tags: [],
          highlights: [
            'Long-form posts on performance and tooling; **~6k readers a month**.',
          ],
        },
      ],
    },

    {
      id: 'sec_totals',
      kind: 'totals',
      title: 'Totals',
      subtitle: '',
      options: {},
      items: [
        { id: 'tot_js', label: 'JavaScript', value: '8y', icon: 'javascript' },
        { id: 'tot_ts', label: 'TypeScript', value: '7y', icon: 'typescript' },
        { id: 'tot_html', label: 'HTML / CSS', value: '8y', icon: 'html5' },
        { id: 'tot_react', label: 'React', value: '7y', icon: 'react' },
        { id: 'tot_next', label: 'Next.js', value: '5y', icon: 'nextdotjs' },
        { id: 'tot_node', label: 'Node.js', value: '6y', icon: 'nodedotjs' },
        { id: 'tot_gql', label: 'GraphQL', value: '4y', icon: 'graphql' },
        { id: 'tot_pg', label: 'PostgreSQL', value: '6y', icon: 'postgresql' },
        { id: 'tot_docker', label: 'Docker', value: '5y', icon: 'docker' },
        { id: 'tot_aws', label: 'AWS', value: '4y', icon: 'amazonwebservices' },
        { id: 'tot_three', label: 'Three.js', value: '3y', icon: 'threedotjs' },
        { id: 'tot_figma', label: 'Figma', value: '4y', icon: 'figma' },
      ],
    },
  ],

  branding: {
    enabled: true,
    company: 'Northwind Talent',
    tagline: 'Engineering placements, done properly',
    url: 'northwind.example.com',
    logo: PLACEHOLDER_LOGO,
    logoAlt: 'Northwind Talent',
    accentColor: '#2f80ed',
    issuedFor: 'Prepared for Contoso Ltd',
    issuedDate: 'March 2026',
    contact: 'hello@northwind.example.com',
    note: 'Confidential - not for redistribution',
    reference: 'REF NW-2291',
  },
}

/** The reference two-page layout: everything on, both columns, both charts. */
const showcase: AppData['variants'][number] = {
  id: 'var_showcase',
  name: 'Showcase - Full Stack',
  targetRole: 'Senior Full Stack Engineer',
  include: {},
  sectionOrder: [
    'sec_experience',
    'sec_skills',
    'sec_projects',
    'sec_education',
    'sec_banner',
    'sec_products',
    'sec_week',
    'sec_certs',
    'sec_teaching',
    'sec_focus',
    'sec_languages',
    'sec_tooling',
    'sec_talks',
    'sec_hardware',
    'sec_totals',
  ],
  // Hardware and Talks appear in the ATS variant; here they would push page 2
  // onto a third sheet.
  hiddenSections: ['sec_hardware', 'sec_talks'],
  sectionTitles: {
    sec_skills: 'Technical Skills',
    sec_projects: 'Open Source',
  },
  sectionLayout: {
    sec_experience: { column: 'main', pageBreakBefore: false },
    sec_skills: { column: 'side', pageBreakBefore: false },
    sec_projects: { column: 'side', pageBreakBefore: false },
    sec_education: { column: 'side', pageBreakBefore: false },
    // Page 2 starts here.
    sec_banner: { column: 'full', pageBreakBefore: true },
    sec_products: { column: 'main', pageBreakBefore: false },
    sec_week: { column: 'main', pageBreakBefore: false },
    sec_certs: { column: 'main', pageBreakBefore: false },
    sec_teaching: { column: 'side', pageBreakBefore: false },
    sec_focus: { column: 'side', pageBreakBefore: false },
    sec_languages: { column: 'side', pageBreakBefore: false },
    sec_tooling: { column: 'side', pageBreakBefore: false },
    sec_talks: { column: 'side', pageBreakBefore: false },
    sec_totals: { column: 'full', pageBreakBefore: false },
  },
  optionDefaults: {},
  // Per-variant, per-section: this variant alone moves the dates of the main
  // experience section up onto the title row.
  sectionOptions: {
    sec_experience: { datePosition: 'right' },
  },
  overrides: {},
  basicsOverride: {},
  theme: themeFromPreset('showcase'),
}

/** The same content, stripped to what a parser can read. */
const atsVariant: AppData['variants'][number] = {
  id: 'var_ats',
  name: 'ATS-safe',
  targetRole: 'Full Stack Engineer',
  include: {},
  sectionOrder: [
    'sec_experience',
    'sec_teaching',
    'sec_skills',
    'sec_education',
    'sec_certs',
    'sec_languages',
    'sec_projects',
    'sec_products',
    'sec_hardware',
    'sec_talks',
    'sec_tooling',
    'sec_focus',
    'sec_week',
    'sec_totals',
  ],
  hiddenSections: ['sec_banner'],
  // Left at the defaults on purpose: an ATS matches on "Skills"/"Projects".
  sectionTitles: {},
  sectionLayout: {},
  // The blanket policy layer: strip decoration from every section at once.
  optionDefaults: {
    languageDisplay: 'words',
    chartMarker: 'none',
    showIcons: false,
    rowDividers: false,
  },
  // The per-section layer beats the policy: the totals grid keeps its vertical
  // rules - they are CSS borders, invisible to a text extractor.
  sectionOptions: {
    sec_totals: { rowDividers: true },
  },
  overrides: {},
  basicsOverride: {},
  theme: themeFromPreset('ats'),
}

/**
 * The tailoring demo: same master content, cut to one page for a front-end
 * role. It drops items with `include`, rewrites the pitch with `basicsOverride`
 * and re-angles a single role with `overrides` - none of which touches the
 * master profile.
 */
const frontendVariant: AppData['variants'][number] = {
  id: 'var_frontend',
  name: 'One-page - Front End',
  targetRole: 'Senior Front End Engineer',
  include: {
    // Older and less relevant history, hidden for this pitch only.
    exp_meridian: false,
    exp_freelance: false,
    edu_bsc: false,
    prj_ledger: false,
    prj_perfkit: false,
    prj_notes: false,
    // One page means one skills group: the on-message one.
    skg_lang: false,
    skg_platform: false,
  },
  sectionOrder: [
    'sec_experience',
    'sec_skills',
    'sec_focus',
    'sec_projects',
    'sec_education',
    'sec_totals',
  ],
  // Everything a one-pager has no room for, the totals grid included.
  hiddenSections: [
    'sec_teaching',
    'sec_week',
    'sec_tooling',
    'sec_certs',
    'sec_languages',
    'sec_banner',
    'sec_products',
    'sec_hardware',
    'sec_talks',
    'sec_totals',
  ],
  sectionTitles: { sec_projects: 'Selected Work' },
  sectionLayout: {
    sec_experience: { column: 'main', pageBreakBefore: false },
    sec_skills: { column: 'side', pageBreakBefore: false },
    sec_focus: { column: 'side', pageBreakBefore: false },
    sec_projects: { column: 'side', pageBreakBefore: false },
    sec_education: { column: 'side', pageBreakBefore: false },
    sec_totals: { column: 'full', pageBreakBefore: false },
  },
  optionDefaults: {},
  sectionOptions: {
    // A front-end pitch gets a front-end chart: same section, donut here.
    sec_focus: { chartType: 'donut' },
  },
  overrides: {
    // Same job, told as a front-end story.
    exp_northwind: {
      role: 'Senior Front End Engineer',
      highlights: [
        'Rebuilt the editor canvas around an immutable document model, cutting **p95 interaction latency from 180ms to 40ms**.',
        'Designed the plugin API and its sandbox; **60+ community plugins** shipped in the first year.',
        'Owned the design system and its visual regression suite across five product surfaces.',
      ],
    },
    // The thesis line is the first thing a one-pager can live without.
    edu_msc: { details: '' },
  },
  basicsOverride: {
    headline: 'Senior Front End Engineer',
    summary:
      'Front end engineer who cares about **the frame budget and the accessibility tree** in equal measure. Eight years of React, rendering performance and design systems - most recently as the second engineer on a design tool used by 40k people a month.',
  },
  theme: themeFromPreset('modern'),
}

export function sampleData(): AppData {
  // Ensure variant section orders line up with the sections that exist.
  return {
    version: 2,
    profile,
    variants: [showcase, atsVariant, frontendVariant].map((v) => ({
      ...v,
      sectionOrder: reconcileSectionOrder(v.sectionOrder, profile),
    })),
  }
}
