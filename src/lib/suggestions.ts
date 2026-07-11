/**
 * Autocomplete vocabularies for the profile editors.
 *
 * A suggestion pool has two halves: the built-in defaults below and whatever
 * the user has added themselves (see `store/useSuggestionsStore`). They are
 * joined at render time with the user's own entries first, then filtered by
 * `matchSuggestions`.
 *
 * Aliases exist so acronyms find their expansion: typing "GCP" surfaces both
 * "Google Cloud Platform" and "Good Clinical Practice".
 */

export type SuggestionKind =
  | 'skill'
  | 'skillGroup'
  | 'role'
  | 'organization'
  | 'degree'
  | 'institution'
  | 'location'
  | 'linkLabel'

export interface Suggestion {
  value: string
  /** Acronyms / alternate spellings that should also match this value. */
  aliases?: string[]
}

/** Human labels used in the "Add to suggestions" affordance. */
export const SUGGESTION_KIND_LABELS: Record<SuggestionKind, string> = {
  skill: 'skills',
  skillGroup: 'skill groups',
  role: 'roles',
  organization: 'organizations',
  degree: 'degrees',
  institution: 'institutions',
  location: 'locations',
  linkLabel: 'link labels',
}

const SKILLS: Suggestion[] = [
  // Languages
  { value: 'TypeScript', aliases: ['TS'] },
  { value: 'JavaScript', aliases: ['JS', 'ECMAScript'] },
  { value: 'Python' },
  { value: 'Java' },
  { value: 'C#', aliases: ['CSharp', 'C Sharp'] },
  { value: 'C++', aliases: ['CPP'] },
  { value: 'C' },
  { value: 'Go', aliases: ['Golang'] },
  { value: 'Rust' },
  { value: 'Ruby' },
  { value: 'PHP' },
  { value: 'Kotlin' },
  { value: 'Swift' },
  { value: 'Objective-C' },
  { value: 'Scala' },
  { value: 'Elixir' },
  { value: 'Dart' },
  { value: 'Haskell' },
  { value: 'Lua' },
  { value: 'Perl' },
  { value: 'R' },
  { value: 'MATLAB' },
  { value: 'Bash', aliases: ['Shell', 'Shell scripting'] },
  { value: 'PowerShell' },
  { value: 'SQL' },
  { value: 'HTML' },
  { value: 'CSS' },
  { value: 'Sass', aliases: ['SCSS'] },

  // Frontend
  { value: 'React' },
  { value: 'React Native' },
  { value: 'Next.js', aliases: ['NextJS'] },
  { value: 'Vue.js', aliases: ['Vue', 'VueJS'] },
  { value: 'Nuxt' },
  { value: 'Angular' },
  { value: 'Svelte' },
  { value: 'SvelteKit' },
  { value: 'Solid.js', aliases: ['SolidJS'] },
  { value: 'Astro' },
  { value: 'Remix' },
  { value: 'Redux' },
  { value: 'Zustand' },
  { value: 'TanStack Query', aliases: ['React Query'] },
  { value: 'Tailwind CSS', aliases: ['Tailwind'] },
  { value: 'Bootstrap' },
  { value: 'Material UI', aliases: ['MUI'] },
  { value: 'shadcn/ui' },
  { value: 'Storybook' },
  { value: 'Webpack' },
  { value: 'Vite' },
  { value: 'Babel' },
  { value: 'Three.js', aliases: ['ThreeJS'] },
  { value: 'D3.js', aliases: ['D3'] },
  { value: 'Flutter' },

  // Backend / frameworks
  { value: 'Node.js', aliases: ['NodeJS', 'Node'] },
  { value: 'Deno' },
  { value: 'Bun' },
  { value: 'Express.js', aliases: ['Express'] },
  { value: 'NestJS', aliases: ['Nest'] },
  { value: 'Fastify' },
  { value: 'Django' },
  { value: 'Flask' },
  { value: 'FastAPI' },
  { value: 'Spring Boot', aliases: ['Spring'] },
  { value: 'ASP.NET Core', aliases: ['ASP.NET', 'dotnet', '.NET'] },
  { value: '.NET', aliases: ['dotnet'] },
  { value: 'Entity Framework', aliases: ['EF Core'] },
  { value: 'Ruby on Rails', aliases: ['Rails', 'RoR'] },
  { value: 'Laravel' },
  { value: 'Symfony' },
  { value: 'Phoenix' },
  { value: 'GraphQL' },
  { value: 'gRPC' },
  { value: 'REST APIs', aliases: ['REST', 'RESTful'] },
  { value: 'WebSockets' },
  { value: 'Microservices' },
  { value: 'Event-driven architecture' },
  { value: 'Domain-Driven Design', aliases: ['DDD'] },
  { value: 'Test-Driven Development', aliases: ['TDD'] },

  // Data
  { value: 'PostgreSQL', aliases: ['Postgres'] },
  { value: 'MySQL' },
  { value: 'SQLite' },
  { value: 'Microsoft SQL Server', aliases: ['MSSQL', 'SQL Server'] },
  { value: 'Oracle Database', aliases: ['Oracle'] },
  { value: 'MongoDB', aliases: ['Mongo'] },
  { value: 'Redis' },
  { value: 'Elasticsearch', aliases: ['ELK'] },
  { value: 'Cassandra' },
  { value: 'DynamoDB' },
  { value: 'Neo4j' },
  { value: 'Prisma' },
  { value: 'Apache Kafka', aliases: ['Kafka'] },
  { value: 'RabbitMQ' },
  { value: 'Apache Spark', aliases: ['Spark', 'PySpark'] },
  { value: 'Apache Airflow', aliases: ['Airflow'] },
  { value: 'dbt' },
  { value: 'Snowflake' },
  { value: 'BigQuery' },
  { value: 'Databricks' },
  { value: 'Pandas' },
  { value: 'NumPy' },
  { value: 'scikit-learn', aliases: ['sklearn'] },
  { value: 'PyTorch' },
  { value: 'TensorFlow' },
  { value: 'Power BI', aliases: ['PowerBI'] },
  { value: 'Tableau' },

  // Cloud / infra
  { value: 'Amazon Web Services', aliases: ['AWS'] },
  { value: 'Google Cloud Platform', aliases: ['GCP'] },
  { value: 'Microsoft Azure', aliases: ['Azure'] },
  { value: 'Docker' },
  { value: 'Kubernetes', aliases: ['K8s'] },
  { value: 'Helm' },
  { value: 'Terraform' },
  { value: 'Pulumi' },
  { value: 'Ansible' },
  { value: 'Linux' },
  { value: 'Nginx' },
  { value: 'Serverless' },
  { value: 'AWS Lambda', aliases: ['Lambda'] },
  { value: 'Cloudflare Workers' },
  { value: 'Vercel' },
  { value: 'Prometheus' },
  { value: 'Grafana' },
  { value: 'Datadog' },
  { value: 'Sentry' },
  { value: 'OpenTelemetry' },

  // Tooling / process
  { value: 'Git' },
  { value: 'GitHub Actions' },
  { value: 'GitLab CI' },
  { value: 'Jenkins' },
  { value: 'TeamCity', aliases: ['Team City'] },
  { value: 'CircleCI' },
  { value: 'Azure DevOps' },
  { value: 'Octopus Deploy' },
  {
    value: 'CI/CD',
    aliases: ['Continuous Integration', 'Continuous Delivery'],
  },
  { value: 'Jira' },
  { value: 'Confluence' },
  { value: 'Microsoft Teams', aliases: ['MS Teams', 'Teams'] },
  { value: 'Slack' },
  { value: 'Figma' },
  { value: 'Notion' },
  { value: 'Jest' },
  { value: 'Vitest' },
  { value: 'Playwright' },
  { value: 'Cypress' },
  { value: 'Selenium' },
  { value: 'JUnit' },
  { value: 'pytest' },
  { value: 'Postman' },
  { value: 'Agile' },
  { value: 'Scrum' },
  { value: 'Kanban' },
  { value: 'Code review' },
  { value: 'Mentoring' },
  { value: 'Technical writing' },
  { value: 'Public speaking' },
  { value: 'Stakeholder management' },

  // Security / compliance / other domains — acronyms collide on purpose,
  // which is exactly the "GCP" case the autocomplete has to handle.
  { value: 'Good Clinical Practice', aliases: ['GCP'] },
  { value: 'General Data Protection Regulation', aliases: ['GDPR'] },
  { value: 'OAuth 2.0', aliases: ['OAuth'] },
  { value: 'OpenID Connect', aliases: ['OIDC'] },
  { value: 'SAML' },
  { value: 'Penetration testing', aliases: ['Pentesting'] },
  { value: 'Threat modelling', aliases: ['Threat modeling'] },
  { value: 'ISO 27001' },
  { value: 'SOC 2' },
]

const SKILL_GROUPS: Suggestion[] = [
  { value: 'Languages' },
  { value: 'Frontend' },
  { value: 'Backend' },
  { value: 'Databases' },
  { value: 'Cloud & DevOps' },
  { value: 'Infrastructure' },
  { value: 'Data & ML' },
  { value: 'Testing' },
  { value: 'Tools' },
  { value: 'Frameworks' },
  { value: 'Mobile' },
  { value: 'Security' },
  { value: 'Methodologies' },
  { value: 'Soft skills' },
  { value: 'Languages spoken' },
]

const ROLES: Suggestion[] = [
  { value: 'Software Engineer', aliases: ['SWE', 'Developer'] },
  { value: 'Senior Software Engineer', aliases: ['Senior Developer'] },
  { value: 'Staff Software Engineer' },
  { value: 'Principal Engineer' },
  { value: 'Frontend Engineer', aliases: ['Front-end Developer'] },
  { value: 'Backend Engineer', aliases: ['Back-end Developer'] },
  { value: 'Full Stack Engineer', aliases: ['Fullstack Developer'] },
  { value: 'Mobile Engineer' },
  { value: 'DevOps Engineer' },
  { value: 'Site Reliability Engineer', aliases: ['SRE'] },
  { value: 'Platform Engineer' },
  { value: 'Cloud Engineer' },
  { value: 'Data Engineer' },
  { value: 'Data Scientist' },
  { value: 'Data Analyst' },
  { value: 'Machine Learning Engineer', aliases: ['ML Engineer'] },
  { value: 'QA Engineer', aliases: ['Quality Assurance Engineer', 'Tester'] },
  { value: 'Automation QA Engineer' },
  { value: 'Security Engineer' },
  { value: 'Solutions Architect' },
  { value: 'Software Architect' },
  { value: 'Tech Lead', aliases: ['Technical Lead'] },
  { value: 'Engineering Manager' },
  { value: 'Product Manager', aliases: ['PM'] },
  { value: 'Project Manager' },
  { value: 'Scrum Master' },
  { value: 'Business Analyst', aliases: ['BA'] },
  { value: 'UX Designer' },
  { value: 'UI Designer' },
  { value: 'Product Designer' },
  { value: 'Technical Writer' },
  { value: 'Intern' },
  { value: 'Working Student' },
  { value: 'Freelance Developer' },
]

const DEGREES: Suggestion[] = [
  { value: 'BSc Computer Science', aliases: ['Bachelor of Science', 'BS'] },
  { value: 'MSc Computer Science', aliases: ['Master of Science', 'MS'] },
  { value: 'BSc Software Engineering' },
  { value: 'MSc Software Engineering' },
  { value: 'BSc Information Systems' },
  { value: 'BSc Mathematics' },
  { value: 'BSc Physics' },
  { value: 'BEng Electrical Engineering' },
  { value: 'BA Economics' },
  { value: 'MBA', aliases: ['Master of Business Administration'] },
  { value: 'PhD Computer Science', aliases: ['Doctorate'] },
  { value: 'High School Diploma' },
  { value: 'Bootcamp Certificate' },
  { value: 'AWS Certified Solutions Architect' },
  { value: 'Certified Kubernetes Administrator', aliases: ['CKA'] },
  { value: 'Professional Scrum Master', aliases: ['PSM'] },
]

const LINK_LABELS: Suggestion[] = [
  { value: 'GitHub' },
  { value: 'GitLab' },
  { value: 'LinkedIn' },
  { value: 'Portfolio' },
  { value: 'Website' },
  { value: 'Blog' },
  { value: 'Stack Overflow' },
  { value: 'X', aliases: ['Twitter'] },
  { value: 'Dribbble' },
  { value: 'Behance' },
  { value: 'Medium' },
  { value: 'YouTube' },
]

/** Built-in pool per kind. Kinds with no useful universal vocabulary
 *  (employers, schools, cities) start empty and fill up from user additions. */
export const DEFAULT_SUGGESTIONS: Record<SuggestionKind, Suggestion[]> = {
  skill: SKILLS,
  skillGroup: SKILL_GROUPS,
  role: ROLES,
  organization: [],
  degree: DEGREES,
  institution: [],
  location: [],
  linkLabel: LINK_LABELS,
}

const norm = (s: string) => s.trim().toLowerCase()

/**
 * Rank of a candidate against the query; lower is better, `null` = no match.
 * Tiers: value prefix < alias prefix < word-start inside value < substring.
 */
function rank(s: Suggestion, q: string): number | null {
  const value = norm(s.value)
  if (value.startsWith(q)) return 0

  const aliases = (s.aliases ?? []).map(norm)
  if (aliases.some((a) => a.startsWith(q))) return 1

  // Word-start match, so "t" finds "Microsoft Teams" and "c" finds "Cloud & DevOps".
  const words = value.split(/[^a-z0-9+#.]+/i).filter(Boolean)
  if (words.some((w) => w.startsWith(q))) return 2

  if (value.includes(q) || aliases.some((a) => a.includes(q))) return 3
  return null
}

/**
 * Filter and rank a pool for `query`. Ties keep pool order, so callers that
 * put user suggestions first in `pool` get them listed first.
 */
export function matchSuggestions(
  pool: Suggestion[],
  query: string,
  limit = 8,
): Suggestion[] {
  const q = norm(query)
  if (!q) return pool.slice(0, limit)

  return pool
    .map((s, i) => ({ s, i, r: rank(s, q) }))
    .filter((x): x is { s: Suggestion; i: number; r: number } => x.r !== null)
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.s)
}

/** Does the pool already contain this exact value (case-insensitively)? */
export function poolHas(pool: Suggestion[], value: string): boolean {
  const v = norm(value)
  return pool.some((s) => norm(s.value) === v)
}
